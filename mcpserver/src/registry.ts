/**
 * MCP Customer Tools Registry & JSON Schema Parameter Validators
 */

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, { type: string; description?: string }>;
    required?: string[];
  };
}

export const CUSTOMER_MCP_TOOLS: McpToolDefinition[] = [
  {
    name: 'intra_list_dependencies',
    description: 'Lists all external services and endpoints actively observed by Intra',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'intra_get_contract',
    description: 'Fetches the learned schema and behavioural fingerprint for a service endpoint',
    inputSchema: {
      type: 'object',
      properties: {
        service: { type: 'string', description: 'Target service identifier (e.g. users, payments)' },
        endpoint: { type: 'string', description: 'Target API endpoint path (e.g. /users)' },
      },
      required: ['service', 'endpoint'],
    },
  },
  {
    name: 'intra_recent_changes',
    description: 'Fetches recent structural and semantic drift detected by Intra',
    inputSchema: {
      type: 'object',
      properties: {
        service: { type: 'string', description: 'Optional service filter' },
        min_confidence: { type: 'number', description: 'Minimum confidence score threshold (0.0 to 1.0)' },
      },
    },
  },
  {
    name: 'intra_impact',
    description: 'Calculates the blast radius of a change on dependent application workflows',
    inputSchema: {
      type: 'object',
      properties: {
        change_id: { type: 'string', description: 'Target drift change ID (e.g. M1, M3)' },
      },
      required: ['change_id'],
    },
  },
  {
    name: 'intra_propose_adapter',
    description: 'Generates a compatibility adapter diff and validation test plan without applying it',
    inputSchema: {
      type: 'object',
      properties: {
        change_id: { type: 'string', description: 'Target drift change ID' },
      },
      required: ['change_id'],
    },
  },
  {
    name: 'intra_apply_adapter',
    description: 'Applies an adapter proposal to local proxy runtime. Requires explicit confirm: true.',
    inputSchema: {
      type: 'object',
      properties: {
        proposal_id: { type: 'string', description: 'Proposal identifier' },
        confirm: { type: 'boolean', description: 'Safety confirmation flag' },
      },
      required: ['proposal_id', 'confirm'],
    },
  },
  {
    name: 'intra_health',
    description: 'Checks dependency health and rate-limit headroom across all monitored providers',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

/**
 * Validates tool parameters against its JSON Schema definition.
 */
export function validateToolInput(
  toolName: string,
  params: Record<string, unknown> = {}
): { valid: boolean; errors: string[] } {
  const tool = CUSTOMER_MCP_TOOLS.find((t) => t.name === toolName);
  if (!tool) {
    return { valid: false, errors: [`Unknown tool: ${toolName}`] };
  }

  const errors: string[] = [];
  const required = tool.inputSchema.required ?? [];

  for (const field of required) {
    if (params[field] === undefined || params[field] === null || params[field] === '') {
      errors.push(`Missing required parameter: "${field}"`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
