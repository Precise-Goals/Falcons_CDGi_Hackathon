export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, api-subscription-key');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const url = req.url || '';

  // 1. Sim Switchboard endpoints
  if (url.includes('/sim/switchboard/toggle')) {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }
    return res.status(200).json({ success: true, mutation: { id: body?.mutationId || 'M1', active: !!body?.active } });
  }

  if (url.includes('/sim/switchboard/reset')) {
    return res.status(200).json({ success: true, message: 'All mutations reset to baseline' });
  }

  if (url.includes('/sim/switchboard')) {
    return res.status(200).json({
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

  // 2. Sim Services
  if (url.includes('/sim/users') || url.includes('/users')) {
    return res.status(200).json([
      { id: 'usr_1', name: 'Alice Walker', email: 'alice@example.com', status: 'active' },
      { id: 'usr_2', name: 'Bob Stone', email: 'bob@example.com', status: 'active' },
      { id: 'usr_3', name: 'Charlie Brown', email: 'charlie@example.com', status: 'suspended' },
    ]);
  }

  // 3. Engine endpoints
  if (url.includes('/engine/health') || url.includes('/health')) {
    return res.status(200).json({
      status: 'ok',
      version: '0.1.0',
      uptime: Math.floor(process.uptime() || 3600),
      rateLimitHeadroom: 98,
      observedServices: 5,
      activeAdapters: 2,
    });
  }

  if (url.includes('/engine/observe')) {
    return res.status(201).json({
      id: `obs_${Date.now()}`,
      ingested: true,
      timestamp: new Date().toISOString(),
    });
  }

  // 4. MCP endpoints
  if (url.includes('/mcp/tools') && !url.includes('/call')) {
    return res.status(200).json({
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
    return res.status(200).json({ status: 'healthy', transport: 'http/streamable', timestamp: new Date().toISOString() });
  }

  return res.status(200).json({
    status: 'ok',
    endpoint: url,
    timestamp: new Date().toISOString(),
  });
}
