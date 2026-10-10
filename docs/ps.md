# PS.md: Problem Statement, Research & Approach

**Project:** Intra, "The Internet After the API" **Tagline:** Help software survive undocumented changes in systems it does not control. **Last researched:** 10 Oct 2026 · **Version:** 1.3 (adds §4.9 Forecasting) (adds §12 Platform Vision; decisions locked in §12.10) · **Companion files:** `Harness.md` (how we build), `STACK.md`, `DESIGN.md`

---

## 1. Problem Statement

Modern software is mostly *other people's software*: REST APIs, SDKs, webhooks, MCP servers, SaaS integrations. Providers change behaviour without notice, retire fields, tighten rate limits, flip defaults, or return data that is still valid JSON but means something different. Consumers usually learn about it from a production incident.

**Challenge:** build infrastructure that **observes** external dependencies, **learns their real behaviour**, **detects meaningful change**, **assesses what in the application is affected**, and then **adapts automatically or proposes a safe migration**.

```
External service → Observed behaviour → Contract/behavioural model → Change detection
→ Impact analysis → Adapter or migration → Validation → Updated system
```

**Core requirement:** documented schemas are not enough. Intra must catch behavioural change: altered defaults, different error responses, changed pagination, new rate limits, and semantic drift (`name` → `display_name`, cents ↔ dollars, enum meaning shifts).

**Success looks like:** a demo app depending on several simulated services survives injected undocumented changes through automatic detection, impact analysis, adaptation and validation, and **refuses to auto-repair when confidence is low**.

---

## 2. Failure Taxonomy (what we must detect)

| Class | Example | Looks valid to a schema? | Typical blast radius |
| --- | --- | --- | --- |
| Structural | field removed / type changed / required param added | No (caught by diffs) | Loud, crashes |
| Rename | `name` → `display_name` | Yes (it's "new optional field + removed field") | Medium; silent nulls |
| Unit / scale | `amount` dollars (float) → cents (int) | **Yes** | **Severe, silent money bugs** |
| Format | `"First Last"` → `"Last, First"`; ISO date → epoch; timezone shift | **Yes** | Silent data corruption |
| Enum semantics | `status: active` now includes suspended | **Yes** | Silent logic errors |
| Default | omitted `currency` flips USD → EUR | **Yes** | Silent behaviour change |
| Pagination | offset → opaque cursor; page size capped | Partly | Missing data, infinite loops |
| Error contract | new error body shape, status code reuse, `Retry-After` format | Rarely documented | Broken retry/fallback logic |
| Rate limiting | new 429 threshold, new headers | Never in schema | Cascading failures |
| Truncation | silently returns 20 instead of 100 | **Yes** | Silent data loss |
| Latency regime | p95 jumps 10× | N/A | Timeouts, queue pile-ups |
| MCP/tool drift | tool arg `query` → `q`, description rewritten after approval | Yes (valid JSON schema) | Agent misbehaviour, security risk |

The shaded insight: the dangerous classes are exactly the ones **a schema validator passes**.

---

## 3. Research Landscape (current state, October 2026)

### 3.1 What exists

**A. Spec-to-spec / spec-to-code diffing.** Tools like `oasdiff` classify OpenAPI differences as breaking or non-breaking and are commonly wired into CI with a fail-on-error flag. Write-ups on this approach stress comparing three artifacts (the base contract, the proposed contract, and what the running service actually returns) because a spec-vs-spec diff only catches *deliberate, documented* edits. *Limit:* needs a spec the provider maintains, and you don't control third-party specs.

**B. Passive response-shape monitors.** Small open-source tools (a Python CLI "diffapi", the PHP library "Sentinel") infer a JSON structure from live responses, lock a baseline, and flag added/removed/retyped fields or non-null fields turning null, with severity tiers such as breaking, additive, advisory. *Limit:* structural only; no meaning, no impact on the consumer, no repair. One of the repos found is archived.

**C. Commercial "API drift" remediation.** Vendors in security automation describe API drift as unplanned or undocumented behaviour change (endpoints, response formats, auth, rate limits) and sell continuous probing with automated remediation. They also cite an estimate that enterprises integrating 50+ tools may see hundreds of drift events per year. *Limit:* vertical (security tooling), proprietary, little public evidence of semantic verification.

**D. Consumer-driven contract testing (Pact et al.).** The consumer records what it actually depends on; the provider verifies it, and a verification matrix gates deployment. This measures compatibility against *executable usage* instead of the provider's whole surface. Practitioner guidance explicitly notes that schema contracts cannot infer meaning from an unchanged number type (e.g. cents vs major units), and that structurally valid endpoints can still break consumers by changing the meaning of a status, sort order, or authorization outcome. *Limit:* requires provider cooperation to verify; third-party providers won't run your pacts.

**E. MCP tool-integrity tooling.** A fast-growing niche: MCP "rug pull" defences hash each tool's name, description and input schema, store a lockfile or baseline, and block or flag when the definition changes after approval (order-independent hashing so reordered keys don't false-alarm). Security writing notes that remote servers can change definitions server-side at any time, and that approval is a snapshot rather than a guarantee. *Limit:* these detect **and block**; they don't *adapt* a consumer to a benign change, and they focus on security rather than compatibility.

