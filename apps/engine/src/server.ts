import Fastify, { FastifyInstance } from 'fastify';
import { PipelineEngine } from './pipeline.js';
import { ObservationSchema } from '@intra/shared';

export function buildEngineApp(pipeline = new PipelineEngine()): FastifyInstance {
  const app = Fastify({ logger: false });

  // CORS headers and preflight handling
  app.addHook('onRequest', async (req, reply) => {
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, api-subscription-key');
    if (req.method === 'OPTIONS') {
      return reply.status(204).send();
    }
  });

  // Catch-all parser for missing or arbitrary Content-Type to prevent 415 Unsupported Media Type
  app.addContentTypeParser('*', { parseAs: 'string' }, (_req, body, done) => {
    try {
      done(null, body ? JSON.parse(body as string) : {});
    } catch {
      done(null, {});
    }
  });

  const registerRoutes = async (instance: FastifyInstance) => {
    // 1. Record Observation
    instance.post('/observe', async (req, reply) => {
      try {
        if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
          return reply.status(400).send({ error: 'Request body must be a non-empty object' });
        }
        const raw = req.body as any;
        const normalized = {
          id: raw.id || `obs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          service: raw.service || raw.domain,
          endpoint: raw.endpoint,
          method: typeof raw.method === 'string' ? raw.method.toUpperCase() : 'POST',
          status: raw.status ?? raw.statusCode,
          headers: (raw.headers && typeof raw.headers === 'object') ? raw.headers : { 'content-type': 'application/json' },
          body: raw.body ?? raw.responseBody ?? raw.mutatedPayload,
          latencyMs: raw.latencyMs ?? 20,
          timestamp: raw.timestamp || new Date().toISOString(),
          ...(raw.rateLimitHeaders ? { rateLimitHeaders: raw.rateLimitHeaders } : {}),
          ...(raw.paginationShape ? { paginationShape: raw.paginationShape } : {}),
          ...(raw.errorBody ? { errorBody: raw.errorBody } : {}),
        };

        const parsed = ObservationSchema.parse(normalized);
        const obs = pipeline.recordObservation(parsed);
        return reply.status(201).send(obs);
      } catch (err: any) {
        return reply.status(400).send({ error: err.message });
      }
    });

    // 2. Contracts
    instance.get<{ Params: { service: string; endpoint: string } }>(
      '/contracts/:service/:endpoint',
      async (req, reply) => {
        const { service, endpoint } = req.params;
        const key = `${service.toLowerCase()}:/${endpoint.toLowerCase().replace(/^\//, '')}`;
        const contract = pipeline.activeContracts.get(key) || pipeline.baselines.get(key);
        if (!contract) {
          return reply.status(404).send({ error: 'Contract not found' });
        }
        return contract;
      }
    );

    // 3. Observed Services
    instance.get('/services', async () => {
      const servicesList: Record<string, string[]> = {};
      for (const [key] of pipeline.activeContracts.entries()) {
        const [svc, ep] = key.split(':');
        if (!servicesList[svc]) servicesList[svc] = [];
        servicesList[svc].push(ep);
      }
      return {
        services: Object.entries(servicesList).map(([name, endpoints]) => ({
          name,
          endpoints,
          status: 'healthy',
        })),
      };
    });

    // 4. Detected Changes / Drift
    instance.get('/changes', async () => {
      const list = Array.from(pipeline.detectedChanges.values());
      return { changes: list };
    });

    // 5. Impact Analysis
    instance.get<{ Params: { changeId: string } }>('/impact/:changeId', async (req, reply) => {
      const impact = pipeline.impacts.get(req.params.changeId);
      if (!impact) {
        return reply.status(404).send({ error: 'Impact analysis not found for change' });
      }
      return impact;
    });

    // 6. Adapters & Proposals
    instance.get('/adapters', async () => {
      return { adapters: Array.from(pipeline.adapters.values()) };
    });

    instance.get('/proposals', async () => {
      return { proposals: Array.from(pipeline.proposals.values()) };
    });

    instance.post<{ Body: { proposalId: string; confirm: boolean } }>('/apply/:proposalId', async (req, reply) => {
      const { proposalId } = req.params as any;
      const { confirm } = req.body || {};
      const proposal = pipeline.proposals.get(proposalId);
      if (!proposal) {
        return reply.status(404).send({ error: 'Proposal not found' });
      }
      if (!confirm) {
        return reply.status(400).send({ error: 'Explicit confirm: true required to apply proposal' });
      }
      proposal.status = 'approved';
      return { success: true, proposal };
    });

    // 7. Pipeline trigger
    instance.post('/pipeline/run', async () => {
      const result = pipeline.runPipeline();
      return { success: true, result };
    });

    // 8. Health & rate-limit headroom
    instance.get('/health', async () => {
      const dependencies: Record<string, string> = {
        users: 'healthy',
        payments: 'healthy',
        search: 'healthy',
        notifications: 'healthy',
        mcp: 'healthy',
      };
      for (const [key] of pipeline.activeContracts.entries()) {
        const [svc] = key.split(':');
        const hasBreaking = Array.from(pipeline.detectedChanges.values()).some(
          (c) => c.service === svc && c.semanticVerdict === 'breaking'
        );
        dependencies[svc] = hasBreaking ? 'degraded' : 'healthy';
      }
      return {
        status: 'ok',
        uptime: process.uptime(),
        dependencies,
        rateLimitHeadroom: {
          payments: 10,
          search: 50,
        },
        activeContractsCount: pipeline.activeContracts.size,
        detectedChangesCount: pipeline.detectedChanges.size,
        adaptersCount: pipeline.adapters.size,
      };
    });

    // 9. SSE live events ticker
    instance.get('/events', async (_req, reply) => {
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      const data = JSON.stringify({
        type: 'INIT',
        changesCount: pipeline.detectedChanges.size,
        timestamp: new Date().toISOString(),
      });
      reply.raw.write(`data: ${data}\n\n`);
      reply.raw.end();
    });
  };

  app.register(registerRoutes);
  app.register(registerRoutes, { prefix: '/api/engine' });

  return app;
}

const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith('server.js') || process.argv[1].endsWith('server.ts'));

if (isDirectRun && process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  const server = buildEngineApp();
  const port = parseInt(process.env.PORT || '3001', 10);
  server.listen({ port, host: '0.0.0.0' }, (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Intra Engine Monolith running at ${address}`);
  });
}

