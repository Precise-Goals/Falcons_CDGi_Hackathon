# Intra MCP Server: Setup & Deployed Client Configuration

Intra provides a dedicated **Customer Model Context Protocol (MCP) Server** compliant with the `@modelcontextprotocol/sdk` standard specification.

---

## 1. Deployed MCP Architecture

When deployed on Vercel:
- **Base Web URL**: `https://intra-vert.vercel.app`
- **Customer MCP Server**: `https://intra-vert.vercel.app/api/mcp`
- **Engine Core API**: `https://intra-vert.vercel.app/api/engine`
- **Simulation Services**: `https://intra-vert.vercel.app/api/sim`
- **Health Check**: `GET /healthz` (returns `{ status: "healthy", transport: "http/streamable" }`)
- **Tool Catalog**: `GET /tools`
- **Tool Invocation**: `POST /tools/call`

---

## 2. Using the Deployed MCP Server with Claude Desktop

Claude Desktop connects to MCP servers over standard I/O (`stdio`). To connect Claude Desktop to your **deployed** Intra MCP server, use the included bridge script: `scripts/mcp-remote-client.mjs`.

### Step 1: Open Claude Desktop Configuration
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

### Step 2: Add Intra MCP Server Entry

```json
{
  "mcpServers": {
    "intra": {
      "command": "node",
      "args": [
        "D:/Workspace/Projects/Intra/scripts/mcp-remote-client.mjs",
        "https://intra-vert.vercel.app/api/mcp"
      ],
      "env": {
        "INTRA_API_KEY": "your-optional-api-key"
      }
    }
  }
}
```

> **For Local Testing:** Replace the URL argument with `http://localhost:3002`.

### Step 3: Restart Claude Desktop
Once restarted, Claude Desktop will automatically discover all 7 Intra tools:
1. `intra_list_dependencies`: Lists all external vendor endpoints actively observed.
2. `intra_get_contract`: Fetches learned behavioral schema and fingerprint.
3. `intra_recent_changes`: Fetches recent structural and semantic drift with confidence scores.
4. `intra_impact`: Computes workflow blast radius and severity.
5. `intra_apply_adapter`: Applies synthesized runtime adapter with rollback safety.
6. `intra_health`: Returns engine connectivity and rate limit headroom.
7. `intra_verify_proof`: Cryptographically verifies SHA-256 ledger integrity on MST Blockchain.

---

## 3. Direct HTTP Tool Calling (cURL / Fetch / REST)

You can call the deployed MCP server directly from any application:

### List Available Tools
```bash
curl -X GET https://intra-vert.vercel.app/api/mcp/tools
```

### Call a Tool (e.g., `intra_recent_changes`)
```bash
curl -X POST https://intra-vert.vercel.app/api/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "intra_recent_changes",
    "params": {
      "min_confidence": 0.85
    }
  }'
```

### Apply an Adapter
```bash
curl -X POST https://intra-vert.vercel.app/api/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "intra_apply_adapter",
    "params": {
      "proposal_id": "prop_1234",
      "confirm": true
    }
  }'
```

---

## 4. MCP Inspector Interactive Debugger

Test and debug your deployed or local MCP server interactively:

```bash
npx @modelcontextprotocol/inspector node scripts/mcp-remote-client.mjs https://intra-vert.vercel.app/api/mcp
```
