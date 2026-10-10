import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Switchboard } from './switchboard.js';
import { buildSimServicesApp } from './services.js';
import { FastifyInstance } from 'fastify';

describe('Simulated External Services & Switchboard', () => {
  let switchboard: Switchboard;
  let app: FastifyInstance;

  beforeEach(async () => {
    switchboard = new Switchboard();
    app = buildSimServicesApp(switchboard);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('lists all 10 catalogue mutations in switchboard', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/sim/switchboard',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.mutations.length).toBe(10);
    expect(body.mutations.map((m: { id: string }) => m.id)).toContain('M1');
    expect(body.mutations.map((m: { id: string }) => m.id)).toContain('M10');
  });

  it('serves baseline Users API without mutations', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/users',
    });
    expect(res.statusCode).toBe(200);
    const users = res.json();
    expect(users[0]).toHaveProperty('name', 'Alice Walker');
    expect(users[0]).not.toHaveProperty('display_name');
  });

  it('toggles M1 and returns display_name instead of name', async () => {
    switchboard.toggle('M1', true);
    const res = await app.inject({
      method: 'GET',
      url: '/users',
    });
    expect(res.statusCode).toBe(200);
    const users = res.json();
    expect(users[0]).toHaveProperty('display_name', 'Alice Walker');
    expect(users[0]).not.toHaveProperty('name');
  });

  it('toggles M3 and converts payment amount dollars to cents', async () => {
    // Baseline
    const baseRes = await app.inject({
      method: 'POST',
      url: '/payments/charge',
      payload: { amount: 15.5 },
    });
    expect(baseRes.json().amount).toBe(15.5);

    // M3 active
    switchboard.toggle('M3', true);
    const m3Res = await app.inject({
      method: 'POST',
      url: '/payments/charge',
      payload: { amount: 15.5 },
    });
    expect(m3Res.json().amount).toBe(1550);
  });

  it('toggles M5 and enforces cursor-based pagination on Search API', async () => {
    // Baseline offset works
    const baseRes = await app.inject({
      method: 'GET',
      url: '/search?offset=0&limit=10',
    });
    expect(baseRes.statusCode).toBe(200);
    expect(baseRes.json().items.length).toBe(10);

    // M5 active: offset deprecated, cursor required
    switchboard.toggle('M5', true);
    const m5Fail = await app.inject({
      method: 'GET',
      url: '/search?offset=0',
    });
    expect(m5Fail.statusCode).toBe(400);

    // M5 cursor request succeeds
    const m5Ok = await app.inject({
      method: 'GET',
      url: '/search',
    });
    expect(m5Ok.statusCode).toBe(200);
    expect(m5Ok.json()).toHaveProperty('nextCursor');
  });
});
