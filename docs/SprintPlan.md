# Intra: Sprint Execution Plan

## 1. Sprint Overview

| Sprint | Name | Duration Estimate | Key Deliverables | Exit Criteria | Risk Level |
|---|---|---|---|---|---|
| **0** | Foundations | 1 day | Shared types, monorepo setup, pipeline | CI green, first PR merged autonomously | Low |
| **1** | Observe & Simulate | 2 days | Observer, sim-services, dashboard shell | Traffic captured with ≥99% fidelity | Medium |
| **2** | Model | 3 days | Contract inference, behavioral fingerprints | Models built from traffic, visible in UI | High |
| **3** | Detect | 3 days | Structural & semantic drift detection | Recall ≥0.95, precision ≥0.90 on mutations | High |
| **4** | Impact & Adapt | 3 days | Dependency graph, adapters, migration PRs | Adapter or proposal produced per policy | High |
| **5** | Validate & Demo | 2 days | Replay engine, semantic equivalence, MCP | Demo script passes in CI | Medium |
| **6** | Harden & Ship | 2 days | Chaos tests, security, docs, v1.0.0 | v1.0.0 tagged, ready for public demo | Low |

---

## 2. Sprint 0: Foundations

### T-001 · architect: ADR-001 pipeline & data model
- **agent**: architect
- **deps**: none
- **paths**: `docs/adr/*`, `packages/shared/**`
- **accept**:
  - [ ] Publish `Observation`, `Contract`, `Change`, `Impact`, `Adapter`, `ValidationResult` interfaces
  - [ ] Lock STACK.md rules
- **wave**: W0
- **status**: todo

### T-002 · devops: Monorepo scaffold
- **agent**: devops
- **deps**: T-001
- **paths**: `.github/**`, `package.json`, `tsconfig.json`, `pnpm-workspace.yaml`
- **accept**:
  - [ ] Setup pnpm, Turborepo, Vitest, ESLint, husky
  - [ ] GitHub Actions CI skeleton
- **wave**: W1
- **status**: todo

### T-003 · scribe: Docs skeleton
- **agent**: scribe
- **deps**: T-001
- **paths**: `README.md`, `docs/**`
- **accept**:
  - [ ] Setup CLAUDE.md/AGENTS.md pointers
  - [ ] Write README skeleton
- **wave**: W1
- **status**: todo

### T-004 · sim-dev: Sim service skeleton
- **agent**: sim-dev
- **deps**: T-001
- **paths**: `packages/sim-services/**`
- **accept**:
  - [ ] Basic Fastify server structure
  - [ ] Mutation switchboard API contract
- **wave**: W1
- **status**: todo

### T-005 · qa-engineer: Validate scaffold
- **agent**: qa-engineer
- **deps**: T-002, T-003, T-004
- **paths**: `**/*.test.ts`
- **accept**:
  - [ ] Gates run green on empty packages
- **wave**: W2
- **status**: todo

---

## 3. Sprint 1: Observe & Simulate

### T-010 · architect: Interface review of observer/sim contracts
- **agent**: architect
- **deps**: T-001
- **paths**: `packages/shared/**`
- **accept**:
  - [ ] Observer and sim service API interfaces finalized
- **wave**: W0
- **status**: todo

### T-011 · observer-dev: HTTP capture proxy + SDK wrapper
- **agent**: observer-dev
- **deps**: T-010
- **paths**: `packages/observer/**`, `packages/sdk/**`
- **accept**:
  - [ ] PII redaction mechanism
  - [ ] Storage to `observations` table/store
  - [ ] Webhook receiver implemented
- **wave**: W1
- **status**: todo

### T-012 · sim-dev: Core simulated services
- **agent**: sim-dev
- **deps**: T-010
- **paths**: `packages/sim-services/**`
- **accept**:
  - [ ] Implement Users, Payments, Search, Notifications webhook, and MCP-tool service
- **wave**: W1
- **status**: todo

### T-013 · sim-dev: Mutation catalogue v1
- **agent**: sim-dev
- **deps**: T-012
- **paths**: `packages/sim-services/**`
- **accept**:
  - [ ] Implement 10 documented mutations togglable via switchboard
