# STACK.md (LOCKED)

| Area | Choice | Status |
|---|---|---|
| Monorepo | pnpm + Turborepo, Conventional Commits (commitlint, husky) | LOCKED |
| Web | React 18, Vite, TypeScript, Tailwind, shadcn/ui | LOCKED |
| UI extras | React Bits, Magic UI/Aceternity (accents), Motion, GSAP | LOCKED |
| 3D | three.js, @react-three/fiber, @react-three/drei (lazy) | LOCKED |
| Client data | TanStack Query, Zustand, SSE | LOCKED |
| Core app | Fastify core engine `apps/engine` (all pipeline modules in-process) | LOCKED |
| DB | Postgres (Railway) + Drizzle; SQLite local | LOCKED |
| MCP | `mcpserver/` separate folder, Node/TS + `@modelcontextprotocol/sdk`, REST client of engine, Render | LOCKED |
| Tests | Vitest, Playwright, Testing Library | LOCKED |
| Hosting | Vercel (web), Railway (engine+DB), Render (mcpserver) | LOCKED |
| CI | GitHub Actions + CodeRabbit | LOCKED |

## The 6 Locked Product Pillars
1. **Home**: Landing portal, problem orientation per `docs/lock.md`, architecture overview.
2. **Dashboard**: Unified API Observability Interface (Traffic, Contracts, Drift, Blast Radius, Safe Adapters, Replay, Switchboard).
3. **Agent**: Autonomous Multi-Agent Adaptation System & CI/CD Gate Runner (G1–G9).
4. **MCP**: Customer Model Context Protocol Server (`mcpserver/`) with 7 tools.
5. **SDK**: Client Library & Dynamic Proxy Interceptor (`@intra/sdk`).
6. **Docs**: Interactive Documentation, Behavioral Contracts, and `docs/lock.md` Problem Statement Solver.

## Env contract
- web: `VITE_API_URL`
- engine: `DATABASE_URL`, `PORT`, `CORS_ORIGIN`, `MCP_API_KEYS` (hashed)
- mcpserver: `INTRA_API_URL`, `INTRA_API_KEY`, `PORT`

## Deployment notes
- Render free tier sleeps; use a paid instance or a health ping for the MCP demo.
- Railway: one service (engine) + Postgres plugin. Run migrations on deploy (`pnpm db:migrate`).
- Vercel: root dir `apps/web`, SPA rewrite to `index.html`.
