import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildMcpServer } from './server.js';

describe('MCP Server Comprehensive Test Suite (tools.test.ts)', () => {
  let app: FastifyInstance;
  const mockEngineUrl = 'http://mock-engine:3001';

  beforeEach(async () => {
    vi.restoreAllMocks();
    app = buildMcpServer({ engineUrl: mockEngineUrl });
    await app.ready();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await app.close();
  });

  describe('1. Render Healthcheck (/healthz)', () => {
    it('returns HTTP 200, status === "healthy", transport === "http/streamable", and valid ISO timestamp', async () => {
      const startTime = Date.now() - 1000;
      const res = await app.inject({ method: 'GET', url: '/healthz' });

      expect(res.statusCode).toBe(200);
      const body = res.json();

      expect(body.status).toBe('healthy');
      expect(body.transport).toBe('http/streamable');
      expect(typeof body.timestamp).toBe('string');

      // Verify valid ISO timestamp format
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
      expect(body.timestamp).toMatch(isoRegex);

      const parsedTimestamp = Date.parse(body.timestamp);
      expect(Number.isNaN(parsedTimestamp)).toBe(false);
      expect(parsedTimestamp).toBeGreaterThanOrEqual(startTime);
      expect(parsedTimestamp).toBeLessThanOrEqual(Date.now() + 1000);
    });

    it('handles concurrent bursts of /healthz calls consistently', async () => {
      const calls = Array.from({ length: 10 }, () =>
        app.inject({ method: 'GET', url: '/healthz' })
      );
      const responses = await Promise.all(calls);
      for (const res of responses) {
        expect(res.statusCode).toBe(200);
        expect(res.json().status).toBe('healthy');
        expect(res.json().transport).toBe('http/streamable');
      }
    });
  });

  describe('2. Tool Inventory (/tools)', () => {
    it('verifies exactly 7 tools listed, matching Section 11 of spec', async () => {
      const res = await app.inject({ method: 'GET', url: '/tools' });
      expect(res.statusCode).toBe(200);
      const body = res.json();

      expect(Array.isArray(body.tools)).toBe(true);
      expect(body.tools).toHaveLength(7);

      const expectedTools = [
        'intra_list_dependencies',
        'intra_get_contract',
        'intra_recent_changes',
        'intra_impact',
        'intra_propose_adapter',
        'intra_apply_adapter',
        'intra_health',
      ];

      const actualNames = body.tools.map((t: { name: string }) => t.name);
      expect(actualNames.sort()).toEqual(expectedTools.sort());
    });

    it('verifies each tool contains a valid name and description', async () => {
      const res = await app.inject({ method: 'GET', url: '/tools' });
      const { tools } = res.json();

      for (const tool of tools) {
        expect(typeof tool.name).toBe('string');
        expect(tool.name.trim().length).toBeGreaterThan(0);
        expect(typeof tool.description).toBe('string');
        expect(tool.description.trim().length).toBeGreaterThan(0);
      }
    });

    it('verifies parameter specifications for tools requiring parameters', async () => {
      const res = await app.inject({ method: 'GET', url: '/tools' });
      const { tools } = res.json();
      const toolMap = new Map(tools.map((t: any) => [t.name, t]));

      const getContract = toolMap.get('intra_get_contract');
      expect(getContract.parameters).toEqual({ service: 'string', endpoint: 'string' });

      const recentChanges = toolMap.get('intra_recent_changes');
      expect(recentChanges.parameters).toEqual({
        service: 'optional string',
        min_confidence: 'optional number',
      });

      const impact = toolMap.get('intra_impact');
      expect(impact.parameters).toEqual({ change_id: 'string' });

      const proposeAdapter = toolMap.get('intra_propose_adapter');
      expect(proposeAdapter.parameters).toEqual({ change_id: 'string' });

      const applyAdapter = toolMap.get('intra_apply_adapter');
      expect(applyAdapter.parameters).toEqual({
        proposal_id: 'string',
        confirm: 'boolean',
      });
    });
  });

  describe('3. Tool Execution (/tools/call) - Fallback & Error Handling (Engine Offline)', () => {
    beforeEach(() => {
      // Mock fetch failure simulating offline engine
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Connection refused'));
    });

    it('intra_list_dependencies handles engine fallback cleanly and returns list of services', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: { tool: 'intra_list_dependencies' },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body).toEqual({
        services: ['users', 'payments', 'search', 'notifications', 'mcp-tool'],
      });
    });

    it('intra_get_contract returns error object when contract not found on engine', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: {
          tool: 'intra_get_contract',
          params: { service: 'users', endpoint: '/users' },
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body).toEqual({ error: 'Contract not found' });
    });

    it('intra_recent_changes returns changes array fallback cleanly', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: { tool: 'intra_recent_changes' },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body).toEqual({ changes: [] });
    });

    it('intra_impact returns error object when impact not found on engine', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: {
          tool: 'intra_impact',
          params: { change_id: 'chg_123' },
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body).toEqual({ error: 'Impact not found' });
    });

    it('intra_health returns status engine_unreachable when engine offline', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: { tool: 'intra_health' },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body).toEqual({ status: 'engine_unreachable' });
    });

    it('intra_apply_adapter returns failure object when confirm is true but engine is unreachable', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: {
          tool: 'intra_apply_adapter',
          params: { proposal_id: 'prop_999', confirm: true },
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body).toEqual({ success: false, message: 'Engine apply failed' });
    });
  });

  describe('3b. Tool Execution (/tools/call) - intra_apply_adapter Confirmation Validation', () => {
    it('returns 400 error requiring explicit confirmation when confirm is false', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: {
          tool: 'intra_apply_adapter',
          params: { proposal_id: 'prop_001', confirm: false },
        },
      });

      expect(res.statusCode).toBe(400);
      const body = res.json();
      expect(body.error).toBe('Explicit confirm: true is required to apply adapter');
    });

    it('returns 400 error when confirm is omitted', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: {
          tool: 'intra_apply_adapter',
          params: { proposal_id: 'prop_001' },
        },
      });

      expect(res.statusCode).toBe(400);
      const body = res.json();
      expect(body.error).toBe('Explicit confirm: true is required to apply adapter');
    });

    it('returns 400 error when confirm is null or undefined or empty', async () => {
      const testCases = [
        { proposal_id: 'prop_001', confirm: null },
        { proposal_id: 'prop_001', confirm: 0 },
        { proposal_id: 'prop_001', confirm: '' },
      ];

      for (const params of testCases) {
        const res = await app.inject({
          method: 'POST',
          url: '/tools/call',
          payload: { tool: 'intra_apply_adapter', params },
        });

        expect(res.statusCode).toBe(400);
        expect(res.json().error).toBe('Explicit confirm: true is required to apply adapter');
      }
    });

    it('forwards apply call to engine when confirm is true', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          proposal_id: 'prop_001',
          applied_at: '2026-10-10T20:00:00.000Z',
        }),
      } as Response);

      const res = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: {
          tool: 'intra_apply_adapter',
          params: { proposal_id: 'prop_001', confirm: true },
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.proposal_id).toBe('prop_001');

      expect(fetchSpy).toHaveBeenCalledWith(
        `${mockEngineUrl}/apply/prop_001`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ confirm: true }),
        })
      );
    });
  });

  describe('3c. Tool Execution (/tools/call) - Online Engine Proxy', () => {
    it('intra_list_dependencies proxies to engine and returns live services', async () => {
      const engineServices = { services: ['billing-v2', 'auth-service', 'inventory'] };
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => engineServices,
      } as Response);

      const res = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: { tool: 'intra_list_dependencies' },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual(engineServices);
    });

    it('intra_get_contract proxies to engine contracts endpoint', async () => {
      const contractData = {
        schema: { type: 'object', properties: { id: { type: 'string' } } },
        fingerprint: 'sha256-abc',
      };
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => contractData,
      } as Response);

      const res = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: {
          tool: 'intra_get_contract',
          params: { service: 'payments', endpoint: '/charges' },
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual(contractData);
      expect(fetchSpy).toHaveBeenCalledWith(`${mockEngineUrl}/contracts/payments//charges`);
    });

    it('intra_recent_changes proxies to engine changes endpoint', async () => {
      const changesData = {
        changes: [
          { id: 'chg_m1', service: 'users', kind: 'rename', semanticVerdict: 'equivalent' },
        ],
      };
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => changesData,
      } as Response);

      const res = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: { tool: 'intra_recent_changes' },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual(changesData);
    });

    it('intra_impact proxies to engine impact endpoint', async () => {
      const impactData = {
        change_id: 'chg_m1',
        affected_workflows: ['checkout', 'user_profile'],
        blast_radius: 'medium',
      };
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => impactData,
      } as Response);

      const res = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: {
          tool: 'intra_impact',
          params: { change_id: 'chg_m1' },
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual(impactData);
      expect(fetchSpy).toHaveBeenCalledWith(`${mockEngineUrl}/impact/chg_m1`);
    });

    it('intra_health proxies to engine health endpoint', async () => {
      const healthData = { status: 'healthy', headroom: 98.5, active_monitors: 5 };
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => healthData,
      } as Response);

      const res = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: { tool: 'intra_health' },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual(healthData);
    });

    it('handles non-ok HTTP responses from engine cleanly as fallbacks', async () => {
      // intra_list_dependencies when engine returns 500
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const res = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: { tool: 'intra_list_dependencies' },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({
        services: ['users', 'payments', 'search', 'notifications', 'mcp-tool'],
      });
    });
  });

  describe('3d. Unknown Tool Handling', () => {
    it('returns 404 error when tool is nonexistent', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: { tool: 'nonexistent_tool' },
      });

      expect(res.statusCode).toBe(404);
      const body = res.json();
      expect(body.error).toBe('Unknown tool: nonexistent_tool');
    });

    it('returns 404 error for empty or invalid tool names', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: { tool: '' },
      });

      expect(res.statusCode).toBe(404);
      expect(res.json().error).toBe('Unknown tool: ');
    });
  });

  describe('4. Robustness & Boundary Value Tests', () => {
    it('handles empty payload {} gracefully without unhandled exceptions', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: {},
      });

      expect(res.statusCode).toBe(404);
      expect(res.json().error).toBe('Unknown tool: undefined');
    });

    it('handles undefined params gracefully', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('offline'));

      const res = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: { tool: 'intra_get_contract' },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ error: 'Contract not found' });
    });

    it('handles unexpected data types in params gracefully', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));

      const testPayloads = [
        { tool: 'intra_get_contract', params: { service: null, endpoint: null } },
        { tool: 'intra_impact', params: { change_id: 12345 } },
        { tool: 'intra_apply_adapter', params: { proposal_id: '', confirm: false } },
        { tool: 'intra_recent_changes', params: { service: 9999, min_confidence: 'invalid' } },
      ];

      for (const payload of testPayloads) {
        const res = await app.inject({
          method: 'POST',
          url: '/tools/call',
          payload,
        });

        // Either 200 with fallback or 400 for unconfirmed apply - never 500 crash
        expect([200, 400]).toContain(res.statusCode);
      }
    });

    it('handles requests with extra unexpected properties gracefully', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('offline'));

      const res = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: {
          tool: 'intra_list_dependencies',
          params: {},
          extra_field_1: 'benign',
          extra_field_2: { nested: true },
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().services).toBeDefined();
    });

    it('handles boundary string inputs such as unicode and special characters in params', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));

      const res = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: {
          tool: 'intra_impact',
          params: { change_id: '🚀_test_äöü_!@#$%^&*()' },
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ error: 'Impact not found' });
    });
  });
});