- **wave**: W1
- **status**: todo

### T-014 · web-dev: Dashboard shell
- **agent**: web-dev
- **deps**: T-010
- **paths**: `apps/web/**`
- **accept**:
  - [ ] React 18 + Vite setup
  - [ ] Layout, auth stub, Services list page
- **wave**: W1
- **status**: todo

### T-015 · qa-engineer: Traffic fidelity tests
- **agent**: qa-engineer
- **deps**: T-011, T-012, T-013, T-014
- **paths**: `tests/int/**`
- **accept**:
  - [ ] Verify traffic from demo-app to sim services captured with ≥99% fidelity
- **wave**: W2
- **status**: todo

---

## 4. Sprint 2: Model

### T-020 · model-dev: Schema inference
- **agent**: model-dev
- **deps**: T-011, T-012
- **paths**: `packages/model/**`
- **accept**:
  - [ ] Infer types, optionality, enums, formats from captured traffic
- **wave**: W1
- **status**: todo

### T-021 · model-dev: Behavioural fingerprint
- **agent**: model-dev
- **deps**: T-020
- **paths**: `packages/model/**`
- **accept**:
  - [ ] Extract value distributions, units, defaults, cardinality
- **wave**: W1
- **status**: todo

### T-022 · model-dev: Advanced semantics
- **agent**: model-dev
- **deps**: T-020
- **paths**: `packages/model/**`
- **accept**:
  - [ ] Error taxonomy, pagination detector (cursor/offset/page/link-header)
  - [ ] Rate-limit policy learner
- **wave**: W1
- **status**: todo

### T-023 · web-dev: Contract viewer UI
- **agent**: web-dev
- **deps**: T-020
- **paths**: `apps/web/**`
- **accept**:
  - [ ] Display per-endpoint models and field statistics
- **wave**: W1
- **status**: todo

### T-024 · qa-engineer: Inference validation
- **agent**: qa-engineer
- **deps**: T-021, T-022, T-023
- **paths**: `tests/int/**`
- **accept**:
  - [ ] Property-based tests pass; models handle noisy data gracefully
- **wave**: W2
- **status**: todo

---

## 5. Sprint 3: Detect

### T-030 · differ-dev: Structural diff
- **agent**: differ-dev
- **deps**: T-020
- **paths**: `packages/differ/**`
- **accept**:
  - [ ] Detect additions, removals, type changes, nullability changes
- **wave**: W1
- **status**: todo

### T-031 · differ-dev: Semantic drift
- **agent**: differ-dev
- **deps**: T-021, T-022
- **paths**: `packages/differ/**`
- **accept**:
  - [ ] Rename candidates, unit/scale shift, enum meaning change
  - [ ] Default flip, timezone/format change
- **wave**: W1
- **status**: todo

### T-032 · differ-dev: Behavioural diff
- **agent**: differ-dev
- **deps**: T-022
- **paths**: `packages/differ/**`
- **accept**:
  - [ ] Pagination change, error shape change, rate-limit change
  - [ ] Silent truncation, latency regime shift
- **wave**: W1
- **status**: todo

### T-033 · web-dev: Drift feed UI
- **agent**: web-dev
- **deps**: T-023
- **paths**: `apps/web/**`
- **accept**:
  - [ ] Render drift feed with severity and confidence scores
- **wave**: W1
- **status**: todo

### T-034 · differ-dev: Confidence & false-positives
- **agent**: differ-dev
- **deps**: T-030, T-031, T-032
- **paths**: `packages/differ/**`
- **accept**:
  - [ ] Confidence scoring and statistical window suppression
- **wave**: W2
- **status**: todo

### T-035 · qa-engineer: Precision/recall reporting
- **agent**: qa-engineer
- **deps**: T-034, T-033
- **paths**: `tests/int/**`
- **accept**:
  - [ ] Test benign vs malicious corpus; recall ≥0.95, precision ≥0.90
- **wave**: W3
- **status**: todo

---

