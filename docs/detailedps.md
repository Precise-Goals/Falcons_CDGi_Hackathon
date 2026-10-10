# PS.md: Problem Statement, Research & Approach

**Project:** Intra, "The Internet After the API"
**Tagline:** Help software survive undocumented changes in systems it does not control.
**Last researched:** 10 Oct 2026 · **Companion files:** `Harness.md` (how we build), `STACK.md`, `DESIGN.md`

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
|---|---|---|---|
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
- Earlier work on Kafka-style ecosystems has an LLM emit *typed mapping commands* (MATCH, COPY, ADD, CAST, DELETE, RENAME, DEFAULT, SCALE, SHIFT…) rather than raw code.
*Takeaway:* constrained, typed transform vocabularies plus confidence scoring are the credible pattern; free-form LLM rewriting is risky.

**G. Data-integration platforms.** Commercial "auto field mapping / self-healing mapping" agents claim to detect added, removed, retyped and renamed fields and auto-remap. *Limit:* vendor claims, focused on data pipelines, not on application workflows or behavioural drift like pagination and rate limits.

### 3.2 Gap analysis

| Capability | Spec diff | Passive shape monitor | Pact | MCP pinning | LLM schema match | **Intra (target)** |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
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

### 4.5 Assess impact
- **Static:** AST scan (TypeScript compiler API) of the consuming app to build `workflow → call site → field access path` edges (handles destructuring, optional chaining, aliasing within reason).
- **Runtime:** trace correlation from observer (workflow id ↔ endpoints ↔ fields actually read) to catch dynamic access the AST misses.
- **Output:** blast-radius query ("what depends on `user.name`?"), ranked by traffic share and business criticality tags, with the evidence trail.
- Severity = f(change class, confidence, #workflows, criticality, money/PII touch).

### 4.6 Adapt or propose (the safe-handling policy)
Adapters are compositions from a **typed transform DSL** (`rename`, `cast`, `scale`, `shift`, `default`, `enum_map`, `unwrap/nest`, `paginate_normalize`, `retry_policy`). An LLM may *propose* candidates from evidence, but only DSL programs are executable, and each must pass validation.

| Confidence | Verdict | Action |
|---|---|---|
| ≥ 0.90 | equivalent | Auto-adapt → validate → canary → full |
| 0.70–0.90 | equivalent/lossy | Generate adapter + migration PR; shadow-apply only |
| < 0.70 or `unknown` | any | No auto-apply; quarantine affected workflows; evidence bundle |
| any | breaking, no mapping | Circuit-break; serve cached/fallback if configured; propose migration |

Confidence is a decomposed score (evidence volume, distribution match, name/structure match, *consumer-semantic risk* such as money or auth), logged with its breakdown so a human can audit it. Lossy mappings (e.g. `"Last, First"` → `"First Last"` splitting) are labelled lossy and never auto-applied when the consumer depends on exact semantics.

### 4.7 Validate
- **Replay:** recorded workflow traces (from the observer) re-executed against the adapted service/proxy; assertions from golden outputs and workflow invariants.
- **Semantic-equivalence check:** compare *downstream effects* (e.g. totals, rendered names, pagination completeness) between old-behaviour baseline and adapted-behaviour output, not just field presence.
- **Canary + shadow:** apply to a traffic slice; compare error rates and output diffs; auto-**rollback** on regression.
- Every applied adapter is versioned with a rollback handle.

### 4.8 Customer-facing MCP server
Read-mostly tools (`intra_list_dependencies`, `intra_get_contract`, `intra_recent_changes`, `intra_impact`, `intra_propose_adapter`, gated `intra_apply_adapter`, `intra_health`), API-key auth, per-tenant scope, audit logging, and its own tool-definition pinning so *our* server doesn't become a rug-pull vector.

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
|---|---|---|
| Change-detection recall (mutation catalogue M1–M10 + extended fuzz set) | ≥ 0.95 | Switchboard-injected mutations in CI |
| Precision (benign corpus: reorder, additive, noise) | ≥ 0.90 | Benign mutation set must not alert |
| Time-to-detect | ≤ N observations / ≤ 60 s in demo | Timeline assertions |
| Impact accuracy | 100% of truly affected workflows listed; ≤ 5% false positives | Ground truth from demo app |
| Auto-repair correctness | 100% of auto-applied adapters pass replay | Validator gate |
| **Unsafe auto-apply rate** | **0** (M2, M10 must be refused) | Safety tests |
| Rollback success | 100% on injected bad adapters | Chaos test |
| Overhead | < 5 ms p95 added by proxy path | Perf budget |

Ablations to report: structural-only vs +behavioural vs +semantic; with vs without consumer-aware impact; with vs without optional LLM proposer.

---

## 7. Demo Scenario (summary; full script in `Harness.md` §13)

**Shipwell** (demo app: checkout, profile, search-browse, notification-ack, MCP-tool-call) depends on five simulated services. A switchboard injects:
- **Auto-repaired:** `name`→`display_name`; dollars→cents; offset→cursor pagination; webhook nesting; MCP arg rename; new 429 policy.
- **Refused and escalated:** `"Last, First"` name format (lossy); `active` enum meaning change (unknown).
- **Chaos:** a deliberately bad adapter that validation catches and rolls back.

The dashboard shows the timeline (drift → impact → adapter → validation → green) and the MCP server returns the same facts to an external agent.

---

## 8. Risks & Mitigations

| Risk | Mitigation |
|---|---|
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

- oasdiff-based breaking-change CI patterns: https://gist.github.com/al-maisan/b905a93c60b88588064029fca38ed5e5 · https://qaskills.sh/blog/api-testing-openapi-spec-drift-detection
- Passive response-schema drift tools: https://github.com/kriskimmerle/diffapi (archived) · https://packagist.org/packages/malikad778/php-sentinel · https://packagist.org/packages/fissible/drift
- Vendor framing of "API drift" and scale of events: https://d3security.com/?p=59423
- Consumer-driven contracts and semantic limits: https://oneuptime.com/blog/post/2026-08-24-consumer-driven-contract-breaking-changes/view · https://qaskills.sh/blog/api-contract-testing-interview-scenarios · https://gravitee.io/corpus/gen-2171/list-of-unit-testing-frameworks/contract-testing-frameworks-for-apis.html · https://www.techtarget.com/searchsoftwarequality/tip/Contract-driven-testing-syncs-API-providers-consumers
- MCP rug-pull / tool-definition drift: https://zuplo.com/blog/remote-mcp-server-rug-pull/ · https://pypi.org/project/mcpseal/ · https://docs.orcarouter.ai/security/mcp/schema-drift-states · https://docs.rs/crate/ramparts/latest/source/src/baseline.rs · https://dev.to/luckypipewrench/your-mcp-servers-tool-descriptions-are-an-attack-surface-37pj/comments
- LLM schema matching / adaptation: Matchmaker, https://proceedings.mlr.press/v267/seedat25a.html · MID middleware, https://arxiv.org/pdf/2603.28731.pdf · typed LLM mapping commands, https://www.arxiv.org/pdf/2406.11227
- Vendor "self-healing mapping" claims (treat as marketing): https://www.putitforward.com/platform/agents/data-integration-governance/auto-data-mapping-schema-agent

> Research caveat: findings come from public docs, READMEs and abstracts surfaced in a limited search pass. Before publishing externally, verify claims against primary sources and extend with a deeper literature pass (concept-drift detection, API evolution mining, Hyrum's Law case studies, Stripe-style API versioning).