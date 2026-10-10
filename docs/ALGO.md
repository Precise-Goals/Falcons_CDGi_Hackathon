# ALGORITHM.md: Intra Core Algorithm + Brutal Check

> Part A designs the algorithm, borrowing proven methods from the literature. Part B is a hard, unflattering audit of whether the whole plan really solves the challenge.
> Reference note: methods and citations below come from established literature as I know it; they were not re-verified live in this session except SAGAI-MID/MID (arXiv 2603.28731, abstract only). Verify before citing externally.

---

# PART A: THE ALGORITHM

## A.0 One-paragraph summary

Intra treats each external endpoint as a **stream** and learns a compact, statistical **behavioural model** of it (sketches + mined invariants). It detects change with **two independent tests** (invariant violations and sequential change-point detection) so a single noisy signal cannot raise a verdict. To judge *meaning*, it prefers **aligned evidence**: the same entity seen before and after the change, giving old/new value **pairs**. From pairs it **synthesizes** a transformation from a small typed DSL (programming-by-example), verifies it on held-out pairs, and scores it with a **calibrated confidence**. A **cost-sensitive policy** then chooses auto-apply, propose, or quarantine, and a **sequential test (SPRT)** governs canary promotion or rollback. A **logistic rollout model** forecasts cutover.

## A.1 Pipeline with the algorithm used at each stage

| Stage | Algorithm | Source idea |
|---|---|---|
| Summarize traffic cheaply | Streaming sketches: t-digest (quantiles), HyperLogLog (cardinality), Count-Min / top-k (frequent values), reservoir sample | Dunning t-digest; Flajolet et al. HLL; Cormode & Muthukrishnan Count-Min |
| Learn "normal" | **Invariant mining** per field and per endpoint (type, range, regex class, nullability, enum set, relations such as `total ≈ Σ items.price`) with support counts | Ernst et al., Daikon (2001) |
| Detect change, layer 1 | Invariant **violation rate** over a sliding window | Daikon-style likely invariants; specification mining |
| Detect change, layer 2 | **Sequential change-point detection** on field/behaviour metrics (null rate, quantiles, size, latency, error rate): CUSUM for speed, BOCPD for run-length posterior | Page 1954; Adams & MacKay 2007; Killick et al. PELT 2012 |
| Confirm distribution shift | Two-sample test on sketches: KS / Jensen-Shannon / Wasserstein, with minimum sample size | Concept-drift literature: Gama et al. 2014; ADWIN (Bifet & Gavaldà 2007) |
| Match old to new fields | Instance-based **schema matching** with a composite score, then optimal 1-to-1 assignment by the Hungarian algorithm | Rahm & Bernstein 2001 survey; COMA (Do & Rahm 2002); Cupid (Madhavan 2001); Similarity Flooding (Melnik 2002); instance-based matching (Kang & Naughton 2003) |
| Find the transformation | **Programming by example** over a typed DSL, shortest consistent program, verified on held-out pairs | Gulwani, FlashFill (POPL 2011); Occam / minimum description length |
| Calibrate confidence | Platt / isotonic regression on labelled mutations; **selective prediction** (abstain below threshold) with a conformal-style guarantee on accepted cases | Platt 1999; Guo et al. 2017; El-Yaniv & Wiener 2010; Angelopoulos & Bates 2021 |
| Impact | Reachability on a dependency graph (static AST + dynamic trace), weighted by traffic and criticality | Standard program analysis; taint-style data flow |
| Validate | **Differential testing** of old-baseline vs adapted behaviour, metamorphic checks, consumer invariants | McKeeman 1998; mutation testing (DeMillo et al. 1978); property-based testing (Claessen & Hughes 2000) |
| Promote or roll back | **SPRT** (Wald 1945) on canary error rate | Wald; sequential analysis |
| Rehearse | Fire drills = mutation testing of the *dependencies*; chaos-style experiments | DeMillo et al.; chaos engineering (Basiri et al. 2016) |
| Forecast | Logistic fit of new-shape ratio r(t); bootstrap for uncertainty | Growth-curve fitting; change-point priors |
| Decide | Expected-cost decision rule with severity-dependent threshold | Decision theory; selective classification |

Why this framing matters: Hyrum's Law says that with enough users every observable behaviour gets depended on, so **observed behaviour, not the spec, is the contract**. That justifies learning from traffic.

