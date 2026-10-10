---
name: intra-demo-runner
description: >-
  Use this skill to start, demonstrate, and verify the live interactive Intra demo with simulated services, switchboard mutations, and the Shipwell application.
---

# Intra Demonstration Runner Skill

This skill explains how to orchestrate the end-to-end interactive demonstration.

## Running the Demonstration

### Option 1: Standalone CLI Demo
```powershell
node scripts/demo.mjs
```
Runs the automated script that spawns:
1. Simulated services (Users, Payments, Search, Notifications, MCP) at `http://127.0.0.1:4000`
2. Intra Monolith Engine at `http://127.0.0.1:3001`
3. Customer MCP Server at `http://127.0.0.1:3002`
4. Shipwell logistics app executing baseline and adapted workflows.

### Option 2: Full Interactive Web Dashboard
```powershell
# Terminal 1: Engine Monolith
pnpm --filter @intra/engine start

# Terminal 2: Simulated Services Switchboard
node -e "import('@intra/sim-services').then(({ Switchboard, buildSimServicesApp }) => buildSimServicesApp(new Switchboard()).listen({ port: 4000 }))"

# Terminal 3: Web Dashboard UI
pnpm --filter @intra/web dev
```
Open `http://localhost:3000` to interact with the Washi & Crimson dashboard.
Toggle mutations M1 through M10 to see real-time drift detection and adapter generation!
