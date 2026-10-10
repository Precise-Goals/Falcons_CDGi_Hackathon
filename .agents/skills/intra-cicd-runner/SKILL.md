---
name: intra-cicd-runner
description: >-
  Use this skill to execute the multi-stage quality gates (G1 Typecheck, G2 Lint, G3 Unit Tests, G4 Coverage, G8 Integration, G9 E2E Demo) for the Intra monorepo.
---

# Intra Autonomous CI/CD Runner

This skill runs the official 9-gate quality verification pipeline for the Intra monorepo.

## Quality Gates Sequence

Execute gates in strict order:

1. **G1 Typecheck**:
   ```powershell
   pnpm -w typecheck
   ```
   Verifies TypeScript compilation across all 13 monorepo workspace packages.

2. **G2 Lint**:
   ```powershell
   pnpm -w lint
   ```

3. **G3 Unit Tests**:
   ```powershell
   pnpm -w test
   ```
   Runs Vitest test suites for all packages (shared, observer, model, differ, impact, adapter, validator, sdk, sim-services, mcpserver, engine, demo-app, web).

4. **G8 Integration**:
   ```powershell
   pnpm --filter @intra/engine test
   ```
   Validates in-process Fastify pipeline integration and REST endpoints.

5. **G9 E2E Acceptance Demonstration**:
   ```powershell
   pnpm exec vitest run tests/e2e/demo.spec.ts
   ```
   Asserts the complete §13 demo script from clean clone to active adaptation.

## Verification Checklist
- [ ] G1: 21/21 Turbo tasks successful (zero TS errors)
- [ ] G3: 22/22 test suites green
- [ ] G9: All demo assertions pass (baseline green -> mutation red -> adapter green -> quarantine -> rollback)
