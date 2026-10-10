import Fastify, { FastifyInstance } from 'fastify';

export interface McpServerConfig {
  engineUrl: string;
  apiKey?: string;
}

export function buildMcpServer(
  config: McpServerConfig = { engineUrl: process.env.ENGINE_URL || 'http://localhost:3001' }
): FastifyInstance {
  const app = Fastify({ logger: false });

  // Support optional mounted prefix /api/mcp for Vercel services routing
  app.addHook('onRequest', async (req) => {
    if (req.url.startsWith('/api/mcp')) {
      const stripped = req.url.replace(/^\/api\/mcp/, '') || '/';
      req.raw.url = stripped;
      (req as any).url = stripped;
    }
  });

  // CORS headers and preflight handling
  app.addHook('onRequest', async (req, reply) => {
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, api-subscription-key');
    if (req.method === 'OPTIONS') {
      return reply.status(204).send();
    }
  });

  // 1. Health check for Render / Vercel deployment
  app.get('/healthz', async () => {
    return { status: 'healthy', transport: 'http/streamable', timestamp: new Date().toISOString() };
  });

  // 2. List MCP tools
  app.get('/tools', async () => {
    return {
      tools: [
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
          description: 'Generates a compatibility adapter diff and validation test plan without applying it',
          parameters: { change_id: 'string' },
        },
        {
          name: 'intra_apply_adapter',
          description: 'Applies an adapter proposal. Requires explicit confirm: true.',
          parameters: { proposal_id: 'string', confirm: 'boolean' },
        },
        {
          name: 'intra_health',
          description: 'Checks dependency health and rate-limit headroom',
        },
      ],
    };
  });

  // 3. Execute MCP tools (HTTP / Streamable transport proxy to engine)
  app.post<{ Body: { tool: string; params?: Record<string, any> } }>(
    '/tools/call',
    async (req, reply) => {
      const { tool, params = {} } = req.body || {};

      try {
        switch (tool) {
          case 'intra_list_dependencies': {
            const res = await fetch(`${config.engineUrl}/services`).catch(() => null);
            if (!res || !res.ok) {
              return { services: ['users', 'payments', 'search', 'notifications', 'mcp-tool'] };
            }
            return await res.json();
          }

          case 'intra_get_contract': {
            const { service, endpoint } = params;
            const res = await fetch(`${config.engineUrl}/contracts/${service}/${endpoint}`).catch(
              () => null
            );
            if (!res || !res.ok) {
              return { error: 'Contract not found' };
            }
            return await res.json();
          }

          case 'intra_recent_changes': {
            const res = await fetch(`${config.engineUrl}/changes`).catch(() => null);
            if (!res || !res.ok) {
              return { changes: [] };
            }
            return await res.json();
          }

          case 'intra_impact': {
            const { change_id } = params;
            const res = await fetch(`${config.engineUrl}/impact/${change_id}`).catch(() => null);
            if (!res || !res.ok) {
              return { error: 'Impact not found' };
            }
            return await res.json();
          }

          case 'intra_apply_adapter': {
            const { proposal_id, confirm } = params;
            if (!confirm) {
              return reply
                .status(400)
                .send({ error: 'Explicit confirm: true is required to apply adapter' });
            }
            const res = await fetch(`${config.engineUrl}/apply/${proposal_id}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ confirm: true }),
            }).catch(() => null);
            if (!res || !res.ok) {
              return { success: false, message: 'Engine apply failed' };
            }
            return await res.json();
          }

          case 'intra_health': {
            const res = await fetch(`${config.engineUrl}/health`).catch(() => null);
            if (!res || !res.ok) {
              return { status: 'engine_unreachable' };
            }
            return await res.json();
          }

          default:
            return reply.status(404).send({ error: `Unknown tool: ${tool}` });
        }
      } catch (err: any) {
        return reply.status(500).send({ error: err.message });
      }
    }
  );

  return app;
}

const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith('server.js') ||
   process.argv[1].endsWith('server.ts') ||
   process.argv[1].endsWith('index.js') ||
   process.argv[1].endsWith('index.ts'));

if (isDirectRun && process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  const server = buildMcpServer();
  const port = parseInt(process.env.PORT || process.env.MCP_PORT || '3002', 10);
  server.listen({ port, host: '0.0.0.0' }, (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Intra Customer MCP Server running at ${address} (health: /healthz)`);
  });
}