**F. Academic: LLM-assisted schema matching and adaptation.**

- *Matchmaker* (ICML/NeurIPS-era work) frames schema matching as candidate generation → refinement → confidence scoring with an LLM program, outperforming earlier ML approaches on medical schema benchmarks.
- A 2026 arXiv paper describes **MID**, a FastAPI middleware that combines structural diffing with LLM semantic analysis, and compares per-request LLM transformation against LLM-generated code with ensemble voting and rule-based fallback to tame non-determinism.
- Earlier work on Kafka-style ecosystems has an LLM emit *typed mapping commands* (MATCH, COPY, ADD, CAST, DELETE, RENAME, DEFAULT, SCALE, SHIFT…) rather than raw code. *Takeaway:* constrained, typed transform vocabularies plus confidence scoring are the credible pattern; free-form LLM rewriting is risky.

**G. Data-integration platforms.** Commercial "auto field mapping / self-healing mapping" agents claim to detect added, removed, retyped and renamed fields and auto-remap. *Limit:* vendor claims, focused on data pipelines, not on application workflows or behavioural drift like pagination and rate limits.

### 3.2 Gap analysis

| Capability | Spec diff | Passive shape monitor | Pact | MCP pinning | LLM schema match | **Intra (target)** |
| --- | --- | --- | --- | --- | --- | --- |
| Works without provider spec | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Works without provider cooperation | ✗ | ✓ | ✗ | ✓ | ✓ | ✓ |
| Behavioural drift (pagination, rate limit, defaults, errors) | ✗ | ✗ | partial | ✗ | ✗ | ✓ |
| Semantic verdict (equivalent/lossy/breaking/unknown) | ✗ | ✗ | partial | ✗ | partial | ✓ |
| Maps change → affected workflows | ✗ | ✗ | partial | ✗ | ✗ | ✓ |
| Generates adapter | ✗ | ✗ | ✗ | ✗ | partial | ✓ |
| Validates repair by replay | ✗ | ✗ | partial | ✗ | ✗ | ✓ |
| Safe-fail with confidence gating + rollback | ✗ | ✗ | ✗ | block only | ✗ | ✓ |

> Honesty note: the "✓" column for Intra is the *goal*. Claims about other tools reflect public docs we found; some may do more than documented. Our positioning is the **closed loop**, not any single capability.

### 3.3 Key research insights that shape our design

1. **Structure is the easy 20%.** The expensive incidents live in unit, format, default and enum meaning changes that every schema tool passes.
2. **Evidence beats documentation.** Both Pact-style practice and passive monitors converge on learning from real traffic. We go further and learn *distributions*.
3. **Diffs need consumer context.** An unused field disappearing is noise. Intra scores severity by *which workflows read the field*.
4. **Never let an LLM be the only judge.** Literature on LLM schema matching leans on candidate generation + confidence scoring + voting + deterministic fallback. We adopt: deterministic evidence first, LLM as optional proposer, deterministic validator as final authority.
5. **Typed transform vocabulary.** Adapters are compositions of a small, auditable DSL (rename, cast, scale, shift, default, enum-map, unwrap, paginate), never arbitrary generated code in the hot path.
6. **Order-independent canonical hashing** (borrowed from MCP pinning) gives cheap, noise-free "did anything change?" detection before expensive analysis.
7. **Fail closed.** Every mature MCP-integrity design blocks on drift; we generalize: low confidence → quarantine + proposal, not silent patching.
8. **Hyrum's Law applies.** With enough consumers, every observable behaviour is depended on by someone, so observed behaviour (not the spec) is the contract that matters.

---

## 4. Approach

### 4.1 Architecture in one picture