## A.2 Data model (minimal)

```
Observation  = {endpoint, reqSig, status, headers, bodyShapeSig, entityKey?, fieldValues, bytes, latency, t}
FieldModel   = {path, sketches{tdigest,hll,topk}, invariants[{kind, params, support, violations}]}
Baseline     = {endpoint, version, fieldModels, behaviourMetrics, shapeSigCounts, validFrom, n}
ShapeSig     = canonical hash of (field paths + JSON types), order-independent
```

## A.3 Stage algorithms in detail

### A.3.1 Invariant mining (learn)
For each field path, propose candidate invariants from a fixed template set:
`type ∈ T`, `nullable?`, `min ≤ x ≤ max` (from t-digest 0.1%-99.9%), `matches regex class R` (ISO date, email, "First Last", UUID, integer-as-string), `x ∈ E` (enum, only if cardinality ≤ k), `x = f(y)` for numeric pairs (ratio/sum tests).
Keep an invariant only if **support ≥ N_min** and **violations = 0** (or ≤ ε) in the baseline window. Store support so a later violation is weighted by how well-established it was.

### A.3.2 Detection with two independent witnesses
```
for each window W (size by traffic, min n):
    V = invariant_violation_rate(W)              # witness 1
    CP = change_point_score(metric series)       # witness 2 (CUSUM/BOCPD)
    D = distribution_distance(W, baseline)       # KS/JS/Wasserstein, gated by n ≥ n_min
    shapes = shapeSigCounts(W)                   # for mixed populations

    if shapes has ≥2 populations: state = ROLLOUT, ratio r = share(new shape)
    candidate = (V > τ_v) AND (CP > τ_c)         # both must agree for a structural/behavioural change
    candidate |= (D > τ_d AND invariant violated) # distribution shift alone is NOT a change
```
**Rule that prevents false positives from real-world data shifts:** a distribution shift with *no invariant violation* (e.g. Black Friday amounts jump) is logged as **population drift**, not an API change.

### A.3.3 Scale and format shifts (the dangerous silent ones)
- **Quantile-ratio constancy test.** Compute ratios `q_i(new)/q_i(old)` over deciles. A true unit change multiplies *all* quantiles by one factor, so the ratios are nearly constant (coefficient of variation < ~0.05) and the factor is a clean constant (10, 100, 1000, 1/100...). Seasonal or population shifts don't have this property. This is the core trick for dollars→cents.
- **Format-class transition.** Learn each string field's regex-class distribution; a shift from class `First Last` to `Last, First` is a discrete class flip with a sharp change-point.
- **Integer width / precision.** Track numeric magnitude; values beyond 2^53 or a float↔int flip raise a precision-loss signal.

### A.3.4 Field matching with aligned evidence (the key idea)
Unpaired value distributions only *suggest* a rename. **Paired evidence proves much more.** Three sources of pairs, in order of strength:
1. **Rollout pairs:** during a gradual rollout the same entity key can appear under both shapes.
2. **Temporal entity join:** entities seen before the change (cached by `entityKey`) are fetched again after; most entities are unchanged, so old value ↔ new value pairs exist, and a majority statistic tolerates real edits.
3. **Probe pairs:** safe read-only calls to the old and new endpoint version (when both exist) or repeated reads.

Candidate score for removed field `a` and added field `b`:
```
S(a,b) = w_val·ValSim + w_type·TypeFmt + w_ctx·Context + w_time·Temporal + w_name·NameSim
ValSim   = 1 − JS(P_a, P_b)         (or top-k Jaccard for categorical)
TypeFmt  = type compatibility × format-class match
Context  = same parent path / sibling set / position
Temporal = exp(−|t_remove − t_add| / τ)
NameSim  = max(token Jaccard, char n-gram cosine)     # deliberately low weight; names are often arbitrary
```
Solve 1-to-1 assignment with the **Hungarian algorithm** on cost = 1 − S, so one new field cannot absorb two old ones. If aligned pairs exist: `m = share of pairs where transform(old) == new`, and use the **Wilson interval lower bound** `LB(m, n)` as evidence strength, which stays conservative when n is small.

