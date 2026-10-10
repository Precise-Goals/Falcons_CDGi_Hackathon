# /gsd-plan

1. Read `.harness/STATE.md` to identify the active sprint.
2. Expand the current sprint tasks from `HARNESS.md` §11 into detailed task blocks in `.harness/PLAN.md` using the §6.3 schema.
3. Compute task dependencies and group them into topological waves (W0, W1, W2...).
4. Enforce parallel width ceiling ≤ 5.
5. Update `.harness/STATE.md` with the new wave plan and return a concise summary.
