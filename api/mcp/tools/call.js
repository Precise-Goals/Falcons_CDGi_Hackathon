function sendJson(res, statusCode, data) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
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
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, api-subscription-key');
    res.statusCode = 200;
    return res.end();
  }

  const body = getBody(req);
  const tool = body.tool;
  const params = body.params || {};

  switch (tool) {
    case 'intra_list_dependencies':
      return sendJson(res, 200, {
        services: [
          { service: 'users', endpoints: ['/users'] },
          { service: 'payments', endpoints: ['/payments/charge'] },
          { service: 'search', endpoints: ['/search'] },
          { service: 'notifications', endpoints: ['/notifications/webhook'] },
          { service: 'mcp-tool', endpoints: ['/mcp-tool/execute'] },
        ],
      });

    case 'intra_get_contract':
      return sendJson(res, 200, {
        service: params.service || 'users',
        endpoint: params.endpoint || '/users',
        schema: {
          types: { id: 'string', name: 'string', status: 'string' },
          optionality: [],
          enums: { status: ['active', 'suspended'] },
        },
        fieldStats: {
          name: { cardinality: 'low' },
          status: { cardinality: 'enum' },
        },
        paginationStyle: 'none',
      });

    case 'intra_recent_changes':
      return sendJson(res, 200, {
        changes: [
          {
            id: 'chg_recent_m1',
            service: 'users',
            endpoint: '/users',
            kind: 'rename',
            before: { field: 'name' },
            after: { field: 'display_name' },
            confidence: 0.95,
            semanticVerdict: 'equivalent',
            detectedAt: new Date().toISOString(),
          },
        ],
      });

    case 'intra_impact':
      return sendJson(res, 200, {
        changeId: params.change_id || 'chg_recent_m1',
        affectedWorkflows: ['userProfile', 'userAudit'],
        totalAffected: 2,
        severity: 'low',
        breakingWorkflows: 0,
      });

    case 'intra_propose_adapter':
      return sendJson(res, 200, {
        changeId: params.change_id || 'chg_recent_m1',
        strategy: 'rename',
        confidence: 0.95,
        adapterCode: 'export function adaptResponse(data) {\n  if (Array.isArray(data)) return data.map(i => ({ ...i, name: i.display_name ?? i.name }));\n  return { ...data, name: data.display_name ?? data.name };\n}',
        rollbackHandle: `rollback_${Date.now()}`,
      });

    case 'intra_apply_adapter':
      if (params.confirm !== true) {
        return sendJson(res, 400, {
          error: 'Explicit confirmation required. Pass { confirm: true } to apply adapter.',
        });
      }
      return sendJson(res, 200, {
        applied: true,
        proposalId: params.proposal_id || 'prop_default',
        status: 'approved',
        activeCanary: true,
      });

    case 'intra_health':
      return sendJson(res, 200, {
        status: 'healthy',
        rateLimitHeadroom: 98,
        activeAdapters: 2,
        observedServices: 5,
      });

    default:
      return sendJson(res, 404, {
        error: `Tool "${tool}" not found`,
      });
  }
}

module.exports = handler;
module.exports.default = handler;
