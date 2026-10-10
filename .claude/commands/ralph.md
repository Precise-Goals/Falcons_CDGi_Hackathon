# /ralph

1. Execute the autonomous loop driver `.harness/loop.sh`.
2. Monitor loop output logs in `.harness/loop.log`.
3. Stop automatically when `<promise>SPRINT_COMPLETE</promise>` or `<promise>ALL_COMPLETE</promise>` is emitted.
4. If loop detects stuck threshold (3 iterations without repo diff), escalate immediately to `.harness/BLOCKERS.md`.
