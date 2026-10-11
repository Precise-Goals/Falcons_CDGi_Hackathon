const http = require('http');
const url = require('url');

// In-memory Switchboard state for M1-M10 mutations
const switchboardState = [
  { id: 'M1', name: 'Field Rename', service: 'users', active: false, description: 'GET /users field name -> display_name' },
  { id: 'M2', name: 'Name Format Shift', service: 'users', active: false, description: 'name now "Last, First" instead of "First Last"' },
  { id: 'M3', name: 'Amount Unit Shift', service: 'payments', active: false, description: 'amount from dollars (float) to cents (int)' },
  { id: 'M4', name: 'Default Currency Flip', service: 'payments', active: false, description: 'default currency flips USD -> EUR when omitted' },
  { id: 'M5', name: 'Pagination Offset to Cursor', service: 'search', active: false, description: 'pagination offset -> opaque cursor' },
  { id: 'M6', name: 'Silent Result Truncation', service: 'search', active: false, description: 'silently caps page size 100 -> 20' },
  { id: 'M7', name: 'Webhook Event Flattening', service: 'notifications', active: false, description: 'payload nests event.type -> type' },
  { id: 'M8', name: 'Rate Limit 429 Throttle', service: 'payments', active: false, description: '429 begins at 5 rps with new Retry-After shape' },
  { id: 'M9', name: 'Tool Signature Argument Drift', service: 'mcp-tool', active: false, description: 'tool arg query -> q, plus new required limit' },
  { id: 'M10', name: 'Enum Semantic Drift', service: 'users', active: false, description: 'status enum value active includes suspended users' },
];

const MCP_TOOLS = [
  { name: 'intra_list_dependencies', description: 'Lists all external services and endpoints actively observed by Intra' },
  { name: 'intra_get_contract', description: 'Fetches the learned schema and behavioural fingerprint for a service endpoint', parameters: { service: 'string', endpoint: 'string' } },
  { name: 'intra_recent_changes', description: 'Fetches recent structural and semantic drift detected by Intra', parameters: { service: 'optional string', min_confidence: 'optional number' } },
  { name: 'intra_impact', description: 'Calculates the blast radius of a change on dependent application workflows', parameters: { change_id: 'string' } },
  { name: 'intra_propose_adapter', description: 'Generates a compatibility adapter diff and test plan for an unreviewed change', parameters: { change_id: 'string' } },
  { name: 'intra_apply_adapter', description: 'Applies an adapter proposal into canary routing after human confirmation', parameters: { proposal_id: 'string', confirm: 'boolean' } },
  { name: 'intra_health', description: 'Checks health status, observed error rates, and rate limit headroom across all dependencies' },
];

function sendJson(res, statusCode, data) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, api-subscription-key');
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data, null, 2));
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      if (!body) return resolve({});
      try { resolve(JSON.parse(body)); } catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

