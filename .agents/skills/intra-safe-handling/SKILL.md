---
name: intra-safe-handling
description: >-
  Use this skill to evaluate the Safe-Handling Policy Matrix (§10), generate compatibility adapters, create migration PR proposals, and manage rollback handles.
---

# Intra Safe-Handling Policy Skill

Enforces safe-failure rules when adapting external services.

## Policy Matrix

| Confidence | Verdict | Action |
|---|---|---|
| ≥ 0.90 | `equivalent` | Auto-generate adapter -> validate -> **auto-apply canary** |
| 0.70–0.90 | `equivalent` / `lossy` | Generate adapter + **open migration PR**, shadow only |
| < 0.70 or `unknown` | any | **No auto-apply**. Quarantine workflows, alert with evidence bundle |
| any | `breaking` | **Circuit-break dependency**, trigger fallback, propose migration PR |

## Adapter Generation Rules
1. Every generated adapter MUST include a unique `rollbackHandle`.
2. Every adapter MUST run through `@intra/validator` golden test replay.
3. If golden tests fail, trigger the rollback handle immediately. Never deploy unverified code.
