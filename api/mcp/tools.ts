const MCP_TOOLS = [
  {
    name: 'intra_list_dependencies',
    description: 'Lists all external services and endpoints actively observed by Intra',
  },
  {
    name: 'intra_get_contract',
    description: 'Fetches the learned schema and behavioural fingerprint for a service endpoint',
    parameters: { service: 'string', endpoint: 'string' },
  },
  {
    name: 'intra_recent_changes',
    description: 'Fetches recent structural and semantic drift detected by Intra',
    parameters: { service: 'optional string', min_confidence: 'optional number' },
  },
  {
    name: 'intra_impact',
    description: 'Calculates the blast radius of a change on dependent application workflows',
    parameters: { change_id: 'string' },
  },
  {
    name: 'intra_propose_adapter',
    description: 'Generates a compatibility adapter diff and test plan for an unreviewed change',
    parameters: { change_id: 'string' },
  },
  {
    name: 'intra_apply_adapter',
    description: 'Applies an adapter proposal into canary routing after human confirmation',
    parameters: { proposal_id: 'string', confirm: 'boolean' },
  },
  {
    name: 'intra_health',
    description: 'Checks health status, observed error rates, and rate limit headroom across all dependencies',
  },
];

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  res.status(200).json({ tools: MCP_TOOLS });
}