async function requestHandler(req, res) {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, api-subscription-key');
    res.statusCode = 200;
    return res.end();
  }

  const parsedUrl = new URL(req.url, 'http://localhost');
  const rawPath = parsedUrl.pathname || '/';
  // Normalize path removing trailing slash and ensuring clean path matching
  const p = rawPath.replace(/\/$/, '') || '/';
  const body = req.method === 'POST' ? await parseBody(req) : {};

  // 1. Root API Directory Index
  if (p === '/api' || p === '' || p === '/') {
    return sendJson(res, 200, {
      name: 'Intra Autonomous Resilience Engine API',
      status: 'active',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
      routes: {
        engine: '/api/engine',
        engineHealth: '/api/engine/health',
        engineObserve: '/api/engine/observe',
        mcp: '/api/mcp',
        mcpTools: '/api/mcp/tools',
        mcpHealthz: '/api/mcp/healthz',
        sim: '/api/sim',
        simSwitchboard: '/api/sim/switchboard',
        simUsers: '/api/sim/users',
        simPaymentsCharge: '/api/sim/payments/charge',
        simSearch: '/api/sim/search',
      },
    });
  }

  // 2. Core Engine Routes
  if (p === '/api/engine' || p === '/engine' || p === '/api/engine/health' || p === '/engine/health') {
    return sendJson(res, 200, {
      status: 'ok',
      service: 'Intra Closed-Loop Adaptation Engine',
      version: '0.1.0',
      uptime: Math.floor(process.uptime() || 3600),
      rateLimitHeadroom: 98,
      observedServices: 5,
      activeAdapters: 2,
      baselines: ['users', 'payments', 'search', 'notifications', 'mcp-tool'],
      timestamp: new Date().toISOString(),
    });
  }

  if (p === '/api/engine/observe' || p === '/engine/observe') {
    const observationId = `obs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return sendJson(res, 201, {
      id: observationId,
      service: body.service || 'users',
      endpoint: body.endpoint || '/users',
      status: body.status || 200,
      recordedAt: new Date().toISOString(),
      ingested: true,
    });
  }

  // 3. Customer MCP Server Routes
  if (p === '/api/mcp' || p === '/mcp') {
    return sendJson(res, 200, {
      name: 'Intra Customer MCP Server',
      status: 'healthy',
      transport: 'http/streamable',
      protocolVersion: '2024-11-05',
      toolCount: MCP_TOOLS.length,
      tools: MCP_TOOLS,
      endpoints: {
        tools: '/api/mcp/tools',
        toolsCall: '/api/mcp/tools/call',
        healthz: '/api/mcp/healthz',
      },
      timestamp: new Date().toISOString(),
    });
  }

  if (p === '/api/mcp/tools' || p === '/mcp/tools') {
    return sendJson(res, 200, { tools: MCP_TOOLS });
  }

  if (p === '/api/mcp/healthz' || p === '/mcp/healthz') {
    return sendJson(res, 200, {
      status: 'healthy',
      transport: 'http/streamable',
      timestamp: new Date().toISOString(),
    });
  }

  if (p === '/api/mcp/tools/call' || p === '/mcp/tools/call') {
    const tool = body.tool;
    const params = body.params || {};

    if (tool === 'intra_list_dependencies') {
      return sendJson(res, 200, {
        services: [
          { service: 'users', endpoints: ['/users'] },
          { service: 'payments', endpoints: ['/payments/charge'] },
          { service: 'search', endpoints: ['/search'] },
          { service: 'notifications', endpoints: ['/notifications/webhook'] },
          { service: 'mcp-tool', endpoints: ['/mcp-tool/execute'] },
        ],
      });
    }

    if (tool === 'intra_get_contract') {
      return sendJson(res, 200, {
        service: params.service || 'users',
        endpoint: params.endpoint || '/users',
        schema: {
          types: { id: 'string', name: 'string', status: 'string' },
          optionality: [],
          enums: { status: ['active', 'suspended'] },
        },
        fieldStats: { name: { cardinality: 'low' }, status: { cardinality: 'enum' } },
        paginationStyle: 'none',
      });
    }

    if (tool === 'intra_recent_changes') {
      return sendJson(res, 200, {
        changes: [
          { id: 'chg_1', service: 'users', endpoint: '/users', kind: 'rename', confidence: 0.95, verdict: 'equivalent' },
          { id: 'chg_2', service: 'payments', endpoint: '/payments/charge', kind: 'unit_shift', confidence: 0.98, verdict: 'equivalent' },
        ],
      });
    }

    if (tool === 'intra_impact') {
      return sendJson(res, 200, {
        changeId: params.change_id || 'chg_1',
        affectedWorkflows: ['userProfile', 'checkout'],
        severity: 'high',
        affectedFiles: ['apps/demo-app/src/index.ts'],
      });
    }

    if (tool === 'intra_propose_adapter') {
      return sendJson(res, 200, {
        proposalId: 'prop_01',
        changeId: params.change_id || 'chg_1',
        strategy: 'rename',
        status: 'pending',
        rollbackHandle: 'rollback_prop_01_auto',
      });
    }

    if (tool === 'intra_apply_adapter') {
      if (!params.confirm) {
        return sendJson(res, 400, { error: 'Confirmation required: pass confirm=true to apply adapter' });
      }
      return sendJson(res, 200, { success: true, applied: true, proposalId: params.proposal_id });
    }

    if (tool === 'intra_health') {
      return sendJson(res, 200, { status: 'healthy', overallErrorRate: 0.001, rateLimitHeadroom: 98 });
    }

    return sendJson(res, 404, { error: `Tool ${tool} not recognized` });
  }

  // 4. Simulated Microservices & Mutation Switchboard
  if (p === '/api/sim' || p === '/sim') {
    return sendJson(res, 200, {
      name: 'Intra Simulated External Microservices',
      status: 'active',
      services: ['users', 'payments', 'search', 'notifications', 'mcp-tool'],
      switchboard: {
        activeMutationsCount: switchboardState.filter((m) => m.active).length,
        totalMutations: switchboardState.length,
        endpoint: '/api/sim/switchboard',
      },
      timestamp: new Date().toISOString(),
    });
  }

  if (p === '/api/sim/switchboard' || p === '/sim/switchboard') {
    if (req.method === 'POST') {
      const { mutationId, active } = body;
      if (mutationId) {
        const item = switchboardState.find((m) => m.id === mutationId);
        if (item) {
          item.active = !!active;
          return sendJson(res, 200, { success: true, mutation: item });
        }
      }
    }
    return sendJson(res, 200, { mutations: switchboardState });
  }

  if (p === '/api/sim/switchboard/toggle' || p === '/sim/switchboard/toggle') {
    const { mutationId, active } = body;
    const item = switchboardState.find((m) => m.id === mutationId);
    if (!item) return sendJson(res, 404, { error: `Mutation ${mutationId} not found` });
    item.active = active !== undefined ? !!active : !item.active;
    return sendJson(res, 200, { success: true, mutation: item });
  }

  if (p === '/api/sim/switchboard/reset' || p === '/sim/switchboard/reset') {
    switchboardState.forEach((m) => { m.active = false; });
    return sendJson(res, 200, { success: true, mutations: switchboardState });
  }

  if (p === '/api/sim/users' || p === '/sim/users') {
    const m1 = switchboardState.find((m) => m.id === 'M1')?.active;
    const m2 = switchboardState.find((m) => m.id === 'M2')?.active;
    const m10 = switchboardState.find((m) => m.id === 'M10')?.active;

    let users = [
      { id: 'usr_1', name: 'Alice Walker', status: 'active' },
      { id: 'usr_2', name: 'Bob Smith', status: 'active' },
      { id: 'usr_3', name: 'Charlie Brown', status: m10 ? 'active' : 'suspended' },
    ];

    if (m2) {
      users = users.map((u) => {
        const parts = u.name.split(' ');
        return { ...u, name: `${parts[1]}, ${parts[0]}` };
      });
    }

    if (m1) {
      users = users.map((u) => {
        const { name, ...rest } = u;
        return { ...rest, display_name: name };
      });
    }

    return sendJson(res, 200, { users });
  }

  if (p === '/api/sim/payments/charge' || p === '/sim/payments/charge') {
    const m3 = switchboardState.find((m) => m.id === 'M3')?.active;
    const m4 = switchboardState.find((m) => m.id === 'M4')?.active;
    const m8 = switchboardState.find((m) => m.id === 'M8')?.active;

    if (m8) {
      res.setHeader('Retry-After', '60');
      return sendJson(res, 429, { error: 'Rate limit exceeded: 5 requests per second' });
    }

    let amount = body.amount !== undefined ? body.amount : 25.0;
    if (m3 && typeof amount === 'number') {
      amount = Math.round(amount * 100);
    }

    const currency = body.currency || (m4 ? 'EUR' : 'USD');

    return sendJson(res, 200, {
      chargeId: `chg_${Date.now()}`,
      amount,
      currency,
      status: 'succeeded',
    });
  }

  if (p === '/api/sim/search' || p === '/sim/search') {
    const m5 = switchboardState.find((m) => m.id === 'M5')?.active;
    const m6 = switchboardState.find((m) => m.id === 'M6')?.active;
    const query = parsedUrl.query || {};

    if (m5 && query.offset !== undefined) {
      return sendJson(res, 400, { error: 'Offset pagination deprecated. Use nextCursor parameter.' });
    }

    const items = Array.from({ length: m6 ? 20 : 100 }, (_, i) => ({
      id: `item_${i + 1}`,
      title: `Catalog Item #${i + 1}`,
    }));

    return sendJson(res, 200, {
      items,
      count: items.length,
      nextCursor: m5 ? Buffer.from('page_2').toString('base64') : undefined,
    });
  }

  // Catch-all for any other /api/* subpath
  return sendJson(res, 200, {
    status: 'ok',
    endpoint: p,
    timestamp: new Date().toISOString(),
  });
}

// Support both standalone server and serverless export
const server = http.createServer(requestHandler);

if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[INTRA API SERVER] Listening on port ${PORT}`);
  });
}

module.exports = requestHandler;
module.exports.default = requestHandler;
