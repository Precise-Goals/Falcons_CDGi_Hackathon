# Intra: Comprehensive Application & Ecosystem Guide

Welcome to **Intra**, the autonomous runtime platform designed to help software survive undocumented changes, defaults, and semantic drift in external services (APIs, SDKs, MCP servers, webhooks).

This guide walks you through starting, operating, testing, and integrating the entire Intra ecosystem.

---

## 1. System Architecture at a Glance

Intra is structured as a Turborepo monorepo with dedicated components:

```
Intra/
├── apps/
│   ├── web/          # React 18 + Vite dashboard (Washi Cream, Crimson & Black theme)
│   ├── engine/       # Fastify monolith hosting the 6-stage adaptation loop
│   └── demo-app/     # "Shipwell" e-commerce app demonstrating red -> green recovery
├── mcpserver/        # Customer MCP server for AI coding agents (Render / Streamable HTTP)
├── packages/
│   ├── shared/       # Zod schemas & shared TypeScript domain contracts
│   ├── observer/     # Traffic capture & PII redactor
│   ├── model/        # Behavioral contract & distribution inferrer
│   ├── differ/       # Semantic & structural drift classifier with confidence scoring
│   ├── impact/       # AST dependency scanner & blast radius graph
│   ├── adapter/      # Safe-handling policy engine & Canary runtime synthesizer
│   ├── validator/    # Golden workflow replay & semantic equivalence gate
│   ├── sim-services/ # 5 simulated external services with mutation switchboard (M1-M10)
│   └── sdk/          # Lightweight client SDK wrapper
├── scripts/
│   ├── demo.mjs      # Autonomous CLI demonstration runner
│   └── serve.mjs     # Backend ecosystem service launcher
├── HARNESS.md        # Monorepo specifications & engineering contracts
└── guide.md          # This guide
```

---

## 2. Quickstart: One-Command Execution with Bun

Intra is fully optimized for **Bun** (`v1.3.14+`) with sub-second execution:

