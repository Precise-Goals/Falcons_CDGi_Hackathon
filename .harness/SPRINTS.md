# SPRINTS.md: Sprint Board & Exit Criteria

## Sprint 0: Foundations
- [ ] W0: architect -> ADR-001 pipeline & data model; publish `packages/shared` types; lock STACK.md
- [ ] W1: devops -> Monorepo scaffold, pnpm/Turbo, tsconfig, ESLint, Vitest, CI skeleton
- [ ] W1: scribe -> CLAUDE.md/AGENTS.md pointers, README skeleton, docs structure
- [ ] W1: sim-dev -> Sim service skeleton + mutation switchboard API contract
- [ ] W2: qa-engineer -> Validate scaffold: gates run green on empty packages
**Exit Criteria:** `pnpm -w typecheck lint test build` green; first PR merged via autonomous pipeline.

## Sprint 1: Observe & Simulate
- [ ] W0: architect -> Interface review of observer/sim contracts
- [ ] W1: observer-dev -> HTTP capture proxy + SDK wrapper; webhook receiver; redaction of PII; storage
- [ ] W1: sim-dev -> 4 simulated services (Users, Payments, Search, Notifications) + MCP-tool service
- [ ] W1: sim-dev (2nd) -> Mutation catalogue v1 (M1-M10) toggled via switchboard
- [ ] W1: web-dev -> Dashboard shell: layout, auth stub, Services list page
- [ ] W2: qa-engineer -> Unit + integration tests for capture fidelity (headers, status, body, latency)
**Exit Criteria:** Traffic from demo-app to all sim services captured with ≥99% fidelity in tests.

## Sprint 2: Model (learn real behaviour)
- [ ] W1: model-dev -> Schema inference (types, optionality, enums, formats)
- [ ] W1: model-dev (2nd) -> Behavioural fingerprint (value distributions, units, defaults, cardinality)
- [ ] W1: model-dev (3rd) -> Error taxonomy, pagination detector, rate-limit policy learner
- [ ] W1: web-dev -> Contract viewer page (per endpoint model, field stats)
- [ ] W2: qa-engineer -> Property-based tests on inference; stability under noisy data
**Exit Criteria:** Model for each sim service built from observation only; contract viewer renders it.

## Sprint 3: Detect (change detection)
- [ ] W1: differ-dev -> Structural diff (add/remove/type change/nullability)
- [ ] W1: differ-dev (2nd) -> Semantic drift (renames, unit/scale shift, enum meaning, default flip, format)
- [ ] W1: differ-dev (3rd) -> Behavioural diff (pagination, error shape, rate-limit, truncation, latency)
- [ ] W1: web-dev -> Drift feed UI with severity + confidence
- [ ] W2: differ-dev -> Confidence scoring + false-positive suppression (statistical windows)
- [ ] W3: qa-engineer -> Benign-change corpus + malicious-change corpus; precision/recall report
**Exit Criteria:** Recall ≥0.95, precision ≥0.90 on the mutation catalogue; reported in CI artifact.

## Sprint 4: Impact & Adapt
- [ ] W1: impact-dev -> Static dependency scan (AST: field usage per workflow) + runtime trace correlation
- [ ] W1: impact-dev (2nd) -> Workflow graph + blast-radius query ("what depends on name?")
- [ ] W1: adapter-dev -> Adapter generators (rename, transform, default injection, pagination, retry/backoff)
- [ ] W1: adapter-dev (2nd) -> Safe-handling policy engine (§10), migration PR generator, rollback handles
- [ ] W1: web-dev -> Impact view + adapter/proposal review UI
- [ ] W2: qa-engineer -> Tests: adapter correctness, policy thresholds, rollback
**Exit Criteria:** For each catalogue mutation, an adapter or proposal produced per §10.

## Sprint 5: Validate & Demo
- [ ] W1: validator-dev -> Replay engine: recorded workflows vs adapted service; golden assertions
- [ ] W1: validator-dev (2nd) -> Semantic-equivalence checker
- [ ] W1: sim-dev -> Demo app Shipwell workflows (checkout, user-profile, search-browse, notification, MCP)
- [ ] W1: mcp-dev -> Customer MCP server
- [ ] W1: web-dev -> Live demo console: mutation toggles, timeline, before/after
- [ ] W2: validator-dev -> `pnpm demo` one-command orchestration
- [ ] W3: qa-engineer -> E2E: full demo script assertions (§13)
**Exit Criteria:** Demo Script passes in CI.

## Sprint 6: Harden & Ship
- [ ] W1: qa-engineer -> Chaos tests (flapping service, partial outage, combined mutations), perf budget
- [ ] W1: reviewer -> Security/threat model review (PII, SSRF in proxy, adapter code-injection)
- [ ] W1: scribe -> Docs, architecture diagram, quick-start, MCP usage guide
- [ ] W1: devops -> Release workflow, container images, deploy dashboard, tag v1.0.0
- [ ] W2: orchestrator -> Final retro; `<promise>ALL_COMPLETE</promise>` after reviewer sign-off
**Exit Criteria:** v1.0.0 tagged, main green, demo reproducible from clean clone.
