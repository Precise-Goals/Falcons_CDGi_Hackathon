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

  // 1. Record Observation
  app.post('/observe', async (req, reply) => {
    try {
      const parsed = ObservationSchema.parse(req.body);
      const obs = pipeline.recordObservation(parsed);
      return reply.status(201).send(obs);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // 2. Contracts
  app.get<{ Params: { service: string; endpoint: string } }>(
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
  app.get('/services', async () => {
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
  app.get('/changes', async () => {
    const list = Array.from(pipeline.detectedChanges.values());
    return { changes: list };
  });

  // 5. Impact Analysis
  app.get<{ Params: { changeId: string } }>('/impact/:changeId', async (req, reply) => {
    const impact = pipeline.impacts.get(req.params.changeId);
    if (!impact) {
      return reply.status(404).send({ error: 'Impact analysis not found for change' });
    }
    return impact;
  });

  // 6. Adapters & Proposals
  app.get('/adapters', async () => {
    return { adapters: Array.from(pipeline.adapters.values()) };
  });

  app.get('/proposals', async () => {
    return { proposals: Array.from(pipeline.proposals.values()) };
  });

  app.post<{ Body: { proposalId: string; confirm: boolean } }>('/apply/:proposalId', async (req, reply) => {
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
  app.post('/pipeline/run', async () => {
    const result = pipeline.runPipeline();
    return { success: true, result };
  });

  // 8. Health & rate-limit headroom
  app.get('/health', async () => {
    return {
      status: 'ok',
      uptime: process.uptime(),
      dependencies: {
        users: 'healthy',
        payments: 'healthy',
        search: 'healthy',
        notifications: 'healthy',
        mcp: 'healthy',
      },
      rateLimitHeadroom: {
        payments: 10,
        search: 50,
      },
    };
  });

  // 9. SSE live events ticker
  app.get('/events', async (_req, reply) => {
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