### 2.1 Start Only the Web Dashboard (Recommended First Step)
To launch the complete interactive frontend dashboard:
```bash
bun run dev
```
- **URL**: [http://localhost:3000](http://localhost:3000)
- **Startup Time**: ~300ms
- **Self-Contained**: Runs without requiring other backend services to be up; houses the entire interactive simulation and problem-statement demonstration.

### 2.2 Start All Backend Application Services
To launch the backend services daemon (Simulated Services, Engine, and MCP Server):
```bash
bun run serve
```
- **Sim Services & Switchboard**: [http://localhost:4000](http://localhost:4000)
- **Intra Engine Monolith**: [http://localhost:3001](http://localhost:3001) (`/health`, `/services`, `/changes`, `/events`)
- **Customer MCP Server**: [http://localhost:3002](http://localhost:3002) (`/healthz`, `/tools`, `/tools/call`)

### 2.3 Run the Full Autonomous Demonstration
To execute the automated end-to-end acceptance demo in terminal:
```bash
bun run demo
```
- Executes the 6-stage live mutation injection, red breakage, auto-detection, canary synthesis, and green recovery in ~1 second.

---

## 3. Web Dashboard Tour: Satisfying the Entire Problem Statement

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

The UI is built with:
- **Three-Color Tone Palette**: Crimson Red (`#C8102E`), Cream (`#FAF7F2`), Black (`#0A0A0A`).
- **Typography**: `Poppins` (standard body/UI), `Montserrat` (headings/display), `JetBrains Mono` (code).
- **React Bits Capsule Navbar**: Uncluttered floating pill dock anchored at the top of the viewport.
- **Antigravity-Style Footer**: 4-column system architecture with giant `Intra.` headline and red gradient text clipping.

### 3.1 Navigation Tabs in the React Bits Capsule Navbar

1. **Home (`Home` icon)**:
   - High-impact mission landing page.
   - Core value pillars: **Behavioral Ground Truth**, **Safe-Handling Policy Matrix**, and **Mathematical Golden Replay**.
   - Quick jump links to every section of the platform.

2. **Pipeline (`Sparkles` icon)**:
   - Visual breakdown of the **6-Stage Autonomous Adaptation Loop**:
     1. `Traffic Observer` — Capture & PII scrub.
     2. `Behavioral Modeler` — Infer ground truth contracts.
     3. `Semantic Differ` — Confidence scoring (0.0-1.0).
     4. `AST Blast Radius` — Codebase impact graph.
     5. `Safe-Handling Policy` — Canary synthesis vs Migration PR.
     6. `Golden Replayer` — Mathematical equivalence check.
   - **Downstream Application Health** card showing live Shipwell status with **Auto-Adapter Shield** toggle.

3. **Drift Feed (`Activity` icon)**:
   - Live stream of detected mutations.
   - Visual **Before vs After Payload Structural Diff**.
   - Confidence score calculation (Levenshtein distance, sample overlap).
   - Synthesized runtime TypeScript adapter code viewer.

4. **Blast Radius (`Layers` icon)**:
   - AST dependency graph tracing external mutations to internal files (`userProfile.ts`, `checkout.ts`, `audit.ts`).
   - Severity ratings: `LOW`, `MEDIUM`, `CRITICAL`.

5. **Safe Adapters (`Zap` icon)**:
   - Inspect active Canary adapters with atomic rollback handles.
   - **Pending Migration Proposals**: Human-in-the-loop review for lossy or breaking changes.
   - Interactive **"Approve & Apply Proposal"** button.

6. **Switchboard (`Sliders` icon)**:
   - Interactive mutation toggles for all 10 deliberate mutations (**M1 through M10**).
   - "Reset All to Baseline" button.

7. **MCP Server (`Terminal` icon)**:
   - Interactive playground for the 7 Customer MCP tools.
   - Live formatted JSON execution output.

---

## 4. How to Test & Demonstrate Live Self-Healing

Follow this 5-step test script to see Intra's autonomous recovery in action:

### Test Case 1: M1 Field Rename (`name` -> `display_name`)
1. Click the **Switchboard** tab in the navbar.
2. Toggle **M1 (Field Rename)** to `MUTATION ACTIVE`.
3. Switch to the **Pipeline** tab:
   - Without the shield, **UserProfile Workflow** turns **RED** with error: `"expected field 'name' was missing"`.
   - With the shield, Intra's synthesized adapter (`adp_users_rename_v1`) intercepts the response, maps `display_name` back to `name`, and restores the workflow to **GREEN**.
4. Switch to the **Drift Feed** tab to inspect the exact Levenshtein score (95% confidence) and generated adapter code.

### Test Case 2: M3 Unit Shift (Dollars -> Cents x100)
1. In the **Switchboard** tab, toggle **M3 (Amount Unit Shift)**.
2. An upstream payment provider changes `$25.00` to `2500` cents.
3. Observe the **Checkout Workflow**:
   - Raw response causes a 100x overcharge error.
   - Intra detects the integer unit shift, generates a `x0.01` multiplier adapter, replays golden tests, and recovers checkout to `$25.00` dollars.

### Test Case 3: M10 Enum Semantic Drift (Circuit Breaker Tripped)
1. In the **Switchboard** tab, toggle **M10 (Enum Semantic Drift)**.
2. Upstream user API now returns suspended users (Charlie Brown) with `status: "active"`.
3. In the **Blast Radius** tab, notice `userAudit` is flagged as **CRITICAL**.
4. In the **Safe Adapters** tab, observe that Intra **trips the circuit breaker**: automated adapter is prohibited to prevent security privilege escalation, and a **Migration PR Proposal** is opened for human engineering review.

---

## 5. Using the Customer MCP Server with AI Agents

Intra includes an MCP server conforming to the Model Context Protocol specification (`mcpserver/`), deployable on Render with a `/healthz` route.

### 5.1 The 7 MCP Tools

| MCP Tool Name | Description | Parameters |
| :--- | :--- | :--- |
| `intra_list_dependencies` | Lists all observed external services and active endpoints | *None* |
| `intra_get_contract` | Returns the learned schema and behavioral fingerprint | `service`, `endpoint` |
| `intra_recent_changes` | Fetches recent structural and semantic drift | `service` (optional), `min_confidence` (optional) |
| `intra_impact` | Calculates blast radius on application code AST | `change_id` |
| `intra_propose_adapter` | Generates a compatibility adapter diff and test plan | `change_id` |
| `intra_apply_adapter` | Applies a human-reviewed adapter proposal | `proposal_id`, `confirm: true` |
| `intra_health` | Checks dependency health and rate-limit headroom | *None* |

### 5.2 Connecting to Claude Desktop / Cursor
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

---

## 6. Integrating `@intra/sdk` in Client Applications

To protect your own applications from upstream API breaking changes:

### 6.1 Initialize the Client
```typescript
import { IntraClient } from '@intra/sdk';

const intra = new IntraClient({
  engineUrl: 'http://localhost:3001',
  appName: 'my-service',
});
```

### 6.2 Transparently Adapt API Responses
```typescript
// Fetch data from third-party vendor
const rawResponse = await fetch('https://api.vendor.com/users').then(r => r.json());

// Pass through Intra SDK adapter (transparent pass-through if no drift, auto-adapted if drifted)
const adaptedUsers = intra.adaptResponse('/users', rawResponse);

// Consistently safe! Even if vendor renamed 'name' to 'display_name'
console.log(adaptedUsers[0].name);
```

---

## 7. Testing & Quality Gates

Intra enforces strict CI/CD quality gates across all 13 monorepo packages:

```bash
# G1: Full monorepo typecheck (strict TypeScript)
pnpm -w typecheck

# G2: Linting
pnpm -w lint

# G3: Unit test suites (all packages)
pnpm -w test

# G9: E2E Demonstration Acceptance Test
pnpm exec vitest run tests/e2e/demo.spec.ts
```

All 22 Turbo tasks are cached and verified 100% green.

---

## 8. Summary

- **Run the Website Monolith**: `bun run dev` (starts on [http://localhost:3000](http://localhost:3000))
- **Run the Ecosystem Backend**: `bun run serve` (starts ports 4000, 3001, 3002)
- **Run the Demo Script**: `bun run demo` (verifies self-healing in ~1s)
- **Documentation**: Refer to [`docs/ps.md`](docs/ps.md) for technical problem specs and [`docs/simpleps.md`](docs/simpleps.md) for plain-language problem stories.
