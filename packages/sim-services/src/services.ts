import Fastify, { FastifyInstance } from 'fastify';
import { Buffer } from 'node:buffer';
import { Switchboard } from './switchboard.js';

export function buildSimServicesApp(switchboard: Switchboard): FastifyInstance {
  const app = Fastify({ logger: false });

  // Switchboard control endpoints
  app.get('/sim/switchboard', async () => {
    return { mutations: switchboard.list() };
  });

  app.post<{ Body: { mutationId: string; active: boolean } }>(
    '/sim/switchboard/toggle',
    async (req, reply) => {
      const { mutationId, active } = req.body;
      const success = switchboard.toggle(mutationId, active);
      if (!success) {
        return reply.status(404).send({ error: 'Mutation not found' });
      }
      return { success, mutation: switchboard.list().find((m) => m.id === mutationId) };
    }
  );

  app.post('/sim/switchboard/reset', async () => {
    switchboard.resetAll();
    return { success: true, message: 'All mutations reset to baseline' };
  });

  // 1. Users Service (M1: name -> display_name, M2: "Last, First", M10: enum semantics)
  app.get('/users', async () => {
    const rawUsers = [
      { id: 'usr_1', firstName: 'Alice', lastName: 'Walker', isSuspended: false },
      { id: 'usr_2', firstName: 'Bob', lastName: 'Stone', isSuspended: false },
      { id: 'usr_3', firstName: 'Charlie', lastName: 'Brown', isSuspended: true },
    ];

    return rawUsers.map((u) => {
      let formattedName = `${u.firstName} ${u.lastName}`;
      if (switchboard.isEnabled('M2')) {
        formattedName = `${u.lastName}, ${u.firstName}`;
      }

      let status = u.isSuspended ? 'suspended' : 'active';
      if (switchboard.isEnabled('M10')) {
        // M10: suspended users now returned as 'active' (enum meaning drift)
        status = 'active';
      }

      if (switchboard.isEnabled('M1')) {
        // M1: rename name -> display_name
        return {
          id: u.id,
          display_name: formattedName,
          status,
        };
      }

      return {
        id: u.id,
        name: formattedName,
        status,
      };
    });
  });

  // 2. Payments Service (M3: dollars to cents, M4: default currency, M8: rate limit)
  let requestCount = 0;
  let lastWindowTime = Date.now();

  app.post<{ Body: { amount?: number; currency?: string; customerId?: string } }>(
    '/payments/charge',
    async (req, reply) => {
      const now = Date.now();
      if (now - lastWindowTime > 1000) {
        requestCount = 0;
        lastWindowTime = now;
      }
      requestCount++;

      // M8: 429 begins at 5 rps with new Retry-After shape
      if (switchboard.isEnabled('M8') && requestCount > 5) {
        reply.header('Retry-After', '2');
        reply.header('X-RateLimit-Limit', '5');
        reply.header('X-RateLimit-Remaining', '0');
        return reply.status(429).send({
          error: 'Too Many Requests',
          retry_after_seconds: 2,
        });
      }

      const defaultCurrency = switchboard.isEnabled('M4') ? 'EUR' : 'USD';
      const currency = req.body?.currency || defaultCurrency;
      const baseAmount = req.body?.amount ?? 25.0;

      let chargedAmount = baseAmount;
      if (switchboard.isEnabled('M3')) {
        // M3: float dollars -> int cents (e.g. 25.0 -> 2500)
        chargedAmount = Math.round(baseAmount * 100);
      }

      return {
        id: `chg_${Date.now()}`,
        amount: chargedAmount,
        currency,
        status: 'succeeded',
        timestamp: new Date().toISOString(),
      };
    }
  );

  // 3. Search Service (M5: offset -> cursor, M6: silent truncation)
  app.get<{ Querystring: { q?: string; offset?: string; limit?: string; cursor?: string } }>(
    '/search',
    async (req, reply) => {
      const allItems = Array.from({ length: 100 }, (_, i) => ({
        id: `item_${i + 1}`,
        title: `Product item ${i + 1}`,
        category: 'logistics',
      }));

      // M5: offset -> opaque cursor
      if (switchboard.isEnabled('M5')) {
        if (req.query.offset !== undefined && req.query.cursor === undefined) {
          // Legacy client requesting offset when service requires cursor!
          return reply.status(400).send({
            error: 'offset pagination deprecated; cursor required',
            requiredHeaderOrParam: 'cursor',
          });
        }
        const cursorIndex = req.query.cursor
          ? parseInt(Buffer.from(req.query.cursor, 'base64').toString('ascii'), 10)
          : 0;
        const limit = 20;
        const page = allItems.slice(cursorIndex, cursorIndex + limit);
        const nextCursor =
          cursorIndex + limit < allItems.length
            ? Buffer.from(String(cursorIndex + limit)).toString('base64')
            : null;

        return {
          items: page,
          nextCursor,
          total: allItems.length,
        };
      }

      // Offset pagination baseline
      let limit = parseInt(req.query.limit || '100', 10);
      // M6: silent truncation (caps limit 100 -> 20 without warning)
      if (switchboard.isEnabled('M6') && limit > 20) {
        limit = 20;
      }
      const offset = parseInt(req.query.offset || '0', 10);
      const items = allItems.slice(offset, offset + limit);

      return {
        items,
        total: allItems.length,
        limit,
        offset,
      };
    }
  );

  // 4. Notifications Webhook (M7: payload nests event.type -> type)
  app.post<{ Body: Record<string, unknown> }>('/notifications/webhook', async (req) => {
    const raw = req.body || {};
    if (switchboard.isEnabled('M7')) {
      // M7: payload nests event.type -> type
      return {
        type: (raw.event as Record<string, unknown>)?.type || raw.type || 'unknown_event',
        id: (raw.event as Record<string, unknown>)?.id || raw.id || 'evt_0',
        timestamp: Date.now(),
        received: true,
      };
    }

    // Baseline: nested event object
    return {
      event: {
        type: raw.type || (raw.event as Record<string, unknown>)?.type || 'unknown_event',
        id: raw.id || (raw.event as Record<string, unknown>)?.id || 'evt_0',
      },
      timestamp: Date.now(),
      received: true,
    };
  });

  // 5. MCP-Tool Service (M9: arg query -> q, plus required limit)
  app.post<{ Body: { query?: string; q?: string; limit?: number; strict?: boolean } }>(
    '/mcp-tool/execute',
    async (req, reply) => {
      if (switchboard.isEnabled('M9')) {
        // M9: requires 'q' and 'limit'
        if (!req.body?.q) {
          return reply.status(400).send({
            error: 'Missing required argument: q (query renamed to q)',
          });
        }
        if (req.body?.limit === undefined) {
          return reply.status(400).send({
            error: 'Missing required argument: limit is now required',
          });
        }
        return {
          result: `Matched ${req.body.limit} records for query: ${req.body.q}`,
          status: 'completed',
        };
      }

      // Baseline: query + strict
      const query = req.body?.query || 'default';
      return {
        result: `Matched records for query: ${query}`,
        status: 'completed',
      };
    }
  );

  return app;
}