### A.3.5 Transformation synthesis (adapter) as programming by example
DSL (typed, total, side-effect free): `id, rename, cast(t), scale(k), shift(k), split_join(order), enum_map, default(v), unwrap/nest, paginate_normalize`.
```
programs = enumerate compositions up to depth 2 (prune by type)
consistent = {p | p(old_i) == new_i for ALL training pairs}
choose argmin description_length(p) over consistent       # Occam: simplest explanation
verify on held-out 20% pairs: ZERO counterexamples required
if none consistent: verdict = breaking or unknown (never improvise code)
```
An LLM may *propose* candidate programs or names, but only a DSL program that passes the checks above can run.

### A.3.6 Verdict logic
| Condition | Verdict |
|---|---|
| Exact transform on held-out pairs, `LB ≥ 0.95`, invariants preserved | `equivalent` |
| Transform exists but many-to-one / information lost (e.g. `"Last, First"` split) | `lossy` |
| Match rate in a grey band, or evidence only unpaired | `unknown` (propose, never auto-apply) |
| No consistent program | `breaking` |
| Enum label set unchanged but population/co-variates shifted | `unknown` (meaning risk) |

### A.3.7 Confidence and abstention
`z = Σ w_k · feature_k`, `p_raw = σ(z)`, then **isotonic calibration** on the labelled mutation catalogue + fuzz set so `p` is a true frequency. Evidence floors: paired evidence with `LB ≥ 0.95` can lift `p` to 0.95; unpaired evidence is capped below the auto-apply line. Choose the abstention threshold so the **error rate on accepted decisions ≤ target** (selective prediction); everything below goes to a human.

### A.3.8 Cost-sensitive policy
```
EV = p·V_fix − (1−p)·C_wrong(severity) − C_human
auto_apply  iff  validation_passed  AND  p ≥ p_min(severity)  AND  EV > 0
p_min is higher when the field touches money, auth or PII
else: propose PR (0.70 ≤ p < p_min)  |  quarantine (p < 0.70 or unknown)  |  circuit-break (breaking)
```

### A.3.9 Validation with a statistical stopping rule
1. **Replay** recorded workflows (replay safety classes apply; state-changing calls are offline/shadow only).
2. **Differential test** old-baseline output vs adapted output on downstream effects (totals, rendered names, page completeness), not just field presence.
3. **Consumer invariants** (declared expectations) must hold.
4. **Canary with SPRT:** let `H0`: adapted error rate ≤ p0, `H1`: ≥ p1. Accumulate the log-likelihood ratio per request; cross lower bound → promote, cross upper bound → roll back. This bounds both false-promote and false-rollback rates by chosen α, β.

### A.3.10 Behavioural learners (non-schema)
- **Pagination classifier:** features = presence of `next_cursor`/`offset`/`page`/`Link` header, monotonic ids, page size; a change in predicted class is a pagination change. Truncation = observed count < requested limit repeatedly.
- **Rate-limit estimator:** locate 429 onset against request rate to estimate a token-bucket (rate, burst); parse `Retry-After` format (seconds vs date).
- **Defaults:** differential probe, request with param omitted vs explicit; changed result ⇒ default flipped (read-only calls only).
- **Error contract:** cluster error bodies by shape; a new cluster or status reuse is a change.

### A.3.11 Forecast
```
r(t) = share of responses in new shape per window
fit  r(t) ≈ 1 / (1 + exp(−k (t − t0)))      by least squares on the last m windows
ETA(0.99) = t0 + ln(99)/k          uncertainty by bootstrap over windows
P(complete) = P(k > 0) from bootstrap, adjusted by side signals (Sunset/version headers, history) via logistic regression
```
Pre-staging triggers when `P(complete) ≥ θ`. A forecast never applies a change.

## A.4 Complexity and cost
Sketches make memory O(fields · sketch size) per endpoint, independent of traffic. Matching is O(|removed|·|added|) plus Hungarian O(n³) on small n (tens of fields). DSL search is bounded by depth 2 and type pruning. LLM calls are optional and off the hot path, which sidesteps the 30× cost spread reported for LLM runtime approaches (SAGAI-MID abstract) and their non-determinism.

## A.5 What this borrows from SAGAI-MID, and where it differs
| SAGAI-MID (per abstract) | Intra algorithm |
|---|---|
| Structural diff + LLM semantic analysis | Invariants + change-points + paired evidence; LLM optional |
| CODEGEN beats DIRECT | Same insight: synthesize a reusable program once (DSL), never per-request LLM |
| Validation, voting, rule fallback | Validation + SPRT + calibration/abstention + quarantine |
| Given mismatch between known schemas | **Discovers** unannounced change from traffic, then locates impact |

