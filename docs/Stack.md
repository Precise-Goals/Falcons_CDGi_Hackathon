# STACK.md (LOCKED; copy to .harness/STACK.md)

| Area | Choice | Status |
|---|---|---|
| Monorepo | pnpm + Turborepo, Conventional Commits (commitlint, husky) | LOCKED |
| Web | React 18, Vite, TypeScript, Tailwind, shadcn/ui | LOCKED |
| UI extras | React Bits, Magic UI/Aceternity (accents), Motion, GSAP | LOCKED |
| 3D | three.js, @react-three/fiber, @react-three/drei (lazy) | LOCKED |
| Client data | TanStack Query, Zustand, SSE | LOCKED |
| Core app | Fastify monolith `apps/engine` (all pipeline modules in-process) | LOCKED |
| DB | Postgres (Railway) + Drizzle; SQLite local | LOCKED |
| MCP | `mcpserver/` separate folder, Node/TS + `@modelcontextprotocol/sdk`, REST client of engine, Render | LOCKED |
| Tests | Vitest, Playwright, Testing Library | LOCKED |
| Auth | Firebase Authentication (strict), firebase-admin on server | LOCKED |
| Wallet | BridgeKey on MST Blockchain via MST SDK, behind `WalletProvider`; link only, no txs | LOCKED (SDK package/docs PENDING) |
| Ledger | Hash chain + signed entries, no public chain; hashes console-logged | LOCKED |
| Product mode | Real startup: multi-tenant, API keys, audit, retention | LOCKED |
| Hosting | Vercel (web), Railway (engine+DB), Render (mcpserver) | LOCKED |
| CI | GitHub Actions + CodeRabbit | LOCKED |

## Env contract
- web: `VITE_API_URL`, `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`
- engine: `DATABASE_URL`, `PORT`, `CORS_ORIGIN`, `MCP_API_KEYS` (hashed), `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `LEDGER_SIGNING_KEY`, `MST_NETWORK` (testnet|mainnet)
- mcpserver: `INTRA_API_URL`, `INTRA_API_KEY`, `PORT`

## Deployment notes
- Render free tier sleeps; use a paid instance or a health ping for the MCP demo.
- Railway: one service (engine) + Postgres plugin. Run migrations on deploy (`pnpm db:migrate`).
- Vercel: root dir `apps/web`, SPA rewrite to `index.html`.