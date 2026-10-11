import { describe, it, expect } from 'vitest';
import { CUSTOMER_MCP_TOOLS, validateToolInput } from './registry.js';

describe('@intra/mcpserver Customer Tools Registry & Schema Validation', () => {
  it('registers all core customer MCP tools with valid input schemas', () => {
    expect(CUSTOMER_MCP_TOOLS.length).toBeGreaterThanOrEqual(5);

    const names = CUSTOMER_MCP_TOOLS.map((t) => t.name);
    expect(names).toContain('intra_list_dependencies');
    expect(names).toContain('intra_get_contract');
    expect(names).toContain('intra_recent_changes');
    expect(names).toContain('intra_impact');
    expect(names).toContain('intra_propose_adapter');
    expect(names).toContain('intra_apply_adapter');
    expect(names).toContain('intra_health');

    for (const tool of CUSTOMER_MCP_TOOLS) {
      expect(tool.description.length).toBeGreaterThan(10);
      expect(tool.inputSchema.type).toBe('object');
      expect(typeof tool.inputSchema.properties).toBe('object');
    }
  });

  it('validates required parameters for intra_get_contract', () => {
    const valid = validateToolInput('intra_get_contract', {
      service: 'users',
      endpoint: '/users',
    });
    expect(valid.valid).toBe(true);
    expect(valid.errors).toHaveLength(0);

    const invalid = validateToolInput('intra_get_contract', {
      service: 'users',
    });
    expect(invalid.valid).toBe(false);
    expect(invalid.errors[0]).toContain('endpoint');
  });

  it('validates required parameters for intra_apply_adapter', () => {
    const valid = validateToolInput('intra_apply_adapter', {
      proposal_id: 'prop_m1_01',
      confirm: true,
    });
    expect(valid.valid).toBe(true);

    const missingConfirm = validateToolInput('intra_apply_adapter', {
      proposal_id: 'prop_m1_01',
    });
    expect(missingConfirm.valid).toBe(false);
    expect(missingConfirm.errors[0]).toContain('confirm');
  });

  it('reports error when validating unknown tool', () => {
    const res = validateToolInput('unknown_fake_tool', {});
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toContain('Unknown tool');
  });
});
