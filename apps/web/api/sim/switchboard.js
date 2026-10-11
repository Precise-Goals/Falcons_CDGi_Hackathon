function sendJson(res, statusCode, data) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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

function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, api-subscription-key');
    res.statusCode = 200;
    return res.end();
  }

  if (req.method === 'POST') {
    const body = getBody(req);
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

module.exports = handler;
module.exports.default = handler;