```
 Sim/real services ──► Observer (proxy/SDK/webhook tap) ──► observations (Postgres)
                                                    │
                  Model builder ◄───────────────────┘   contract + behavioural fingerprint
                         │
                         ▼
         Differ (structural + behavioural + semantic) ──► Change{kind, evidence, verdict, confidence}
                         │
                         ▼
   Impact analyzer (static AST + runtime trace) ──► affected workflows / blast radius
                         │
                         ▼
 Adapter synthesizer (typed DSL) ──► Policy engine (§4.6) ──► auto-apply | PR proposal | quarantine
                         │
                         ▼
       Validator (replay + golden + equivalence) ──► promote | rollback
```

Delivered as a monolith engine (Railway), a Vite/React dashboard (Vercel), and a separate Node MCP server (Render) for customers.

### 4.2 Observe

- Capture at three points: an HTTP **forward proxy/SDK wrapper**, a **webhook receiver**, and an **MCP client wrapper** (hash tool lists, record call/response pairs).
- Record: method, path template, status, headers (rate-limit, `Retry-After`, `Link`, content-type), body, latency, request params, correlation to **workflow id** (so impact is traceable).
- PII redaction at ingestion; sampling and retention policy; SSRF-safe proxy config.
- **Active probes:** scheduled, allow-listed, rate-limited, **read-only (GET/HEAD)** requests so endpoints with little organic traffic are still watched. Per-tenant opt-in; never probes state-changing calls.

### 4.3 Learn (contract + behavioural model)

Per endpoint, built *from observation only*:

- **Contract:** inferred JSON Schema (types, optionality, nullability, formats, enums with frequencies), error taxonomy (status → body shape), pagination style detector (offset, page, cursor, Link-header), rate-limit policy (limits, headers, backoff style).
- **Behavioural fingerprint** per field: value distribution sketch (quantiles/histogram for numerics, top-k + entropy for strings, regex/format class, cardinality, null rate), value ranges and units hints, relationships (e.g. `total ≈ sum(items.price)`), page-size and ordering behaviour, latency quantiles.
- **Canonical hash** of the structural contract for O(1) "changed?" checks.
- Baselines are windowed and versioned; a baseline is only trusted after N observations with stable stats.

### 4.4 Detect (three layers)

1. **Structural diff:** added/removed/type/nullability/enum-set changes (covers what spec diffs do, but from observed truth).
2. **Behavioural diff:** pagination style change, page-size cap, error-shape change, new 429/limit headers, latency regime shift (change-point detection e.g. CUSUM/PELT), truncation (observed count vs requested limit).
3. **Semantic drift detection:**
   - *Rename candidates:* pair every removed field with every added field; score = weighted blend of **value-distribution similarity** (KS/Jensen-Shannon on the fingerprint), **type & format compatibility**, **name similarity** (token/embedding), **positional/structural context**, **co-occurrence timing** (disappears and appears in the same window). Hungarian assignment prevents one-to-many matches.
   - *Unit/scale shift:* ratio test on matched numerics (stable multiplicative factor like 100 or 1000 ⇒ SCALE), plus integer-vs-float flip.
   - *Format shift:* regex-class transitions (`First Last` → `Last, First`, ISO → epoch).
   - *Enum meaning:* same label set but changed co-variate relationships or population proportions (e.g. `active` share jumps, new correlation with a `suspended_at`-like field) ⇒ flagged `unknown`, never auto-mapped.
   - *Default flips:* behaviour on requests that omit a parameter changes.

- **False-positive control:** statistical windows with a minimum sample size, sequential tests, and a "benign corpus" (reorderings, additive optional fields, noise) in CI that **must not** alert.
- **Mixed-version rollouts:** providers deploy gradually, so old-shape and new-shape responses can coexist for hours. Detect two populations in one window, label the state `rollout_in_progress`, track the new-shape ratio, and finalize the verdict once it stabilizes. This prevents alert storms and wrong "flapping" verdicts.

### 4.5 Assess impact

