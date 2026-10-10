# /gsd-verify

1. Run quality gates in strict order: G1 typecheck -> G2 lint -> G3 unit tests -> G4 coverage.
2. Delegate G5 to `qa-engineer` for independent edge-case test creation (cannot edit `src`).
3. Delegate G6 to local `coderabbit review --plain` check.
4. Delegate G7 to `reviewer` for architecture & security spot-check.
5. Run G8 integration tests (`pnpm -w test:int`).
6. If sprint release, run G9 E2E Playwright tests (`pnpm demo` assertions).
7. Return compact results only (pass/fail counts + actionable blockers).
