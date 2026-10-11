# @intra/mcpserver

Model Context Protocol (MCP) Server for Autonomous API Drift Management.

## Overview

`@intra/mcpserver` exposes standardized tools to AI coding agents (Claude Desktop, Cursor, Antigravity, Copilot) via JSON-RPC 2.0 and HTTP transport. It enables autonomous systems to inspect external API contracts, detect breaking drifts, simulate blast radius, and safely propose zero-downtime adapters.

```
       AI Coding Agent (Claude, Cursor, AGY)
                         │
                         ▼  (MCP Tools / JSON-RPC 2.0)
             ┌─────────────────────────┐
             │   Intra MCP Server      │
             └───────────┬─────────────┘
                         ▼
        ┌────────────────────────────────┐
        │  Intra Central Engine / Proxy  │
        └────────────────────────────────┘
```

## Available MCP Tools

| Tool Name | Parameters | Description |
| :--- | :--- | :--- |
| `intra_list_dependencies` | `{}` | Lists all monitored external service endpoints. |
| `intra_get_contract` | `{ service, endpoint }` | Fetches learned contract schema and invariant fingerprint. |
| `intra_recent_changes` | `{ service?, min_confidence? }` | Queries recently discovered structural and semantic drifts. |
| `intra_impact` | `{ change_id }` | Computes downstream workflow blast radius and severity. |
| `intra_propose_adapter` | `{ change_id }` | Generates verified adapter source diff and test plan. |
| `intra_apply_adapter` | `{ proposal_id, confirm: true }` | Applies adapter proposal to live client proxy. |
| `intra_health` | `{}` | Evaluates external dependency uptime and rate limits. |
| `intra_ping` | `{}` | Verifies protocol transport connectivity and latency. |

## Error Protocol

Compliant with standard JSON-RPC 2.0 specification:
- `-32700`: Parse error
- `-32600`: Invalid Request
- `-32601`: Method / Tool not found
- `-32602`: Invalid params (missing required arguments)
- `-32603`: Internal server error
