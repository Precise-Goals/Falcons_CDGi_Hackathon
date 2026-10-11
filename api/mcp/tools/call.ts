export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch {}
  }

  const tool = body?.tool;
  const params = body?.params || {};

  switch (tool) {
    case 'intra_list_dependencies':
      return res.status(200).json({
        services: [
          { service: 'users', endpoints: ['/users'] },
          { service: 'payments', endpoints: ['/payments/charge'] },
          { service: 'search', endpoints: ['/search'] },
          { service: 'notifications', endpoints: ['/notifications/webhook'] },
          { service: 'mcp-tool', endpoints: ['/mcp-tool/execute'] },
        ],
      });

    case 'intra_get_contract':
      return res.status(200).json({
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
      return res.status(200).json({
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
      return res.status(200).json({
        changeId: params.change_id || 'chg_recent_m1',
        affectedWorkflows: ['userProfile', 'userAudit'],
        totalAffected: 2,
        severity: 'low',
        breakingWorkflows: 0,
      });

    case 'intra_propose_adapter':
      return res.status(200).json({
        changeId: params.change_id || 'chg_recent_m1',
        strategy: 'rename',
        confidence: 0.95,
        adapterCode: 'export function adaptResponse(data) {\n  if (Array.isArray(data)) return data.map(i => ({ ...i, name: i.display_name ?? i.name }));\n  return { ...data, name: data.display_name ?? data.name };\n}',
        rollbackHandle: `rollback_${Date.now()}`,
      });

    case 'intra_apply_adapter':
      if (params.confirm !== true) {
        return res.status(400).json({
          error: 'Explicit confirmation required. Pass { confirm: true } to apply adapter.',
        });
      }
      return res.status(200).json({
        applied: true,
        proposalId: params.proposal_id || 'prop_default',
        status: 'approved',
        activeCanary: true,
      });

    case 'intra_health':
      return res.status(200).json({
        status: 'healthy',
        rateLimitHeadroom: 98,
        activeAdapters: 2,
        observedServices: 5,
      });

    default:
      return res.status(404).json({
        error: `Tool "${tool}" not found`,
      });
  }
}
