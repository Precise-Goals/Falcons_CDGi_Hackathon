# Intra: Comprehensive Application & Ecosystem Guide

Welcome to **Intra** ("The Internet After the API"), the autonomous runtime resilience platform designed to help software survive unannounced changes, altered defaults, and silent semantic drift in external services (APIs, SDKs, MCP servers, webhooks).

---

## 1. Quick Access & Live Deployments

| Component | Production URL (Vercel) | Local Development URL | Description |
|---|---|---|---|
| **Web Portal** | [https://intra-vert.vercel.app](https://intra-vert.vercel.app) | [http://localhost:3000](http://localhost:3000) | Full React 18 + Vite platform portal |
| **Customer MCP Server** | [https://intra-vert.vercel.app/api/mcp](https://intra-vert.vercel.app/api/mcp) | [http://localhost:3002](http://localhost:3002) | Streamable HTTP SSE MCP tools for AI agents |
| **Core Engine** | [https://intra-vert.vercel.app/api/engine](https://intra-vert.vercel.app/api/engine) | [http://localhost:3001](http://localhost:3001) | Fastify 6-stage closed-loop adaptation engine |
| **Simulated Microservices** | [https://intra-vert.vercel.app/api/sim](https://intra-vert.vercel.app/api/sim) | [http://localhost:4000](http://localhost:4000) | 5 live services & 10-mutation Switchboard |
| **Autonomous Lab Route** | [https://intra-vert.vercel.app/eval](https://intra-vert.vercel.app/eval) | [http://localhost:3000/eval](http://localhost:3000/eval) | 50-sample Sarvam AI stress evaluation |

---

## 2. System Architecture

```
Intra/
├── apps/
│   ├── web/          # React 18 + Vite portal (Washi Cream, Crimson & Black theme)
│   ├── engine/       # Fastify monolith hosting the 6-stage adaptation loop
│   └── demo-app/     # "Shipwell" e-commerce app demonstrating red -> green recovery
├── mcpserver/        # Customer MCP server for AI coding agents (Render / Streamable HTTP)
├── packages/
│   ├── shared/       # Zod schemas & shared TypeScript domain contracts
│   ├── observer/     # Traffic capture & PII redactor
│   ├── model/        # Invariant mining, t-digest quantiles & HyperLogLog sketches
│   ├── differ/       # Hungarian bipartite schema matcher & Quantile-Ratio unit shift tester
│   ├── impact/       # AST dependency scanner & blast radius graph
│   ├── adapter/      # FlashFill typed DSL synthesizer & Safe-handling policy engine
│   ├── validator/    # Golden workflow replay & Wald's SPRT canary stopping gate
│   ├── sim-services/ # 5 simulated microservices with 10 mutation switchboards (M1-M10)
│   └── sdk/          # Lightweight dynamic proxy client library (@intra/sdk)
├── scripts/
│   ├── demo.mjs      # Autonomous CLI demonstration runner
│   └── serve.mjs     # Backend ecosystem service launcher
├── docs/             # Complete technical manuals, research papers, and guides
│   ├── lock.md       # Authoritative challenge requirements specification
│   ├── explain.md    # Plain-English decoding of LOCK.MD & algorithmic foundations
│   ├── ALGO.md       # Mathematical algorithm specifications
│   ├── MCP_SETUP.md  # Customer MCP connection guide
│   └── guide.md      # This guide
└── guide.md          # Synchronized root copy of this guide
```

---

## 3. Getting Started: One-Command Execution

Intra is fully optimized for **Bun** (`v1.3.14+`) and **pnpm** with instant startup:

### Step 1: Launch Backend Ecosystem Services
```bash
bun run serve
```
Launches all three backend microservices concurrently:
* **Simulated Services & Switchboard**: [http://localhost:4000](http://localhost:4000)
* **Intra Engine Monolith**: [http://localhost:3001](http://localhost:3001) (`/health`, `/observe`, `/events`)
* **Customer MCP Server**: [http://localhost:3002](http://localhost:3002) (`/tools`, `/tools/call`)

### Step 2: Launch the Web Portal
```bash
bun run dev
```
Starts Vite at [http://localhost:3000](http://localhost:3000).

### Step 3: Run the Autonomous CLI Demo
```bash
bun run demo
```
Executes the full 6-stage mutation injection, breakage detection, AST mapping, adapter synthesis, and golden workflow recovery in ~1 second.

---

## 4. Web Application Tour: Features & Ecosystem Navigation

### 4.1 Global Editorial Navigation Bar
The floating top navbar provides access across the platform:
1. **Home**: High-impact mission landing page anchored on `docs/lock.md`. Details the anatomy of silent failure (M1–M10), before vs with Intra comparisons, and verified telemetry benchmarks.
2. **Products Dropdown** (Opaque, high-contrast, zero background bleed):
   * **Agent Workbench**: Claude-style Ask & Plan interface powered by Sarvam AI 105B. Features rich MarkdownView formatting (headers, dark terminal code blocks, copy buttons) and **Interactive Ecosystem Actions** (Apply to SDK Proxy, Test in Switchboard, Inspect Blast Radius, Stress Test in Lab).
   * **Customer MCP Server**: Interactive runner for all 7 MCP tools with live JSON inspection.
   * **Client SDK & Proxy**: In-browser dynamic adapter simulator for `@intra/sdk`.
3. **Docs**: Complete developer manual, Safe-Handling Policy Matrix (§10), decoding of `LOCK.MD`, and algorithmic foundations.
4. **Pricing**: Web3 BridgeKey wallet connection, ERC-721 Soulbound subscription NFT minting on MST Blockchain Testnet (Chain ID 91562037), with exact on-chain pricing tiers:
   * **Free Tier**: 2 MSTC
   * **Starter Tier**: 3 MSTC
   * **Business Tier**: 5 MSTC
5. **Dashboard**: Unified API Observability Interface with sub-views:
   * **Upgrade & Drift Predictor**: Analyzes raw payloads for casing, unit, pagination, and enum risks.
   * **Drift Inspector**: Structural diffs, Levenshtein distance, confidence scoring, and adapter code.
   * **Pipeline Engine**: Live 6-stage closed loop telemetry stream.
   * **AST Blast Radius**: Codebase call graph mapping external changes to internal files.
   * **Safe Adapters & PRs**: Active Canary adapters and human-review migration PR proposals.
   * **Mutation Switchboard**: Live toggles for M1–M10 with instant reset.
   * **Downstream Resilience**: Shipwell application workflow simulator.
6. **Secret Lab Route (`/eval` or Flask icon)**:
   * **Autonomous Verification Laboratory**: Procedurally queries Sarvam AI 105B to generate completely randomized enterprise API schemas.
   * **High-Volume Stress Testing**: Executes 50–60 sample dynamic batches with live confidence scoring, predictability risk analysis, and WebCrypto SHA-256 tamper-evident ledger seals.

---

## 5. Live Self-Healing Walkthrough

Follow these 3 test cases to see Intra's autonomous recovery in action:

### Test Case 1: M1 Field Rename (`name` $\to$ `display_name`)
1. In the **Dashboard $\to$ Switchboard**, toggle **M1 (Field Rename)** to active.
2. Switch to **Downstream Resilience**:
   * Without Intra, `userProfile` workflow turns **RED** with error: `"expected field 'name' was missing"`.
   * With Intra, the synthesized adapter maps `display_name` back to `name`, restoring the workflow to **GREEN**.
3. In the **Agent Workbench**, ask: *"How does M1 field rename affect userProfile.ts?"*
   * The agent provides a structured remediation plan and an **[Apply to SDK Proxy]** button.

### Test Case 2: M3 Unit Shift (Dollars $\to$ Cents $\times 100$)
1. In **Dashboard $\to$ Switchboard**, toggle **M3 (Amount Unit Shift)**.
2. A payment provider converts `$25.00` to `2500` cents.
3. Observe the **Checkout Workflow**:
   * Raw payload triggers a 100× overcharge error.
   * Intra's **Quantile-Ratio Constancy Test** recognizes that all deciles scaled by $k = 100$ ($CV < 0.05$).
   * Synthesizes a `$\times 0.01$` multiplier adapter and restores checkout to `$25.00`.

### Test Case 3: M10 Enum Semantic Drift (Circuit Breaker Tripped)
1. In **Dashboard $\to$ Switchboard**, toggle **M10 (Enum Semantic Drift)**.
2. The user API begins returning suspended users with `status: "active"`.
3. In **AST Blast Radius**, notice `userAudit` is flagged as **CRITICAL**.
4. In **Safe Adapters**, observe that Intra **trips the circuit breaker**: automated repair is refused because confidence is uncertain, and a **Migration PR Proposal** is opened for human review.

---

## 6. Using Customer MCP Tools with AI Agents

Intra's MCP server exposes 7 standard tools:

| MCP Tool Name | Description | Parameters |
| :--- | :--- | :--- |
| `intra_list_dependencies` | Lists all observed external services and active endpoints | *None* |
| `intra_get_contract` | Returns the learned schema and behavioral fingerprint | `service`, `endpoint` |
| `intra_recent_changes` | Fetches recent structural and semantic drift | `service` (optional), `min_confidence` (optional) |
| `intra_impact` | Calculates blast radius on application code AST | `change_id` |
| `intra_propose_adapter` | Generates a compatibility adapter diff and test plan | `change_id` |
| `intra_apply_adapter` | Applies a human-reviewed adapter proposal (requires `confirm: true`) | `proposal_id`, `confirm` |
| `intra_health` | Checks dependency health and rate-limit headroom | *None* |

### Connecting to Claude Desktop / Cursor
Add to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "intra": {
      "command": "node",
      "args": ["D:/Workspace/Projects/Intra/mcpserver/dist/server.js"],
      "env": {
        "PORT": "3002",
        "ENGINE_URL": "http://localhost:3001"
      }
    }
  }
}
```

Or connect over HTTP SSE to the deployed server:
```
https://intra-vert.vercel.app/api/mcp
```

---

## 7. Integrating `@intra/sdk` in Your Applications

Protect your TypeScript microservices with zero configuration:

```typescript
import { IntraClient } from '@intra/sdk';

const intra = new IntraClient({
  engineUrl: 'https://intra-vert.vercel.app/api/engine',
  appName: 'my-service',
});

// Fetch data from third-party vendor
const rawResponse = await fetch('https://api.vendor.com/users').then(r => r.json());

// Transparently adapt response in-process (<1ms execution)
const safeUsers = intra.adaptResponse('/users', rawResponse);

// Consistently safe even if vendor renamed 'name' to 'display_name'
console.log(safeUsers[0].name);
```

---

## 8. Quality Verification & Test Suite

Verify all 35 monorepo quality gates and compilation checks:

```bash
# G1: Full monorepo typecheck (strict TypeScript)
pnpm turbo run typecheck

# G3: Unit test suites (all 13 packages)
pnpm turbo run test

# G4: Full build check
pnpm turbo run build
```

All 35 tasks pass green with zero errors.

---

## 9. Core Algorithmic Foundations: High-ROI Primitives

Intra avoids ungrounded heuristic guesses by powering its adaptation pipeline with mathematically grounded, peer-reviewed algorithms:

| Algorithm Primitive | Research Citation | Monorepo Location | Primary Responsibility |
|---|---|---|---|
| **$t$-Digest Streaming Quantiles** | Dunning & Ertl (2019) | `@intra/model` (`sketches.ts`) | Continuous, low-memory $P_{50}, P_{90}, P_{99}$ latency and numerical metric estimation without storing unbounded arrays. |
| **HyperLogLog (HLL) Cardinality** | Flajolet, Fusy, Gandouet, Meunier (2007) | `@intra/model` (`sketches.ts`) | $O(\log \log N)$ unique value counting to distinguish static enums from unbounded entity IDs with $\approx 1.04/\sqrt{m}$ standard error. |
| **Hungarian Bipartite Schema Matcher** | Kuhn (1955) / Munkres (1957) | `@intra/differ` (`hungarian.ts`) | $O(V^3)$ globally optimal bipartite matching between baseline and mutated JSON fields, avoiding greedy local minima. |
| **Quantile-Ratio Constancy Test** | Non-parametric Unit Shift (Intra PS) | `@intra/differ` (`unitShift.ts`) | Multiplier detection ($k \in \{0.01, 10, 100, 1000\}$) across decile distributions with Coefficient of Variation ($CV < 0.05$). |
| **FlashFill Typed DSL Synthesizer** | Gulwani et al. (CACM 2012) | `@intra/adapter` (`pbe.ts`) | Program-by-Example (PBE) synthesizer searching depth-2 Occam shortest programs with 80/20 train/test verification for string and data transforms. |
| **Wald's SPRT Canary Controller** | Wald (1945), Sequential Analysis | `@intra/validator` (`sprt.ts`) | Dynamic early-stopping sequential probability ratio test deciding `promote`, `rollback`, or `continue` with rigorous Type I ($\alpha$) and Type II ($\beta$) error bounds. |

### How These Algorithms Run in the Application
1. **Streaming Observation Intake**: Traffic entering `ObservationCollector` feeds the `TDigest` sketch and `HyperLogLog` registers inside `inferContract()`, capturing empirical latency and cardinality fingerprints.
2. **Schema Drift Detection**: When an endpoint payload mutates, `differ` runs `hungarianMatching` against the field distance matrix (Levenshtein + type compatibility + value distributions) to identify true field renames. If numerical values shift, `detectUnitShift` evaluates the decile ratio vector.
3. **Adapter Synthesis**: If string transformations are detected (e.g. format shift, casing change, prefixing), `synthesizeProgram` searches the typed DSL space for the minimal Occam program that passes cross-validation.
4. **Canary Validation**: Synthesized adapters are deployed into canary routing, where `WaldSPRT` tracks incoming request success/error likelihood ratios, triggering zero-touch rollback if anomaly thresholds are crossed.