## A.6 Evaluation protocol for the algorithm
- **Detection:** precision/recall per change class on (a) authored catalogue M1-M11, (b) **hold-out** mutations generated by a fuzzer the detector authors never saw, (c) **natural-drift negatives** (seasonality, new locales, price inflation) that must NOT alert.
- **Matching:** top-1 accuracy of rename matching with and without paired evidence.
- **Calibration:** reliability diagram, expected calibration error ≤ 0.05.
- **Safety:** unsafe auto-apply rate = 0 on lossy/unknown cases; selective-prediction error ≤ target on accepted.
- **Ablations:** remove each witness, remove paired evidence, remove quantile-ratio test, remove SPRT; report the damage.

---

# PART B: THE BRUTAL CHECK

## B.1 Verdict in one paragraph
**On paper the design covers every line of the challenge.** In reality it is **a plan with zero verified code**; every number in our docs is a target. As designed, it should **handle the common, well-behaved cases well, detect most others, and fail safe on the rest**. It will **not** "solve" undocumented change in general, and no system can, because meaning cannot be proven from observation alone. What it can honestly claim: *detect most silent changes, localize the blast radius, auto-repair the provable ones, and refuse the rest safely.* The challenge itself asks for exactly that last part, so this is a legitimate target, not a cop-out.

