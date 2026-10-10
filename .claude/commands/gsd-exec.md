# /gsd-exec

1. Read `.harness/STATE.md` and `.harness/PLAN.md` for current wave tasks.
2. Dispatch subagents in parallel (width ≤ 5), each in its own git worktree (`wt/<task-id>`).
3. Each subagent implements its single task adhering to owned paths.
4. Barrier: wait for all tasks in the wave to report green.
5. Merge worktrees into `sprint/<n>` integration branch.
6. Update `.harness/STATE.md` with progress and advance wave pointer.
