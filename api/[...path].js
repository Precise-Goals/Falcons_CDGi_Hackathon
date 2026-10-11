function sendJson(res, statusCode, data) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, api-subscription-key');
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(data);
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function getBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body); } catch { return {}; }
}

function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, api-subscription-key');
    res.statusCode = 200;
    return res.end();
  }

  const url = req.url || '';

  if (url.includes('/sim/switchboard')) {
    return sendJson(res, 200, {
      mutations: [
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
      ],
    });
  }

  if (url.includes('/engine/health')) {
    return sendJson(res, 200, {
      status: 'ok',
      version: '0.1.0',
      uptime: Math.floor(process.uptime() || 3600),
      rateLimitHeadroom: 98,
      observedServices: 5,
      activeAdapters: 2,
    });
  }

  if (url.includes('/mcp/tools') && !url.includes('/call')) {
    return sendJson(res, 200, {
      tools: [
        { name: 'intra_list_dependencies', description: 'Lists all external services and endpoints actively observed by Intra' },
        { name: 'intra_get_contract', description: 'Fetches the learned schema and behavioural fingerprint for a service endpoint' },
        { name: 'intra_recent_changes', description: 'Fetches recent structural and semantic drift detected by Intra' },
        { name: 'intra_impact', description: 'Calculates the blast radius of a change on dependent application workflows' },
        { name: 'intra_propose_adapter', description: 'Generates a compatibility adapter diff and test plan for an unreviewed change' },
        { name: 'intra_apply_adapter', description: 'Applies an adapter proposal into canary routing after human confirmation' },
        { name: 'intra_health', description: 'Checks health status, observed error rates, and rate limit headroom across all dependencies' },
      ],
    });
  }

  if (url.includes('/mcp/healthz')) {
    return sendJson(res, 200, { status: 'healthy', transport: 'http/streamable', timestamp: new Date().toISOString() });
  }

  return sendJson(res, 200, {
    status: 'ok',
    endpoint: url,
    timestamp: new Date().toISOString(),
  });
}

module.exports = handler;
module.exports.default = handler;
