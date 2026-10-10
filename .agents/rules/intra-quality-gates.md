# Intra Quality Gates & Architecture Rules

1. **Strict TypeScript**: Every TypeScript file must compile with `tsc --noEmit`. No `any` types in public interfaces.
2. **Safe-Handling Enforcement**: Never auto-apply an adapter unless confidence ≥ 0.90 AND the semantic verdict is `equivalent`.
3. **Module Ownership Boundaries**: Respect package boundaries defined in `HARNESS.md` §5. Escalate cross-package changes through `.harness/BLOCKERS.md`.
4. **Washi & Crimson Design System**: Dashboard components in `apps/web` must adhere strictly to Washi & Crimson tokens (`--crimson`, `--sumi`, `--washi`, `--white`, `--ash`). Light theme only.
5. **No Blind Trust**: An agent's claim of "done" is invalid until verified by independent automated test gates.
