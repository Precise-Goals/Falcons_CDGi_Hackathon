# Intra Guidelines for Claude

Read `HARNESS.md` §0-§2 first before taking any action.
- Locked stack decisions: `.harness/STACK.md`
- Active sprint, wave, and task pointer: `.harness/STATE.md`
- Task graph and acceptance criteria: `.harness/PLAN.md`
- Design system: `.harness/DESIGN.md` (Washi & Crimson, light only)
- Respect strict module ownership paths per `HARNESS.md` §5.
- Return output strictly following the 5-line subagent contract (`HARNESS.md` §5):
  STATUS | FILES | TESTS | BLOCKERS | NEXT
- Never edit files outside your owned paths. Escalate cross-boundary changes via `.harness/BLOCKERS.md`.
