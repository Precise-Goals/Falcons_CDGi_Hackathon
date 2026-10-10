import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildMcpServer } from './server.js';
import { FastifyInstance } from 'fastify';

describe('Customer MCP Server (mcpserver/)', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = buildMcpServer();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('healthz returns 200 healthy for Render health checks', async () => {
    const res = await app.inject({ method: 'GET', url: '/healthz' });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe('healthy');
  });

  it('lists all 7 customer MCP tools', async () => {
    const res = await app.inject({ method: 'GET', url: '/tools' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.tools.length).toBe(7);
    const toolNames = body.tools.map((t: any) => t.name);
    expect(toolNames).toContain('intra_list_dependencies');
    expect(toolNames).toContain('intra_get_contract');
    expect(toolNames).toContain('intra_recent_changes');
    expect(toolNames).toContain('intra_impact');
    expect(toolNames).toContain('intra_propose_adapter');
    expect(toolNames).toContain('intra_apply_adapter');
    expect(toolNames).toContain('intra_health');
  });

  it('requires confirm: true when invoking intra_apply_adapter', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/tools/call',
      payload: {
        tool: 'intra_apply_adapter',
        params: { proposal_id: 'prop_123', confirm: false },
      },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain('confirm: true');
  });
});
