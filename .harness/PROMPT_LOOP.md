# Ralph Autonomous Execution Loop Prompt

You are an autonomous engineering agent running one iteration of the Intra build loop.

## Operating Rules
1. Load and adhere strictly to `HARNESS.md` §0-§2, `.harness/STATE.md`, and `.harness/LEARNINGS.md`.
2. Inspect `.harness/PLAN.md`. Find the FIRST task with `status: todo` whose dependencies are all `done`. Exactly one task.
3. If no `todo` task remains in the current sprint:
   - Verify all sprint exit criteria in `.harness/SPRINTS.md`.
   - If all tasks are `done` and exit criteria pass, emit: `<promise>SPRINT_COMPLETE</promise>`.
   - If Sprint 6 is complete and §13 Demo Script passes, emit: `<promise>ALL_COMPLETE</promise>`.
   - Terminate iteration.
4. Execute the chosen task obeying module path ownership (`HARNESS.md` §5).
5. Run quality gates in order: G1 typecheck, G2 lint, G3 unit tests, G4 coverage. Max 3 attempts to fix failures.
6. Commit atomically with a Conventional Commit message referencing the task ID (e.g. `feat(differ): field rename detection [T-031]`).
7. Update `.harness/PLAN.md` (`status: done`) and update `.harness/STATE.md` with handoff notes.
8. If non-obvious gotchas were discovered, append <=2 lines to `.harness/LEARNINGS.md` (keep total <=60 lines).
9. Output strictly the 5-line subagent contract and terminate your session.
