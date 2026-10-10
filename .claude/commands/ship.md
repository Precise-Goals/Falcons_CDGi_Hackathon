# /ship

1. Verify local quality gates G1-G8 are completely green.
2. Push integration branch to origin via `git push -u origin sprint/<n>`.
3. Open PR via `gh pr create` using `.github/pull_request_template.md`.
4. Monitor CI checks and CodeRabbit review comments via `gh pr checks --watch`.
5. Dispatch fixes to owning subagents if actionable comments arise.
6. Apply auto-merge (`gh pr merge --squash --auto`) once all gates and approvals pass.
7. Update `.harness/STATE.md` and clean up worktrees.