- **Static:** AST scan (TypeScript compiler API) of the consuming app to build `workflow → call site → field access path` edges (handles destructuring, optional chaining, aliasing within reason).
- **Runtime:** trace correlation from observer (workflow id ↔ endpoints ↔ fields actually read) to catch dynamic access the AST misses.
- **Output:** blast-radius query ("what depends on `user.name`?"), ranked by traffic share and business criticality tags, with the evidence trail.
- Severity = f(change class, confidence, #workflows, criticality, money/PII touch).
- **Consumer expectations:** the app can declare cheap per-field assertions (`user.name` is a non-empty string; `payment.amount` is integer cents). They catch meaning changes that statistics can miss and raise severity when violated.

### 4.6 Adapt or propose (the safe-handling policy)

Adapters are compositions from a **typed transform DSL** (`rename`, `cast`, `scale`, `shift`, `default`, `enum_map`, `unwrap/nest`, `paginate_normalize`, `retry_policy`). An LLM may *propose* candidates from evidence, but only DSL programs are executable, and each must pass validation.

| Confidence | Verdict | Action |
| --- | --- | --- |
| ≥ 0.90 | equivalent | Auto-adapt → validate → canary → full |
| 0.70–0.90 | equivalent/lossy | Generate adapter + migration PR; shadow-apply only |
| \< 0.70 or `unknown` | any | No auto-apply; quarantine affected workflows; evidence bundle |
| any | breaking, no mapping | Circuit-break; serve cached/fallback if configured; propose migration |

Confidence is a decomposed score (evidence volume, distribution match, name/structure match, *consumer-semantic risk* such as money or auth), logged with its breakdown so a human can audit it. Lossy mappings (e.g. `"Last, First"` → `"First Last"` splitting) are labelled lossy and never auto-applied when the consumer depends on exact semantics.

### 4.7 Validate

- **Replay:** recorded workflow traces (from the observer) re-executed against the adapted service/proxy; assertions from golden outputs and workflow invariants.
- **Semantic-equivalence check:** compare *downstream effects* (e.g. totals, rendered names, pagination completeness) between old-behaviour baseline and adapted-behaviour output, not just field presence.
- **Canary + shadow:** apply to a traffic slice; compare error rates and output diffs; auto-**rollback** on regression.
- Every applied adapter is versioned with a rollback handle.
- **Replay safety classes:** `safe` (read-only, idempotent) may be replayed live; `sandbox-only` only against provider sandboxes; `shadow-only` (payments, emails, deletes, anything state-changing without a sandbox) is **never replayed live**, only validated offline on recorded traces and in shadow mode. Unclassified calls default to `shadow-only`.

### 4.8 Customer-facing MCP server

Read-mostly tools (`intra_list_dependencies`, `intra_get_contract`, `intra_recent_changes`, `intra_impact`, `intra_propose_adapter`, gated `intra_apply_adapter`, `intra_health`), API-key auth, per-tenant scope, audit logging, and its own tool-definition pinning so *our* server doesn't become a rug-pull vector.

### 4.9 Forecast: early warning, fire drills, pre-staging (answers "can it predict?")

Reaction is not enough; where the world gives warning, Intra uses it. Honest framing: Intra cannot know a provider will change something with zero warning, but most changes leave footprints first and likely changes can be rehearsed.

**Level 1: early warning from leading signals.** Signals: (a) **gradual rollout**, the share of responses using the new shape rising over time (strongest); (b) standard `Deprecation` / `Sunset` headers when a provider sends them; (c) new or changed version/rate-limit headers; (d) error or latency precursors on one endpoint; (e) provider hints (changelog, status page, published spec), treated as hints and never as truth; (f) the provider's change history/cadence. Output is a `Forecast`: likely change kind, **probability**, **ETA to full cutover**, evidence, affected workflows (impact graph), pre-stage status. Simple v1 model: fit a trend to the new-shape ratio and project when it reaches 100%; other signals adjust the probability; probabilities are calibrated (reliability table) so "80%" means about 80%.

**Level 2: fire drills (what-if simulation).** Using the same mutation switchboard as the demo, Intra generates imagined changes for every field the app reads (remove, rename, null, ×100, format flip, page cap, 429s), runs workflows in **sim/sandbox only** (never live providers, §10.1 replay classes), and emits a **resilience scorecard**: workflow × drill → does it break? is a fix ready? This predicts the *impact* of future changes and ranks the most fragile dependencies today.

**Level 3: pre-staged adapters.** For forecasts above a probability threshold, Intra builds and validates the adapter in **shadow mode** so activation takes seconds. A forecast **never applies a change by itself**; activation passes the §4.6 policy table like any other adapter.

**Scoring:** because we control the simulators, ground truth (the rollout schedule) is known, so precision, recall, lead time, probability calibration and ETA error can be measured exactly (§6). Cut line: Level 1 and 2 are kept; Level 3 is cut first if time runs short.

---

## 5. Differentiation

1. **Closed loop**, not a point tool: observe → decide → repair → prove.
2. **Behavioural + semantic** coverage where schema tools are blind.
3. **Consumer-aware severity:** impact is computed against *your* workflows.
4. **Calibrated humility:** explicit `unknown`, quarantine, and rollback paths are first-class features, not afterthoughts.
5. **Agent-native:** exposes the same intelligence over MCP, and watches MCP dependencies too.

---

## 6. Evaluation Plan

| Metric | Target | How |
| --- | --- | --- |
| Change-detection recall (mutation catalogue M1–M10 + extended fuzz set) | ≥ 0.95 | Switchboard-injected mutations in CI |
| Precision (benign corpus: reorder, additive, noise) | ≥ 0.90 | Benign mutation set must not alert |
| Time-to-detect | ≤ N observations / ≤ 60 s in demo | Timeline assertions |
| Impact accuracy | 100% of truly affected workflows listed; ≤ 5% false positives | Ground truth from demo app |
| Auto-repair correctness | 100% of auto-applied adapters pass replay | Validator gate |
| **Unsafe auto-apply rate** | **0** (M2, M10 must be refused) | Safety tests |
| Rollback success | 100% on injected bad adapters | Chaos test |
| **Confidence calibration** | Each confidence bin within ±0.10 of actual correctness | Reliability table over the mutation catalogue plus fuzz set; reported in CI |
| **Forecast precision** | ≥ 0.80 of raised forecasts come true | Ground-truth schedule from switchboard rollout mode |
| **Forecast recall** | ≥ 0.90 of ramped mutations forecast before full cutover | Same |
| **Forecast calibration / ETA** | Probability within ±0.10; ETA error ≤ \~30% | Reliability table + ETA residuals |
| **Lead time & cutover impact** | Lead time measured (>0); **0 failed workflows at cutover** with pre-staging, vs measured no-forecast baseline | Demo M11 A/B run |
| Overhead | \< 5 ms p95 added by proxy path | Perf budget |

Ablations to report: structural-only vs +behavioural vs +semantic; with vs without consumer-aware impact; with vs without optional LLM proposer.

---

## 7. Demo Scenario (summary; full script in `Harness.md` §13)

**Shipwell** (demo app: checkout, profile, search-browse, notification-ack, MCP-tool-call) depends on five simulated services. A switchboard injects:

- **Auto-repaired:** `name`→`display_name`; dollars→cents; offset→cursor pagination; webhook nesting; MCP arg rename; new 429 policy.
- **Refused and escalated:** `"Last, First"` name format (lossy); `active` enum meaning change (unknown).
- **Forecasted (M11):** a gradual rollout of the rename; Intra raises a forecast early, pre-stages the adapter, and the app stays green at cutover, compared against a no-forecast baseline.
- **Chaos:** a deliberately bad adapter that validation catches and rolls back.

The dashboard shows the timeline (drift → impact → adapter → validation → green) and the MCP server returns the same facts to an external agent.

---

## 8. Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| False positives cause alert fatigue | Statistical windows, benign corpus in CI, severity tied to consumer usage |
| Wrong auto-repair corrupts data | Typed DSL only, confidence gate, replay validation, canary, rollback, `unknown` ⇒ quarantine |
| Privacy (observed payloads) | Redaction at ingest, field allow-lists, retention limits, tenant isolation |
| LLM non-determinism / hallucination | LLM proposes, deterministic validator decides; ensemble/voting; temperature 0; cached results |
| Proxy as attack surface (SSRF, auth leakage) | Egress allow-list, header scrubbing, per-tenant keys, security review in Sprint 6 |
| Cold start (no baseline) | Optional seed from OpenAPI/Pact as *prior*, but never as truth; low-confidence mode until stable |
| Adapter drift itself | Adapters are versioned and re-validated continuously |
| Over-scoping | Non-goals below; sprints in `Harness.md` §11 gate scope |

---

## 9. Scope

**In scope (v1):** HTTP/JSON REST, webhooks, MCP tool surfaces; TypeScript consumer apps; Postgres storage; web dashboard; customer MCP server; full simulated demo.

**Non-goals (v1):** GraphQL/gRPC/binary protocols, auto-rewriting arbitrary consumer source code, multi-region SaaS tenancy, billing, auto-negotiating with providers.

---

## 10. Build Approach (link to harness)

Execution follows `Harness.md`: GSD cycle with parallel subagent waves, Ralph loop for autonomous iteration, qa-engineer + CodeRabbit gates, and autonomous CI/CD to `Precise-Goals/Intra`. Sprint mapping: S1 Observe → S2 Learn → S3 Detect → S4 Impact & Adapt → S5 Validate & Demo → S6 Harden & Ship.

---

## 11. References (sources consulted, Oct 2026)

- oasdiff-based breaking-change CI patterns: [https://gist.github.com/al-maisan/b905a93c60b88588064029fca38ed5e5](https://gist.github.com/al-maisan/b905a93c60b88588064029fca38ed5e5) · [https://qaskills.sh/blog/api-testing-openapi-spec-drift-detection](https://qaskills.sh/blog/api-testing-openapi-spec-drift-detection)
- Passive response-schema drift tools: [https://github.com/kriskimmerle/diffapi](https://github.com/kriskimmerle/diffapi) (archived) · [https://packagist.org/packages/malikad778/php-sentinel](https://packagist.org/packages/malikad778/php-sentinel) · [https://packagist.org/packages/fissible/drift](https://packagist.org/packages/fissible/drift)
- Vendor framing of "API drift" and scale of events: [https://d3security.com/?p=59423](https://d3security.com/?p=59423)
- Consumer-driven contracts and semantic limits: [https://oneuptime.com/blog/post/2026-08-24-consumer-driven-contract-breaking-changes/view](https://oneuptime.com/blog/post/2026-08-24-consumer-driven-contract-breaking-changes/view) · [https://qaskills.sh/blog/api-contract-testing-interview-scenarios](https://qaskills.sh/blog/api-contract-testing-interview-scenarios) · [https://gravitee.io/corpus/gen-2171/list-of-unit-testing-frameworks/contract-testing-frameworks-for-apis.html](https://gravitee.io/corpus/gen-2171/list-of-unit-testing-frameworks/contract-testing-frameworks-for-apis.html) · [https://www.techtarget.com/searchsoftwarequality/tip/Contract-driven-testing-syncs-API-providers-consumers](https://www.techtarget.com/searchsoftwarequality/tip/Contract-driven-testing-syncs-API-providers-consumers)
- MCP rug-pull / tool-definition drift: [https://zuplo.com/blog/remote-mcp-server-rug-pull/](https://zuplo.com/blog/remote-mcp-server-rug-pull/) · [https://pypi.org/project/mcpseal/](https://pypi.org/project/mcpseal/) · [https://docs.orcarouter.ai/security/mcp/schema-drift-states](https://docs.orcarouter.ai/security/mcp/schema-drift-states) · [https://docs.rs/crate/ramparts/latest/source/src/baseline.rs](https://docs.rs/crate/ramparts/latest/source/src/baseline.rs) · [https://dev.to/luckypipewrench/your-mcp-servers-tool-descriptions-are-an-attack-surface-37pj/comments](https://dev.to/luckypipewrench/your-mcp-servers-tool-descriptions-are-an-attack-surface-37pj/comments)
- LLM schema matching / adaptation: Matchmaker, [https://proceedings.mlr.press/v267/seedat25a.html](https://proceedings.mlr.press/v267/seedat25a.html) · MID middleware, [https://arxiv.org/pdf/2603.28731.pdf](https://arxiv.org/pdf/2603.28731.pdf) · typed LLM mapping commands, [https://www.arxiv.org/pdf/2406.11227](https://www.arxiv.org/pdf/2406.11227)
- Vendor "self-healing mapping" claims (treat as marketing): [https://www.putitforward.com/platform/agents/data-integration-governance/auto-data-mapping-schema-agent](https://www.putitforward.com/platform/agents/data-integration-governance/auto-data-mapping-schema-agent)

> Research caveat: findings come from public docs, READMEs and abstracts surfaced in a limited search pass. Before publishing externally, verify claims against primary sources and extend with a deeper literature pass (concept-drift detection, API evolution mining, Hyrum's Law case studies, Stripe-style API versioning).

---

## 12. Platform Vision v1.1: Agentic API Integrity

> Status: owner decisions are recorded in §12.10 and supersede the recommendations in §12.3 where they differ.

### 12.1 The idea, restated

An "agentic" layer for APIs that (a) inspects responses down to **data types and bytes**, (b) records a **checksum/proof of every observation** in a tamper-evident ledger tied to **wallet keys**, (c) **validates the backend** against what was learned, and (d) is presented as a website with **Home, Agent and Docs** (MDN-style, minimal but complete).

### 12.2 Byte-level integrity layer (fits our pipeline at Observe → Learn → Detect)

For every observed response we additionally record:

- **Body hash:** SHA-256 over a *canonical form* (sorted keys, normalized whitespace and numbers) plus the raw-bytes hash. Canonical hash = "did the meaning-carrying content change?"; raw hash = "did anything at all change?".
- **Size profile:** byte length, content-encoding, compression ratio, chunking. A sudden fall from \~40 KB to \~8 KB with the same schema is a strong **truncation** signal.
- **Type fingerprint per field:** JSON type, integer vs float, numeric magnitude/width (fits int32? int64? beyond 2^53 loses precision in JavaScript), string encoding, max length, date/format class.
- **New detectable classes:** silent precision loss (int64 → float), encoding change (UTF-8 vs Latin-1 mojibake), compression/gzip change, payload bloat, truncation without schema change. These feed the existing Detect and Policy steps; they add evidence, they don't replace the confidence-gated policy (§4.6).

### 12.3 Tamper-evident ledger ("blockchain" part), recommended design

**What a ledger proves:** that the *record of what we observed and decided* was not altered after the fact. It does **not** prove the API's data was correct, and it does not by itself validate the backend.

Layered options (choose a level; **OPEN**):

| Level | What it is | Cost | Notes |
| --- | --- | --- | --- |
| L0 | Append-only **hash chain**: each entry includes the previous entry's hash | Free | Tamper-evident locally; the operator could still rewrite everything |
| **L1 (recommended)** | L0 + entries **signed** with a wallet/Ed25519 key + periodic **Merkle root anchored** on a public chain or timestamping service | Tiny | One transaction per batch (e.g. every N minutes), not per checksum |
| L2 | Per-event on-chain writes | High gas, slow, public metadata leak | Not recommended |

Why batch and anchor instead of "log every checksum on-chain": cost, latency, throughput and privacy (public chains expose metadata). With a Merkle tree, any single observation can later be proven with a small **inclusion proof** against the anchored root.

**Keys ("encryption wallet"), two different jobs, don't mix them:**

- **Signing keys** (Ed25519 or secp256k1): sign ledger entries, adapter approvals and agent actions. A connected wallet (Sign-In With Ethereum or similar) can authenticate users and sign "approve this adapter".
- **Encryption keys:** protect stored payloads at rest (AES-GCM with envelope keys via a KMS). Wallet signing keys are not a substitute for this.
- Never store raw private keys server-side; use wallet signatures or a managed KMS; keep testnet for the demo.

### 12.4 Backend validation

Validation (§4.7) already replays workflows. The ledger adds **proof of validation**: each validation result (inputs hash, outputs hash, verdict, adapter version) is signed and chained, so an auditor can verify "adapter v7 was validated against these recorded traces before it was applied".

### 12.5 The Agent (constrained, auditable)

- **Intra Agent** (chat/command UI + MCP) can: list changes, explain impact, draft adapter proposals, run validation, summarize drift for a human.
- It **cannot** bypass the policy table (§4.6): auto-apply only above the confidence gate; everything else needs a human **wallet-signed approval**.
- Every agent tool call and decision is a ledger entry (who/what/when/evidence hash).
- Prompt-injection hygiene: observed payloads are *data*, never instructions to the agent.

### 12.6 Website information architecture

| Page | Purpose |
| --- | --- |
| **Home** | Story in 30 seconds: live "dependency weather" widget, animated drift → fix timeline (hero 3D scene), CTA to demo and docs |
| **Agent** | Console: dependency list, change feed, impact view, proposals to approve (wallet sign), chat with the agent |
| **Docs** | MDN-style, minimal (below) |
| Dashboard | Contracts, drift feed, workflows (from Sprint 2-5) |
| **Verify** | Paste an observation id or hash → shows ledger inclusion proof and anchor reference |
| Demo | Shipwell with mutation switchboard |
| Status | Public health of watched dependencies |

**Docs structure (MDN-inspired, kept small):**

1. *Concepts* (what is drift, contract, confidence, ledger)
2. *Guides* (install, observe a service, approve an adapter, verify a proof)
3. *Reference* (REST API, MCP tools, SDK, change kinds, adapter DSL, CLI), each page with Summary, Syntax, Parameters, Examples, Errors
4. *Compatibility table* per change kind (what Intra detects/repairs, and at what confidence) Tooling default: MDX in the Vite app, Pagefind for search, copy-able code blocks, "Edit on GitHub" links.

### 12.7 More ideas to make the platform work fluently (prioritized)

**Must (v1):** one-command quick start (`npx intra init`); `intra.lock` file committed to the repo (pinned contract hashes, like a lockfile); Verify page; wallet-signed approvals; docs. **Should:** GitHub App that comments on PRs ("this change touches workflows X, Y; dependency Z drifted"); Slack/email digest; README badge "contracts verified"; OpenTelemetry export. **Could:** community registry of **anonymized** learned contracts ("is this behaviour change affecting others too?"); public postmortem pages with shareable proofs; browser extension; VS Code panel. **Won't (v1):** per-event on-chain writes, custom token, multi-chain.

### 12.8 Impact on the build plan

- New package `packages/ledger` (hash chain, signing, Merkle tree, anchoring adapter) and a `verify` route in the engine.
- Byte-level fingerprints added to `packages/model` and `packages/differ` (Sprints 2-3).
- Sprint 5 gains: ledger + Verify page + wallet approval; Sprint 6 gains: docs site and quick-start polish.
- Agent page and MCP tools reuse the same engine API; MCP gains `intra_verify_proof`.
- Harness.md and STACK.md will be updated once §12 open decisions are answered.

### 12.9 Risks specific to this addition

| Risk | Mitigation |
| --- | --- |
| "Blockchain" oversold as proof of correctness | State plainly: it proves integrity of the record, not truth of the data |
| Gas cost / latency / public metadata | Batch + Merkle anchoring, testnet for demo, hash-only (no payloads) on-chain |
| Wallet UX friction | Wallet optional for browsing; required only for approvals |
| Key custody mistakes | No private keys server-side; KMS for encryption keys; key rotation doc |
| Scope explosion | MoSCoW list above; ledger L1 only in v1 |

### 12.10 Locked decisions (owner answers, Oct 2026)

| Topic | Decision | Consequence |
| --- | --- | --- |
| Audience | **Real startup product** | Multi-tenancy, API keys, audit, retention, rate limits, staging, error tracking in v1 (Harness §17) |
| Ledger | **Hash chain + signed entries, no public chain** (§12.3 Level L0 + signatures) | No Merkle anchoring or gas costs in v1; public anchoring is a later option |
| Checksums | **Console-logged**, hashes only | Structured log line per ledger entry; payloads/secrets never logged |
| Login | **Firebase Auth, strict**, config via `.env` | Every non-public route verified server-side; Firebase emulator in tests |
| Wallet | **BridgeKey wallet on MST Blockchain only**, via the MST SDK; connect + map to the user | Wallet linked to Firebase uid by signed nonce; not used for login; no transactions in v1 |

**Verified background (Oct 2026 search):** MST Blockchain is described as an EVM-compatible public chain from Masterstroke Technosoft, and BridgeKey as its multi-chain wallet. A Python port of the MST SDK exists (built on web3.py/eth-account, with `mainnet`/`testnet` selection); its README says it ports an original JS SDK. **Not verified:** the JS package name and the exact BridgeKey connect flow, so the code is written against a `WalletProvider` interface and the MST adapter is completed once the owner supplies SDK docs. (Unrelated products named "Bridge" and "Meridian MST" appeared in results and are not what is meant here.)

**Honest limits stated to users:** the ledger proves the record was not altered after the fact, not that a provider's data was correct; wallet linking proves control of an address, not identity.

---

## 13. Known Limits & Mitigations (honest scope)

| Limit | Why it exists | Mitigation in v1 |
| --- | --- | --- |
| Meaning cannot be proven from traffic | Similar value patterns suggest, not prove, equivalence | Confidence scoring; `unknown` and `lossy` verdicts never auto-apply; consumer expectations as extra evidence |
| Live replay is unsafe or impossible for state-changing calls | A changed provider will not reproduce old responses; replay can cause side effects | Replay safety classes; offline trace validation; shadow mode |
| Quiet endpoints may drift unseen | No traffic means no observations | Read-only active probes (opt-in) |
| Changes with no warning cannot be predicted | No rollout, hint or precursor exists to observe | Fast detection + validated repair; forecasts only claim what signals support; `unknown` when evidence is thin |
| Forecasts can be wrong | Trends can stall, reverse or be coincidence | Probability + calibration gate; pre-staging is shadow-only; a forecast never applies a change |
| Gradual rollouts look like noise or flapping | Old and new shapes coexist | Mixed-version detection and `rollout_in_progress` state |
| Adoption cost | Only traffic through the proxy/SDK is covered | One-command setup, drop-in SDK wrapper; stated plainly in docs |
| Confidence could be miscalibrated | Heuristic scores drift | Calibration report gated in CI |
| Not yet built | This is a plan | Walking skeleton in Sprint 1 proves the loop early; metrics in §6 decide success |

**Deferred (not v1):** learning from human approve/reject decisions to tune scoring; community registry of anonymized contracts; public-chain anchoring.