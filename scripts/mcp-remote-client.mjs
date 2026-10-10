#!/usr/bin/env node
/**
 * Intra MCP Remote Stdio Client Proxy
 * Connects Claude Desktop, Cursor, or any stdio MCP host to a deployed or local Intra MCP server.
 *
 * Usage:
 *   node scripts/mcp-remote-client.mjs [MCP_SERVER_URL] [API_KEY]
 *
 * Examples:
 *   node scripts/mcp-remote-client.mjs https://intra-vert.vercel.app/api/mcp
 *   node scripts/mcp-remote-client.mjs http://localhost:3002
 */

import readline from 'node:readline';

const targetUrl = process.argv[2] || process.env.INTRA_MCP_URL || 'https://intra-vert.vercel.app/api/mcp';
const apiKey = process.argv[3] || process.env.INTRA_API_KEY || '';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

async function queryRemoteMcp(endpoint, payload, method = 'POST') {
  const url = `${targetUrl.replace(/\/$/, '')}${endpoint}`;
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers['x-api-key'] = apiKey;

  const res = await fetch(url, {
    method,
    headers,
    body: method === 'POST' ? JSON.stringify(payload) : undefined,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => res.statusText);
    throw new Error(`MCP remote HTTP error ${res.status}: ${errorText}`);
  }
  return res.json();
}

function sendResponse(id, result, error = null) {
  const msg = {
    jsonrpc: '2.0',
    id,
    ...(error ? { error: { code: -32603, message: error.message || String(error) } } : { result }),
  };
  process.stdout.write(JSON.stringify(msg) + '\n');
}

rl.on('line', async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  let request;
  try {
    request = JSON.parse(trimmed);
  } catch {
    return;
  }

  const { id, method, params } = request;

  try {
    if (method === 'initialize') {
      sendResponse(id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'intra-mcp-remote-bridge', version: '1.0.0' },
      });
    } else if (method === 'notifications/initialized') {
      // Notification, no response required
    } else if (method === 'tools/list') {
      const data = await queryRemoteMcp('/tools', null, 'GET');
      const tools = (data.tools || []).map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: {
          type: 'object',
          properties: t.parameters || {},
        },
      }));
      sendResponse(id, { tools });
    } else if (method === 'tools/call') {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};
      const result = await queryRemoteMcp('/tools/call', {
        tool: toolName,
        params: toolArgs,
      }, 'POST');
      sendResponse(id, {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      });
    } else if (method === 'ping') {
      sendResponse(id, {});
    } else {
      sendResponse(id, null, { message: `Method not implemented: ${method}` });
    }
  } catch (err) {
    sendResponse(id, null, err);
  }
});