## 6. Sprint 4: Impact & Adapt

### T-040 · impact-dev: Static & runtime dependency scanning
- **agent**: impact-dev
- **deps**: T-030
- **paths**: `packages/impact/**`
- **accept**:
  - [ ] AST parsing for field usage
  - [ ] Runtime trace correlation
- **wave**: W1
- **status**: todo

### T-041 · impact-dev: Workflow graph
- **agent**: impact-dev
- **deps**: T-040
- **paths**: `packages/impact/**`
- **accept**:
  - [ ] Generate workflow graph and answer blast-radius queries
- **wave**: W1
- **status**: todo

### T-042 · adapter-dev: Adapter generators
- **agent**: adapter-dev
- **deps**: T-031, T-032
- **paths**: `packages/adapter/**`
- **accept**:
  - [ ] Rename, transform, default injection, pagination normalizer, retry
- **wave**: W1
- **status**: todo

### T-043 · adapter-dev: Safe-handling policy engine
- **agent**: adapter-dev
- **deps**: T-042
- **paths**: `packages/adapter/**`
- **accept**:
  - [ ] Migration PR generator, rollback handles based on confidence (§10)
- **wave**: W1
- **status**: todo

### T-044 · web-dev: Impact & Review UI
- **agent**: web-dev
- **deps**: T-033, T-041
- **paths**: `apps/web/**`
- **accept**:
  - [ ] Visual impact view and adapter/proposal review screens
- **wave**: W1
- **status**: todo

### T-045 · qa-engineer: Adapter validation
- **agent**: qa-engineer
- **deps**: T-041, T-043, T-044
- **paths**: `tests/int/**`
- **accept**:
  - [ ] Correct adapters generated for catalogue mutations
- **wave**: W2
- **status**: todo

---

## 7. Sprint 5: Validate & Demo

### T-050 · validator-dev: Replay engine
- **agent**: validator-dev
- **deps**: T-043
- **paths**: `packages/validator/**`
- **accept**:
  - [ ] Replay recorded workflows against adapted service, golden assertions
- **wave**: W1
- **status**: todo

### T-051 · validator-dev: Semantic-equivalence checker
- **agent**: validator-dev
- **deps**: T-050
- **paths**: `packages/validator/**`
- **accept**:
  - [ ] Verify semantic meaning preservation across adaptations
- **wave**: W1
- **status**: todo

### T-052 · sim-dev: Demo app workflows
- **agent**: sim-dev
- **deps**: T-013
- **paths**: `apps/demo-app/**`
- **accept**:
  - [ ] Shipwell workflows (checkout, search, etc.) implemented
- **wave**: W1
- **status**: todo

### T-053 · mcp-dev: Customer MCP server
- **agent**: mcp-dev
- **deps**: T-040
- **paths**: `mcpserver/**`
- **accept**:
  - [ ] Expose standard tools/resources matching the API spec
- **wave**: W1
- **status**: todo

### T-054 · web-dev: Live demo console
- **agent**: web-dev
- **deps**: T-044
- **paths**: `apps/web/**`
- **accept**:
  - [ ] Mutation toggles, timeline view, before/after adapter state
- **wave**: W1
- **status**: todo

### T-055 · validator-dev: Single command orchestration
- **agent**: validator-dev
- **deps**: T-050, T-052
- **paths**: `packages/validator/**`
- **accept**:
  - [ ] `pnpm demo` orchestration working seamlessly
- **wave**: W2
- **status**: todo

### T-056 · qa-engineer: E2E Demo assertions
- **agent**: qa-engineer
- **deps**: T-051, T-053, T-054, T-055
- **paths**: `tests/e2e/**`
- **accept**:
  - [ ] Full demo script tests pass in CI
- **wave**: W3
- **status**: todo

---

## 8. Sprint 6: Harden & Ship

### T-060 · qa-engineer: Chaos & Performance
- **agent**: qa-engineer
- **deps**: T-056
- **paths**: `tests/e2e/**`
- **accept**:
  - [ ] Chaos tests pass (flapping, partial outage)
  - [ ] Performance budget verified