## B.2 Scorecard (my subjective estimates, assuming it is built as designed and tested honestly)
| Challenge requirement | Estimate | Why not higher |
|---|:-:|---|
| Detect meaningful change, incl. behavioural | 7/10 | Defaults and rate limits need requests we may never send; low-traffic endpoints are blind |
| Dependency mapping / impact | 7/10 | Static analysis misses dynamic field access; TypeScript-only |
| Semantics-aware fixes | 6/10 | Paired evidence helps a lot, but instant cutovers and lossy changes remain judgement calls |
| Regression validation | 6/10 | Cannot replay state-changing calls live; offline validation is weaker |
| Safe handling when uncertain | 8/10 | Strongest part; depends on calibration actually being honest |
| Demo | 8/10 | Easy to make convincing, which is itself a risk (see #1) |

## B.3 Ten hard truths
1. **We grade our own homework.** The simulators, the mutations and the detectors are all written by us. A detector tuned on M1-M11 will ace M1-M11. Without a hold-out fuzzer and external data, "95% recall" means little.
2. **Meaning is unprovable.** Matching value patterns suggests `display_name` ≡ `name`; it can't prove it (it could be a *nickname*). Paired evidence narrows this but can't close it. The honest outcome for many real changes is "unknown, ask a human".
3. **Natural data drift looks like API drift.** Holiday spikes, a new market, a price rise all shift distributions. The invariant-violation rule and the quantile-ratio test help, but this is the likeliest source of real false alarms.
4. **Instant cutovers are the hard case.** Without a gradual rollout there are no live pairs; we depend on the temporal entity join (cached entities re-fetched), which needs entity keys and enough re-fetched entities.
5. **A disappearing dependency can't be repaired.** The best we do is circuit-break, serve cache, or propose a migration. "Survive" then means "degrade gracefully", not "keep working".
6. **State-changing calls can't be replay-tested live.** Payments and emails are validated offline and in shadow mode, which is exactly where the highest-stakes bugs live.
7. **Coverage is only what flows through us.** Other traffic is invisible except via read-only probes. Auth headers, TLS interception, streaming/WebSocket, GraphQL and binary payloads are out of scope.
8. **We become a dependency ourselves.** A proxy adds latency, a single point of failure and a place where credentials pass. It needs a **fail-open** mode (if Intra is down, traffic bypasses it) and a security review, or we have swapped one risk for another.
9. **Scope sprawl can sink the core.** Firebase, tenancy, wallet, ledger, agent chat, docs site, forecasting and an MCP server are a lot. The challenge is scored on detection, impact, semantic fixes, validation and safe failure. Every hour on the wallet is an hour not on those.
10. **Autonomous agent builds can drift too.** A 16-agent Ralph loop can generate plausible but incoherent code. The harness reduces this with gates and QA, but it does not guarantee a working system. Early integration (the Sprint 1 slice) is our main protection.

## B.4 What "solved" honestly means (say this to judges and mentors)
- ✅ We **detect** structural, behavioural and most silent semantic changes, with measured precision/recall.
- ✅ We **map** which workflows are affected and how severely.
- ✅ We **auto-repair only when provable** (paired evidence, held-out verification, calibrated confidence, passing validation) and **roll back automatically** otherwise.
- ✅ We **refuse safely** (quarantine + evidence + proposal) when evidence is weak.
- ❌ We do **not** claim to repair every change, predict changes with no warning, or prove semantic equivalence in general.

## B.5 The proof plan: tests that would make it real
1. **Hold-out fuzzer:** an independent agent/person writes a mutation generator (rename, unit, format, enum, default, pagination, truncation, rate limit, combined, gradual and instant). Detector authors never see its output until the final eval.
2. **Real API version pairs:** replay recorded responses from two dated versions of public APIs that publish versions, and check that detection and matching work outside our simulators.
3. **Natural-drift negatives:** simulate seasonality, a new locale, inflation and a traffic mix change; the false-alarm rate must stay under target.
4. **Lossy and adversarial cases:** names that look identical but differ (`nickname`), enum relabelling, plausible-but-wrong mappings. Unsafe auto-apply must be **0**.
5. **Intra-down chaos:** kill the proxy mid-traffic; the app must keep working (fail-open) with an alert.
6. **Calibration audit:** reliability diagram; ECE ≤ 0.05; accepted-decision error rate within target.
7. **Ablations:** show each algorithmic piece earns its place; delete what doesn't.

## B.6 Kill list (cut first to protect the core)
Wallet link and ledger polish, Agent chat, Status page, community registry, public-chain anchoring. Keep: observe → invariants → change-points → paired-evidence matching → DSL synthesis → calibrated policy → replay/SPRT validation → rollback → impact → forecast Level 1 → fire drills.

## B.7 Biggest single risk and the one-line fix
**Risk:** we ship a demo that looks perfect because we wrote both the problem and the solution. **Fix:** build the hold-out fuzzer and the real-API version-pair benchmark in Sprint 3, run them in CI, and publish the numbers including the failures.

---

## References (from literature knowledge; verify before citing)
- Rahm & Bernstein (2001), *A survey of approaches to automatic schema matching*, VLDB Journal
- Do & Rahm (2002), *COMA: a system for flexible combination of schema matching approaches*, VLDB
- Madhavan, Bernstein & Rahm (2001), *Generic schema matching with Cupid*, VLDB
- Melnik, Garcia-Molina & Rahm (2002), *Similarity Flooding*, ICDE
- Kang & Naughton (2003), *On schema matching with opaque column names and data values*, SIGMOD
- Ernst et al. (2001), *Dynamically discovering likely program invariants to support program evolution*, IEEE TSE (Daikon)
- Gulwani (2011), *Automating string processing in spreadsheets using input-output examples*, POPL (FlashFill)
- Page (1954), *Continuous inspection schemes* (CUSUM); Adams & MacKay (2007), *Bayesian online changepoint detection*; Killick, Fearnhead & Eckley (2012), *Optimal detection of changepoints* (PELT)
- Gama et al. (2014), *A survey on concept drift adaptation*, ACM CSUR; Bifet & Gavaldà (2007), *Learning from time-changing data with adaptive windowing* (ADWIN)
- Platt (1999), probabilistic outputs for SVMs; Guo et al. (2017), *On calibration of modern neural networks*; El-Yaniv & Wiener (2010), *On the foundations of noise-free selective classification*; Angelopoulos & Bates (2021), *A gentle introduction to conformal prediction*
- Wald (1945), *Sequential tests of statistical hypotheses* (SPRT)
- McKeeman (1998), *Differential testing for software*; DeMillo, Lipton & Sayward (1978), *Hints on test data selection* (mutation testing); Claessen & Hughes (2000), *QuickCheck*
- Dunning, *t-digest*; Flajolet et al. (2007), *HyperLogLog*; Cormode & Muthukrishnan (2005), *Count-Min sketch*
- Basiri et al. (2016), *Chaos engineering*, IEEE Software
- Hyrum's Law (Hyrum Wright)
- SAGAI-MID / MID, arXiv 2603.28731 (abstract reviewed only); Matchmaker (NeurIPS 2024 / ICML 2025 line of LLM schema-matching work)