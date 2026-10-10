# Intra

> **Infrastructure that lets software survive undocumented changes in external services**  
> (APIs, SDKs, MCP servers, webhooks)

[![CI](https://github.com/Precise-Goals/Intra/actions/workflows/ci.yml/badge.svg)](https://github.com/Precise-Goals/Intra/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## The Problem
Modern applications are tightly coupled to third-party dependencies. When an external API flips defaults, alters pagination shapes, introduces rate limits, or renames keys (e.g. `name` -> `display_name`), production workflows silently fail.

## How Intra Solves It
Intra establishes an autonomous learning and adaptation loop:
```
External service → Observed behaviour → Contract/behavioural model → Change detection
→ Impact analysis → Adapter or migration → Validation → Updated system
```

1. **Observe**: Captures live HTTP, webhook, and MCP traffic without relying on static schemas.
2. **Model**: Learns behavioural fingerprints (distributions, formats, pagination styles, error taxonomies).
3. **Detect**: Discovers structural and semantic drift, assigning confidence scores and semantic verdicts (`equivalent`, `lossy`, `breaking`, `unknown`).
4. **Impact**: Scans application ASTs and runtime traces to calculate blast radius on workflows.
5. **Adapt**: Generates compatibility adapters with atomic rollback handles. Enforces safe-handling gates (`confidence >= 0.90` and `equivalent` auto-applied; otherwise opens a Migration PR).
6. **Validate**: Replays golden workflow traces to verify semantic equivalence before deployment.

---

## Architecture & Monorepo Structure

```
Intra/
├── apps/
│   ├── engine/           # Fastify monolith hosting the 6-stage pipeline (Railway)
│   ├── web/              # React 18 + Vite + Tailwind + shadcn dashboard (Vercel)
│   └── demo-app/         # "Shipwell" logistics app consuming simulated APIs
├── mcpserver/            # Customer MCP server for agentic queries (Render)
├── packages/
│   ├── shared/           # Zod schemas, core TypeScript domain models, utilities
│   ├── observer/         # HTTP proxy, webhook receiver, PII redaction
│   ├── model/            # Schema & behavioural fingerprint inference
│   ├── differ/           # Semantic drift classifier & confidence scoring
│   ├── impact/           # AST dependency scanner & blast radius graph
│   ├── adapter/          # Adapter generators & safe-handling policy engine
│   ├── validator/        # Workflow replay engine & golden assertions
│   ├── sim-services/     # 5 simulated external services with mutation switchboard
│   └── sdk/              # Client SDK wrapper
├── docs/                 # Architecture, ADRs, Data Models, Demo Specs
└── .harness/             # Autonomous build harness controls (STATE, PLAN, SPRINTS)
```

---

## Quickstart

### Prerequisites
- Node.js 20+ (Node 24 tested)
- pnpm 9+ (`corepack enable`)

### Installation & Run
```bash
# Clone and install dependencies
git clone https://github.com/Precise-Goals/Intra.git
cd Intra
pnpm install

# Build all packages
pnpm build

# Run unit tests
pnpm test

# Run the complete autonomous demonstration
pnpm demo
```

---

## Documentation
- [Problem Statement](docs/ps.md)
- [Architecture Deep-Dive](docs/Architecture.md)
- [Harness Specifications](HARNESS.md)
- [Data Model & APIs](docs/DataModel.md)
- [Demo Specification](docs/DemoSpec.md)
- [Sprint Execution Plan](docs/SprintPlan.md)
- [Design Tokens (Washi & Crimson)](docs/design.md)