- **wave**: W1
- **status**: todo

### T-061 · reviewer: Security review
- **agent**: reviewer
- **deps**: T-056
- **paths**: `**/*`
- **accept**:
  - [ ] Threat model validation (PII, SSRF, code injection)
- **wave**: W1
- **status**: todo

### T-062 · scribe: Final Documentation
- **agent**: scribe
- **deps**: T-056
- **paths**: `docs/**`, `README.md`
- **accept**:
  - [ ] Arch diagram, quick-start, and MCP usage guide complete
- **wave**: W1
- **status**: todo

### T-063 · devops: Release pipeline
- **agent**: devops
- **deps**: T-056
- **paths**: `.github/**`
- **accept**:
  - [ ] Container images built, dashboard deployed, v1.0.0 tagged
- **wave**: W1
- **status**: todo

### T-064 · orchestrator: Final Retro & Promises
- **agent**: orchestrator
- **deps**: T-060, T-061, T-062, T-063
- **paths**: `.harness/STATE.md`
- **accept**:
  - [ ] Emit `<promise>ALL_COMPLETE</promise>`
- **wave**: W2
- **status**: todo

---

## 9. Dependency Graph

```mermaid
flowchart TD
    %% Sprint 0
    T001[T-001: ADR & Types] --> T002[T-002: Scaffold]
    T001 --> T003[T-003: Docs]
    T001 --> T004[T-004: Sim skeleton]
    T002 --> T005[T-005: Validate S0]
    T003 --> T005
    T004 --> T005

    %% Sprint 1
    T001 --> T010[T-010: Interface Review]
    T010 --> T011[T-011: Observer proxy]
    T010 --> T012[T-012: Core Sim Services]
    T010 --> T014[T-014: Dashboard shell]
    T012 --> T013[T-013: Mutations]
    T011 --> T015[T-015: S1 Validation]
    T012 --> T015
    T013 --> T015
    T014 --> T015

    %% Sprint 2
    T011 --> T020[T-020: Schema inference]
    T012 --> T020
    T020 --> T021[T-021: Behavioural inference]
    T020 --> T022[T-022: Advanced Semantics]
    T020 --> T023[T-023: Contract UI]
    T021 --> T024[T-024: S2 Validation]
    T022 --> T024
    T023 --> T024

    %% Sprint 3
    T020 --> T030[T-030: Structural Diff]
    T021 --> T031[T-031: Semantic Drift]
    T022 --> T031
    T022 --> T032[T-032: Behavioural Diff]
    T023 --> T033[T-033: Drift UI]
    T030 --> T034[T-034: Confidence]
    T031 --> T034
    T032 --> T034
    T034 --> T035[T-035: Precision/Recall Testing]
    T033 --> T035

    %% Sprint 4
    T030 --> T040[T-040: Dependency Scan]
    T040 --> T041[T-041: Workflow Graph]
    T031 --> T042[T-042: Adapters]
    T032 --> T042
    T042 --> T043[T-043: Policy Engine]
    T033 --> T044[T-044: Impact UI]
    T041 --> T044
    T041 --> T045[T-045: S4 Validation]
    T043 --> T045
    T044 --> T045

    %% Sprint 5
    T043 --> T050[T-050: Replay Engine]
    T050 --> T051[T-051: Semantic Eq Checker]
    T013 --> T052[T-052: Demo App]
    T040 --> T053[T-053: MCP Server]
    T044 --> T054[T-054: Demo UI]
    T050 --> T055[T-055: demo command]
    T052 --> T055
    T051 --> T056[T-056: E2E Demo]
    T053 --> T056
    T054 --> T056
    T055 --> T056

    %% Sprint 6
    T056 --> T060[T-060: Chaos Tests]
    T056 --> T061[T-061: Security Review]
    T056 --> T062[T-062: Final Docs]
    T056 --> T063[T-063: Release Pipeline]
    T060 --> T064[T-064: Final Retro]
    T061 --> T064
    T062 --> T064
    T063 --> T064
```

---

## 10. Risk Matrix

