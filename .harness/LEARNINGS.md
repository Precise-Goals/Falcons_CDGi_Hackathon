# LEARNINGS.md: Loop-Discovered Gotchas

> Capped at 60 lines. Pruned at every sprint end (merge duplicates, delete stale).
> Append ≤2 lines per non-obvious finding.

- Windows environment uses PowerShell by default; ensure cross-platform path delimiters in Node/TS scripts.
- Corepack enables pnpm seamlessly on Node 24+ without global npm pollution.
- Drizzle ORM supports SQLite (dev/tests) and Postgres (prod) via identical schema definitions.
