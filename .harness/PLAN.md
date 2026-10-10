# PLAN.md: Task Graph with Acceptance Criteria

## Sprint 0: Foundations

### T-001 · architect: ADR-001 pipeline & data model
- agent: architect
- deps: none
- paths: docs/adr/*, packages/shared/**
- accept:
  - [ ] Publish `Observation`, `Contract`, `Change`, `Impact`, `Adapter`, `ValidationResult`, `MigrationProposal` Zod schemas & TS types in `packages/shared`
  - [ ] Create `docs/adr/ADR-001-pipeline-and-data-model.md`
  - [ ] `pnpm --filter @intra/shared test` passes with 100% coverage
- status: doing

### T-002 · devops: Monorepo scaffold
- agent: devops
- deps: T-001
- paths: .github/**, package.json, tsconfig.base.json, pnpm-workspace.yaml, turbo.json
- accept:
  - [ ] pnpm workspaces + Turborepo pipeline setup with strict TS configs
  - [ ] Monorepo scripts (`build`, `test`, `lint`, `typecheck`) configured
  - [ ] `.github/workflows/ci.yml` and `release.yml` created
- status: todo

### T-003 · scribe: Root pointers & docs structure
- agent: scribe
- deps: T-001
- paths: README.md, docs/**, CLAUDE.md, AGENTS.md
- accept:
  - [ ] CLAUDE.md and AGENTS.md pointers established
  - [ ] Root README.md with architecture and quickstart guide
- status: todo

### T-004 · sim-dev: Sim services skeleton & switchboard contract
- agent: sim-dev
- deps: T-001
- paths: packages/sim-services/**
- accept:
  - [ ] Fastify mock service harness for 5 services + switchboard API contract
  - [ ] Unit tests pass
- status: todo

### T-005 · qa-engineer: Validate scaffold
- agent: qa-engineer
- deps: T-002, T-003, T-004
- paths: **/*.test.ts, tests/**
- accept:
  - [ ] Quality gates G1-G4 run green on all packages
- status: todo

---

## Future Sprints (Placeholders)
- **Sprint 1: Observe & Simulate** (T-010 to T-015: Proxy/SDK capture, 5 sim services, mutation catalogue v1, dashboard shell)
- **Sprint 2: Model** (T-020 to T-024: Schema inference, behavioural fingerprinting, error taxonomy, contract viewer UI)
- **Sprint 3: Detect** (T-030 to T-035: Structural/semantic diff, confidence scoring, drift feed UI, precision/recall testing)
- **Sprint 4: Impact & Adapt** (T-040 to T-045: Dependency graph, adapter generators, safe-handling policy, migration PRs)
- **Sprint 5: Validate & Demo** (T-050 to T-056: Replay engine, semantic equivalence, Shipwell demo app, customer MCP server)
- **Sprint 6: Harden & Ship** (T-060 to T-064: Chaos tests, threat model review, v1.0.0 tagging, release pipeline)
