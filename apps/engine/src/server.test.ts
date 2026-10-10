import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildEngineApp } from './server.js';
import { PipelineEngine } from './pipeline.js';
import { FastifyInstance } from 'fastify';

describe('Intra Engine Monolith API & End-to-End Pipeline', () => {
  let app: FastifyInstance;
  let pipeline: PipelineEngine;

  beforeEach(async () => {
    pipeline = new PipelineEngine();
    app = buildEngineApp(pipeline);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('health endpoint returns 200 with status ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe('ok');
  });

  it('records observations and executes end-to-end pipeline detection and adaptation', async () => {
    // 1. Submit baseline observation (name: 'Alice')
    await app.inject({
      method: 'POST',
      url: '/observe',
      payload: {
        id: 'obs_base_1',
        service: 'users',
        endpoint: '/users',
        method: 'GET',
        status: 200,
        headers: {},
        body: [{ id: '1', name: 'Alice Walker', status: 'active' }],
        latencyMs: 12,
        timestamp: new Date().toISOString(),
      },
    });

    // Run pipeline to establish baseline contract
    await app.inject({ method: 'POST', url: '/pipeline/run' });

    // 2. Submit mutated observation (display_name: 'Alice Walker')
    await app.inject({
      method: 'POST',
      url: '/observe',
      payload: {
        id: 'obs_mut_1',
        service: 'users',
        endpoint: '/users',
        method: 'GET',
        status: 200,
        headers: {},
        body: [{ id: '1', display_name: 'Alice Walker', status: 'active' }],
        latencyMs: 14,
        timestamp: new Date().toISOString(),
      },
    });

    // Run pipeline to detect change, evaluate impact, and auto-adapt
    const runRes = await app.inject({ method: 'POST', url: '/pipeline/run' });
    expect(runRes.statusCode).toBe(200);
    const runResult = runRes.json().result;

    expect(runResult.changes.length).toBeGreaterThan(0);
    const renameChange = runResult.changes.find((c: any) => c.kind === 'rename');
    expect(renameChange).toBeDefined();
    expect(renameChange.semanticVerdict).toBe('equivalent');

    // Verify adapter auto-applied
    const adaptersRes = await app.inject({ method: 'GET', url: '/adapters' });
    const adapters = adaptersRes.json().adapters;
    expect(adapters.length).toBeGreaterThan(0);
    expect(adapters[0].strategy).toBe('rename');

    // Verify impact report generated
    const impactRes = await app.inject({
      method: 'GET',
      url: `/impact/${renameChange.id}`,
    });
    expect(impactRes.statusCode).toBe(200);
    expect(impactRes.json().affectedWorkflows).toContain('userProfile');
  });
});