| Risk | Sprint | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| Ambiguous schema inference from low traffic | 2 | High | High | Fall back to structural models initially; run extensive fuzz/sim traffic |
| False positives in semantic drift | 3 | Medium | High | Strict confidence gating, statistical sliding windows, tuning on benign corpus |
| Unsafe adapter generation breaks downstream | 4 | Low | Critical | Replay validation + Semantic-equivalence checking prior to proposal |
| High memory footprint in monolith engine | 6 | Medium | Medium | Stream processing for proxies, strict limits on buffered observations |

---

## 11. Parallel Execution Plan

```mermaid
gantt
    title Intra Autonomous Execution Plan
    dateFormat YYYY-MM-DD
    axisFormat %d

    section S0: Foundations
    W0: ADR & Types (architect)           :a1, 2026-10-10, 2h
    W1: Scaffold (devops)                 :a2, after a1, 2h
    W1: Docs (scribe)                     :a3, after a1, 2h
    W1: Sim Skeleton (sim-dev)            :a4, after a1, 2h
    W2: Validate (qa-engineer)            :a5, after a2 a3 a4, 1h

    section S1: Observe & Simulate
    W0: Interface Review (architect)      :b1, after a5, 1h
    W1: Observer proxy (observer-dev)     :b2, after b1, 4h
    W1: Core Sim (sim-dev)                :b3, after b1, 4h
    W1: Dashboard (web-dev)               :b4, after b1, 4h
    W1: Mutations (sim-dev)               :b5, after b3, 2h
    W2: Traffic Fidelity (qa-engineer)    :b6, after b2 b5 b4, 2h

    section S2: Model
    W1: Schema Inference (model-dev)      :c1, after b6, 6h
    W1: Behavioural (model-dev)           :c2, after b6, 6h
    W1: Advanced Semantics (model-dev)    :c3, after b6, 6h
    W1: Contract UI (web-dev)             :c4, after b6, 6h
    W2: Inference QA (qa-engineer)        :c5, after c1 c2 c3 c4, 4h

    section S3: Detect
    W1: Structural Diff (differ-dev)      :d1, after c5, 5h
    W1: Semantic Drift (differ-dev)       :d2, after c5, 5h
    W1: Behavioural Diff (differ-dev)     :d3, after c5, 5h
    W1: Drift UI (web-dev)                :d4, after c5, 5h
    W2: Confidence/FP (differ-dev)        :d5, after d1 d2 d3, 4h
    W3: Prec/Rec Tests (qa-engineer)      :d6, after d5 d4, 3h

    section S4: Impact & Adapt
    W1: Dep Scan (impact-dev)             :e1, after d6, 5h
    W1: Adapters (adapter-dev)            :e2, after d6, 5h
    W1: Impact UI (web-dev)               :e3, after d6, 5h
    W2: Policy Engine (adapter-dev)       :e4, after e2, 4h
    W2: Workflow Graph (impact-dev)       :e5, after e1, 4h
    W3: QA Adapters (qa-engineer)         :e6, after e4 e5 e3, 3h

    section S5: Validate & Demo
    W1: Replay Engine (validator-dev)     :f1, after e6, 5h
    W1: Demo App (sim-dev)                :f2, after e6, 5h
    W1: MCP Server (mcp-dev)              :f3, after e6, 5h
    W1: Demo UI (web-dev)                 :f4, after e6, 5h
    W2: Sem. Eq Checker (validator-dev)   :f5, after f1, 4h
    W2: Demo Command (validator-dev)      :f6, after f1 f2, 4h
    W3: E2E Demo (qa-engineer)            :f7, after f3 f4 f5 f6, 4h

    section S6: Harden & Ship
    W1: Chaos/Perf (qa-engineer)          :g1, after f7, 3h
    W1: Security (reviewer)               :g2, after f7, 3h
    W1: Final Docs (scribe)               :g3, after f7, 3h
    W1: Pipeline (devops)                 :g4, after f7, 3h
    W2: Final Retro (orchestrator)        :g5, after g1 g2 g3 g4, 2h
```
