import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildMcpServer } from './server.js';

interface ToolDefinition {
  name: string;
  description: string;
  parameters?: Record<string, string>;
}

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
    it('verifies HTTP 200, status === "healthy", transport === "http/streamable", and valid ISO timestamp', async () => {
      const startTime = Date.now() - 1000;
      const res = await app.inject({ method: 'GET', url: '/healthz' });

      expect(res.statusCode).toBe(200);
      const body = res.json();

      expect(body.status).toBe('healthy');
      expect(body.transport).toBe('http/streamable');
      expect(typeof body.timestamp).toBe('string');

      // Verify valid ISO timestamp format (e.g. 2026-10-10T20:00:00.000Z)
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
      expect(body.timestamp).toMatch(isoRegex);

      const parsedTimestamp = Date.parse(body.timestamp);
      expect(Number.isNaN(parsedTimestamp)).toBe(false);
      expect(parsedTimestamp).toBeGreaterThanOrEqual(startTime);
      expect(parsedTimestamp).toBeLessThanOrEqual(Date.now() + 1000);
    });

    it('handles concurrent bursts of /healthz requests cleanly', async () => {
      const calls = Array.from({ length: 15 }, () =>
        app.inject({ method: 'GET', url: '/healthz' })
      );
      const responses = await Promise.all(calls);
      for (const res of responses) {
        expect(res.statusCode).toBe(200);
        const body = res.json();
        expect(body.status).toBe('healthy');
        expect(body.transport).toBe('http/streamable');
        expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
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

      const actualNames = body.tools.map((t: ToolDefinition) => t.name);
      expect(actualNames.sort()).toEqual(expectedTools.sort());
    });

    it('verifies each tool contains a non-empty name and description', async () => {
      const res = await app.inject({ method: 'GET', url: '/tools' });
      const { tools } = res.json() as { tools: ToolDefinition[] };

      for (const tool of tools) {
        expect(typeof tool.name).toBe('string');
        expect(tool.name.trim().length).toBeGreaterThan(0);
        expect(typeof tool.description).toBe('string');
        expect(tool.description.trim().length).toBeGreaterThan(0);
      }
    });

    it('verifies parameter definitions for tools requiring parameters', async () => {
      const res = await app.inject({ method: 'GET', url: '/tools' });
      const { tools } = res.json() as { tools: ToolDefinition[] };
      const toolMap = new Map<string, ToolDefinition>(tools.map((t) => [t.name, t]));

      expect(toolMap.get('intra_list_dependencies')?.parameters).toBeUndefined();
      expect(toolMap.get('intra_health')?.parameters).toBeUndefined();

      expect(toolMap.get('intra_get_contract')?.parameters).toEqual({
        service: 'string',
        endpoint: 'string',
      });

      expect(toolMap.get('intra_recent_changes')?.parameters).toEqual({
        service: 'optional string',
        min_confidence: 'optional number',
      });

      expect(toolMap.get('intra_impact')?.parameters).toEqual({
        change_id: 'string',
      });

      expect(toolMap.get('intra_propose_adapter')?.parameters).toEqual({
        change_id: 'string',
      });

      expect(toolMap.get('intra_apply_adapter')?.parameters).toEqual({
        proposal_id: 'string',
        confirm: 'boolean',
      });
    });
  });

  describe('3. Tool Execution (/tools/call) - Fallbacks (Engine Offline)', () => {
    beforeEach(() => {
      // Simulate unreachable engine
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));
    });

    it('intra_list_dependencies: handles engine fallback cleanly and returns list of services', async () => {
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

    it('intra_get_contract: returns error object when contract not found on engine', async () => {
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

    it('intra_recent_changes: returns changes array fallback cleanly', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: { tool: 'intra_recent_changes' },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body).toEqual({ changes: [] });
    });

    it('intra_impact: returns error object when impact not found on engine', async () => {
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

    it('intra_apply_adapter: returns failure object when confirm is true but engine is unreachable', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: {
          tool: 'intra_apply_adapter',
          params: { proposal_id: 'prop_offline', confirm: true },
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body).toEqual({ success: false, message: 'Engine apply failed' });
    });

    it('intra_health: returns health state (engine_unreachable when engine offline)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: { tool: 'intra_health' },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body).toEqual({ status: 'engine_unreachable' });
    });

    it('Unknown tool (e.g. nonexistent_tool) returns 404 error', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: { tool: 'nonexistent_tool' },
      });

      expect(res.statusCode).toBe(404);
      const body = res.json();
      expect(body).toEqual({ error: 'Unknown tool: nonexistent_tool' });
    });
  });

  describe('3b. Tool Execution (/tools/call) - intra_apply_adapter Confirmation Requirements', () => {
    it('returns 400 error requiring explicit confirmation when confirm is false', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: {
          tool: 'intra_apply_adapter',
          params: { proposal_id: 'prop_100', confirm: false },
        },
      });

      expect(res.statusCode).toBe(400);
      const body = res.json();
      expect(body).toEqual({
        error: 'Explicit confirm: true is required to apply adapter',
      });
    });

    it('returns 400 error when confirm is omitted', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: {
          tool: 'intra_apply_adapter',
          params: { proposal_id: 'prop_100' },
        },
      });

      expect(res.statusCode).toBe(400);
      const body = res.json();
      expect(body).toEqual({
        error: 'Explicit confirm: true is required to apply adapter',
      });
    });

    it('returns 400 error when confirm is null, 0, or empty string', async () => {
      const falsyValues = [null, 0, ''];
      for (const val of falsyValues) {
        const res = await app.inject({
          method: 'POST',
          url: '/tools/call',
          payload: {
            tool: 'intra_apply_adapter',
            params: { proposal_id: 'prop_100', confirm: val },
          },
        });

        expect(res.statusCode).toBe(400);
        expect(res.json()).toEqual({
          error: 'Explicit confirm: true is required to apply adapter',
        });
      }
    });

    it('forwards apply call to engine when confirm is true', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          proposal_id: 'prop_100',
          applied_at: '2026-10-10T21:00:00.000Z',
        }),
      } as Response);

      const res = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: {
          tool: 'intra_apply_adapter',
          params: { proposal_id: 'prop_100', confirm: true },
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.proposal_id).toBe('prop_100');

      expect(fetchSpy).toHaveBeenCalledWith(
        `${mockEngineUrl}/apply/prop_100`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ confirm: true }),
        })
      );
    });
  });

  describe('3c. Tool Execution (/tools/call) - Online Engine Forwarding', () => {
    it('intra_list_dependencies forwards to engine and returns online list of services', async () => {
      const mockServices = { services: ['custom-svc-a', 'custom-svc-b'] };
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockServices,
      } as Response);

      const res = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: { tool: 'intra_list_dependencies' },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual(mockServices);
      expect(fetchSpy).toHaveBeenCalledWith(`${mockEngineUrl}/services`);
    });

    it('intra_get_contract forwards to engine and returns contract schema', async () => {
      const mockContract = {
        service: 'users',
        endpoint: '/users',
        schema: { type: 'array' },
        fingerprint: 'fp_abc',
      };
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockContract,
      } as Response);

      const res = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: {
          tool: 'intra_get_contract',
          params: { service: 'users', endpoint: '/users' },
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual(mockContract);
      expect(fetchSpy).toHaveBeenCalledWith(`${mockEngineUrl}/contracts/users//users`);
    });

    it('intra_recent_changes forwards to engine and returns detected drift changes', async () => {
      const mockChanges = {
        changes: [
          {
            id: 'chg_m1',
            service: 'users',
            endpoint: '/users',
            kind: 'rename',
            semanticVerdict: 'equivalent',
            confidence: 0.95,
          },
        ],
      };
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockChanges,
      } as Response);

      const res = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: { tool: 'intra_recent_changes' },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual(mockChanges);
      expect(fetchSpy).toHaveBeenCalledWith(`${mockEngineUrl}/changes`);
    });

    it('intra_impact forwards to engine and returns impact analysis', async () => {
      const mockImpact = {
        change_id: 'chg_m1',
        blastRadius: 'safe',
        affectedWorkflows: ['checkout'],
      };
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockImpact,
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
      expect(res.json()).toEqual(mockImpact);
      expect(fetchSpy).toHaveBeenCalledWith(`${mockEngineUrl}/impact/chg_m1`);
    });

    it('intra_health forwards to engine and returns engine health state', async () => {
      const mockHealth = {
        status: 'healthy',
        rateLimits: { remaining: 4900, resetInSeconds: 3600 },
      };
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealth,
      } as Response);

      const res = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: { tool: 'intra_health' },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual(mockHealth);
      expect(fetchSpy).toHaveBeenCalledWith(`${mockEngineUrl}/health`);
    });
  });

  describe('4. Robustness & Parameter Boundary Tests', () => {
    it('handles empty payload {} gracefully without unhandled exceptions', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: {},
      });

      expect(res.statusCode).toBe(404);
      expect(res.json()).toEqual({ error: 'Unknown tool: undefined' });
    });

    it('handles undefined or omitted body gracefully without unhandled exceptions', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/tools/call',
      });

      // Handled cleanly by Fastify (e.g. 400 or 404), never an unhandled 500 error
      expect([400, 404]).toContain(res.statusCode);
      expect(res.statusCode).not.toBe(500);
    });

    it('handles undefined params gracefully when params is omitted from request body', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('engine down'));

      const res = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: { tool: 'intra_get_contract' },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ error: 'Contract not found' });
    });

    it('handles null, empty, and unusual values in params without crashing', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('engine down'));

      const variations = [
        { tool: 'intra_get_contract', params: {} },
        { tool: 'intra_get_contract', params: { service: '', endpoint: '' } },
        { tool: 'intra_get_contract', params: { service: 1234, endpoint: true } },
        { tool: 'intra_impact', params: {} },
        { tool: 'intra_impact', params: { change_id: null } },
        { tool: 'intra_impact', params: { change_id: 'special-!@#$%^&*()_+' } },
        { tool: 'intra_recent_changes', params: { service: '🚀-unicode' } },
      ];

      for (const variation of variations) {
        const res = await app.inject({
          method: 'POST',
          url: '/tools/call',
          payload: variation,
        });

        // Must respond cleanly with HTTP 200 or 400, never an unhandled 500
        expect([200, 400]).toContain(res.statusCode);
      }
    });

    it('default server configuration uses localhost:3001 fallback cleanly', async () => {
      const defaultApp = buildMcpServer();
      await defaultApp.ready();

      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('offline'));

      const res = await defaultApp.inject({
        method: 'POST',
        url: '/tools/call',
        payload: { tool: 'intra_list_dependencies' },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({
        services: ['users', 'payments', 'search', 'notifications', 'mcp-tool'],
      });

      await defaultApp.close();
    });
  });
});
