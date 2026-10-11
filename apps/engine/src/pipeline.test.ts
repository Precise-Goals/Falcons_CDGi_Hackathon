import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { PipelineEngine } from './pipeline.js';
import { buildEngineApp } from './server.js';
import { Observation } from '@intra/shared';

describe('PipelineEngine Edge Cases & Contract Lifecycle', () => {
  let engine: PipelineEngine;

  beforeEach(() => {
    engine = new PipelineEngine();
  });

  it('establishBaseline with no observations throws Error', () => {
    expect(() => {
      engine.establishBaseline('users', '/users');
    }).toThrow('Cannot baseline without observations for users:/users');

    expect(() => {
      engine.establishBaseline('payments', '/payments/charge');
    }).toThrow('Cannot baseline without observations for payments:/payments/charge');
  });

  it('empty observations runPipeline returns 0 changes, 0 impacts, 0 adapters', () => {
    const result = engine.runPipeline();

    expect(result.observationsCount).toBe(0);
    expect(result.changes).toHaveLength(0);
    expect(result.impacts).toHaveLength(0);
    expect(result.decisions).toHaveLength(0);
    expect(result.validations).toHaveLength(0);
    expect(Object.keys(result.contracts)).toHaveLength(0);
    expect(engine.adapters.size).toBe(0);
    expect(engine.detectedChanges.size).toBe(0);
    expect(engine.impacts.size).toBe(0);
    expect(engine.proposals.size).toBe(0);
    expect(engine.validationResults.size).toBe(0);
  });

  it('baseline inference correctly stores in baselines map', () => {
    engine.recordObservation({
      service: 'users',
      endpoint: '/users',
      method: 'GET',
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: [{ id: 'usr_101', name: 'Alice Walker', status: 'active' }],
      latencyMs: 14,
    });

    const baseline = engine.establishBaseline('users', '/users');

    expect(baseline).toBeDefined();
    expect(engine.baselines.has('users:/users')).toBe(true);
    expect(engine.baselines.get('users:/users')).toBe(baseline);
    expect(engine.activeContracts.get('users:/users')).toBe(baseline);
    expect(baseline.service).toBe('users');
    expect(baseline.endpoint).toBe('/users');
    expect(baseline.schema.types['name']).toBe('string');
    expect(baseline.schema.types['status']).toBe('string');
  });

  it('first run without explicit establishBaseline infers and stores baseline without changes', () => {
    engine.recordObservation({
      service: 'payments',
      endpoint: '/payments/charge',
      method: 'POST',
      status: 200,
      headers: {},
      body: { id: 'chg_1', amount: 50.0, currency: 'USD' },
      latencyMs: 25,
    });

    const result = engine.runPipeline();

    expect(result.observationsCount).toBe(1);
    expect(result.changes).toHaveLength(0);
    expect(result.impacts).toHaveLength(0);
    expect(result.decisions).toHaveLength(0);
    expect(result.validations).toHaveLength(0);
    expect(engine.baselines.has('payments:/payments/charge')).toBe(true);
    expect(engine.activeContracts.has('payments:/payments/charge')).toBe(true);
  });

  it('mutated observation triggers: change detection -> impact analysis -> safe handling evaluation -> adapter validation', () => {
    // 1. Establish baseline
    engine.recordObservation({
      service: 'users',
      endpoint: '/users',
      method: 'GET',
      status: 200,
      headers: {},
      body: [{ id: '1', name: 'Alice Walker', status: 'active' }],
      latencyMs: 12,
    });
    engine.establishBaseline('users', '/users');

    // 2. Mutated observation (rename: name -> display_name)
    engine.recordObservation({
      service: 'users',
      endpoint: '/users',
      method: 'GET',
      status: 200,
      headers: {},
      body: [{ id: '1', display_name: 'Alice Walker', status: 'active' }],
      latencyMs: 14,
    });

    // 3. Execute pipeline
    const result = engine.runPipeline();

    // Verify change detection
    expect(result.changes.length).toBeGreaterThan(0);
    const renameChange = result.changes.find((c) => c.kind === 'rename');
    expect(renameChange).toBeDefined();
    expect(renameChange!.semanticVerdict).toBe('equivalent');
    expect(engine.detectedChanges.has(renameChange!.id)).toBe(true);

    // Verify impact analysis
    expect(result.impacts.length).toBeGreaterThan(0);
    const renameImpact = result.impacts.find((i) => i.changeId === renameChange!.id);
    expect(renameImpact).toBeDefined();
    expect(renameImpact!.affectedWorkflows).toContain('userProfile');
    expect(engine.impacts.has(renameChange!.id)).toBe(true);

    // Verify safe handling evaluation
    expect(result.decisions.length).toBeGreaterThan(0);
    const renameDecision = result.decisions.find(
      (d) => d.adapter?.changeId === renameChange!.id
    );
    expect(renameDecision).toBeDefined();
    expect(renameDecision!.action).toBe('auto_apply');
    expect(renameDecision!.adapter).toBeDefined();

    // Verify adapter validation
    expect(result.validations.length).toBeGreaterThan(0);
    const validationResult = result.validations.find(
      (v) => v.adapterId === renameDecision!.adapter!.id
    );
    expect(validationResult).toBeDefined();
    expect(validationResult!.pass).toBe(true);
    expect(validationResult!.semanticEquivalence).toBe(true);
    expect(engine.adapters.has(renameDecision!.adapter!.id)).toBe(true);
    expect(engine.validationResults.has(renameDecision!.adapter!.id)).toBe(true);
  });

  it('breaking change trips circuit breaker and does not register in adapters map, but registers in proposals', () => {
    // 1. Establish baseline with enum having multiple values ('active' and 'suspended')
    engine.recordObservation({
      service: 'users',
      endpoint: '/users',
      method: 'GET',
      status: 200,
      headers: {},
      body: [{ id: '1', name: 'Alice', status: 'active' }],
      latencyMs: 10,
    });
    engine.recordObservation({
      service: 'users',
      endpoint: '/users',
      method: 'GET',
      status: 200,
      headers: {},
      body: [{ id: '2', name: 'Bob', status: 'suspended' }],
      latencyMs: 10,
    });
    const baseline = engine.establishBaseline('users', '/users');
    expect(baseline.schema.enums['status']).toEqual(expect.arrayContaining(['active', 'suspended']));

    // 2. Record series of mutated observations where 'suspended' completely disappears from window,
    // causing an enum semantic drift marked as breaking.
    for (let i = 3; i <= 8; i++) {
      engine.recordObservation({
        service: 'users',
        endpoint: '/users',
        method: 'GET',
        status: 200,
        headers: {},
        body: [{ id: String(i), name: `User_${i}`, status: 'active' }],
        latencyMs: 11,
      });
    }

    const result = engine.runPipeline();

    // Verify breaking change was detected
    const breakingChange = result.changes.find(
      (c) => c.kind === 'enum_semantics' && c.semanticVerdict === 'breaking'
    );
    expect(breakingChange).toBeDefined();

    // Verify circuit breaker was tripped in decision
    const cbDecision = result.decisions.find((d) => d.action === 'circuit_break');
    expect(cbDecision).toBeDefined();
    expect(cbDecision!.rationale).toContain('Circuit breaker tripped');
    expect(cbDecision!.adapter).toBeUndefined();
    expect(cbDecision!.proposal).toBeDefined();

    // Verify circuit-broken change does NOT register in adapters map
    expect(Array.from(engine.adapters.values()).some((a) => a.changeId === breakingChange!.id)).toBe(false);

    // Verify proposal DOES register in proposals map
    expect(engine.proposals.size).toBeGreaterThan(0);
    expect(engine.proposals.has(cbDecision!.proposal!.id)).toBe(true);
    const storedProposal = engine.proposals.get(cbDecision!.proposal!.id);
    expect(storedProposal).toBeDefined();
    expect(storedProposal?.changeId).toBe(breakingChange!.id);
    expect(storedProposal?.status).toBe('pending');
    expect(storedProposal?.diff).toContain('Breaking change');
  });

  it('idempotency & false-positive resistance: identical observations produce zero changes', () => {
    // Establish baseline using stable endpoint/fields without enum drift
    engine.recordObservation({
      service: 'payments',
      endpoint: '/payments/charge',
      method: 'POST',
      status: 200,
      headers: {},
      body: { id: 'p1', currency: 'USD', role: 'admin' },
      latencyMs: 12,
    });
    engine.establishBaseline('payments', '/payments/charge');

    // Record identical observation
    engine.recordObservation({
      service: 'payments',
      endpoint: '/payments/charge',
      method: 'POST',
      status: 200,
      headers: {},
      body: { id: 'p1', currency: 'USD', role: 'admin' },
      latencyMs: 12,
    });

    const result = engine.runPipeline();

    expect(result.changes).toHaveLength(0);
    expect(result.impacts).toHaveLength(0);
    expect(result.decisions).toHaveLength(0);
    expect(engine.adapters.size).toBe(0);
  });

  it('handles boundary values: empty array body, unicode characters, and extreme latencies', () => {
    // Empty array body
    const obsEmpty = engine.recordObservation({
      service: 'search',
      endpoint: '/search',
      method: 'GET',
      status: 200,
      headers: {},
      body: [],
      latencyMs: 0,
    });
    expect(obsEmpty.id).toBeDefined();

    // Unicode strings and extreme latency
    const obsUnicode = engine.recordObservation({
      service: 'notifications',
      endpoint: '/notifications/webhook',
      method: 'POST',
      status: 200,
      headers: { 'x-correlation-id': 'corr-unicode-🚀-123' },
      body: {
        event: {
          id: 'evt_🔥_999',
          type: 'alert_日本語_한국어_éàç',
          message: 'Notification with emojis 🌍 & special chars: \n\t\r\\',
        },
      },
      latencyMs: 99999,
    });
    expect(obsUnicode.latencyMs).toBe(99999);

    const baseline = engine.establishBaseline('notifications', '/notifications/webhook');
    expect(baseline).toBeDefined();
    expect(baseline.service).toBe('notifications');
  });

  it('unit shift mutation: dollars to cents generates transform adapter and passes validation', () => {
    // 1. Establish baseline with float dollars
    engine.recordObservation({
      service: 'payments',
      endpoint: '/payments/charge',
      method: 'POST',
      status: 200,
      headers: {},
      body: { id: 'c1', amount: 25.5, currency: 'USD' },
      latencyMs: 15,
    });
    engine.establishBaseline('payments', '/payments/charge');

    // 2. Mutated observation with integer cents
    engine.recordObservation({
      service: 'payments',
      endpoint: '/payments/charge',
      method: 'POST',
      status: 200,
      headers: {},
      body: { id: 'c1', amount: 2550, currency: 'USD' },
      latencyMs: 15,
    });

    const result = engine.runPipeline();

    const unitChange = result.changes.find((c) => c.kind === 'unit_shift');
    expect(unitChange).toBeDefined();
    expect(unitChange!.semanticVerdict).toBe('equivalent');

    const decision = result.decisions.find((d) => d.adapter?.changeId === unitChange!.id);
    expect(decision).toBeDefined();
    expect(decision!.adapter?.strategy).toBe('transform');
    expect(engine.adapters.has(decision!.adapter!.id)).toBe(true);
  });

  it('pagination change mutation: offset to cursor generates pagination-normalize adapter', () => {
    // 1. Baseline with offset pagination
    engine.recordObservation({
      service: 'search',
      endpoint: '/search',
      method: 'GET',
      status: 200,
      headers: {},
      body: { items: ['item_1'], offset: 0, limit: 10 },
      latencyMs: 10,
    });
    engine.establishBaseline('search', '/search');

    // 2. Mutated observation with cursor pagination
    engine.recordObservation({
      service: 'search',
      endpoint: '/search',
      method: 'GET',
      status: 200,
      headers: {},
      body: { items: ['item_1'], cursor: 'cur_token_xyz', limit: 10 },
      latencyMs: 10,
    });

    const result = engine.runPipeline();

    const pagChange = result.changes.find((c) => c.kind === 'pagination_changed');
    expect(pagChange).toBeDefined();

    const decision = result.decisions.find((d) => d.adapter?.changeId === pagChange!.id);
    expect(decision).toBeDefined();
    expect(decision!.adapter?.strategy).toBe('pagination-normalize');
    expect(engine.adapters.has(decision!.adapter!.id)).toBe(true);
  });

  it('lossy format shift mutation triggers open_migration_pr decision with both adapter and proposal', () => {
    // 1. Baseline with "First Last" format
    engine.recordObservation({
      service: 'users',
      endpoint: '/users',
      method: 'GET',
      status: 200,
      headers: {},
      body: [{ id: '1', name: 'John Doe', role: 'admin' }],
      latencyMs: 10,
    });
    engine.establishBaseline('users', '/users');

    // 2. Mutated observation with "Last, First" format
    engine.recordObservation({
      service: 'users',
      endpoint: '/users',
      method: 'GET',
      status: 200,
      headers: {},
      body: [{ id: '1', name: 'Doe, John', role: 'admin' }],
      latencyMs: 10,
    });

    const result = engine.runPipeline();

    const formatChange = result.changes.find((c) => c.kind === 'semantic_other');
    expect(formatChange).toBeDefined();
    expect(formatChange!.semanticVerdict).toBe('lossy');

    const decision = result.decisions.find((d) => d.proposal?.changeId === formatChange!.id);
    expect(decision).toBeDefined();
    expect(decision!.action).toBe('open_migration_pr');
    expect(decision!.proposal).toBeDefined();
    expect(decision!.adapter).toBeDefined();
    expect(engine.proposals.has(decision!.proposal!.id)).toBe(true);
    expect(engine.adapters.has(decision!.adapter!.id)).toBe(true);
  });
});

describe('Engine Fastify REST API Edge Cases', () => {
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

  describe('POST /observe Edge Cases', () => {
    it('returns 400 when endpoint is missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/observe',
        payload: {
          id: 'obs_invalid_1',
          service: 'users',
          // endpoint missing
          method: 'GET',
          status: 200,
          headers: {},
          body: { id: '1' },
          latencyMs: 15,
          timestamp: new Date().toISOString(),
        },
      });

      expect(res.statusCode).toBe(400);
      expect(res.json().error).toBeDefined();
    });

    it('returns 400 when request body is missing completely', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/observe',
      });

      expect(res.statusCode).toBe(400);
      expect(res.json().error).toBeDefined();
    });

    it('returns 400 when payload is empty or invalid data type', async () => {
      const resEmpty = await app.inject({
        method: 'POST',
        url: '/observe',
        payload: {},
      });
      expect(resEmpty.statusCode).toBe(400);

      const resBadStatus = await app.inject({
        method: 'POST',
        url: '/observe',
        payload: {
          id: 'obs_invalid_3',
          service: 'users',
          endpoint: '/users',
          method: 'GET',
          status: 'not-an-integer',
          headers: {},
          body: { id: '1' },
          latencyMs: 15,
          timestamp: new Date().toISOString(),
        },
      });
      expect(resBadStatus.statusCode).toBe(400);
    });

    it('returns 201 when observation payload is valid', async () => {
      const validPayload: Observation = {
        id: 'obs_valid_1',
        service: 'users',
        endpoint: '/users',
        method: 'GET',
        status: 200,
        headers: { authorization: 'Bearer secret-token' },
        body: [{ id: '1', name: 'Alice' }],
        latencyMs: 18,
        timestamp: new Date().toISOString(),
      };

      const res = await app.inject({
        method: 'POST',
        url: '/observe',
        payload: validPayload,
      });

      expect(res.statusCode).toBe(201);
      const data = res.json();
      expect(data.id).toBeDefined();
      expect(data.service).toBe('users');
      // Verify authorization header was redacted by ObservationCollector
      expect(data.headers.authorization).toBe('[REDACTED]');
    });
  });

  describe('GET /contracts/:service/:endpoint Edge Cases', () => {
    it('returns 404 for non-existent endpoint', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/contracts/unknownService/nonexistent',
      });

      expect(res.statusCode).toBe(404);
      expect(res.json()).toEqual({ error: 'Contract not found' });
    });

    it('returns 200 for existing contract', async () => {
      // Record observation and establish baseline
      pipeline.recordObservation({
        service: 'users',
        endpoint: '/users',
        method: 'GET',
        status: 200,
        headers: {},
        body: [{ id: '1', name: 'Alice Walker', status: 'active' }],
        latencyMs: 10,
      });
      pipeline.establishBaseline('users', '/users');

      const res = await app.inject({
        method: 'GET',
        url: '/contracts/users/users',
      });

      expect(res.statusCode).toBe(200);
      const contract = res.json();
      expect(contract.service).toBe('users');
      expect(contract.endpoint).toBe('/users');
      expect(contract.schema.types.name).toBe('string');
    });
  });

  describe('GET /services Edge Cases', () => {
    it('returns empty list when no contracts exist', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/services',
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ services: [] });
    });

    it('returns list of distinct observed services and endpoints', async () => {
      // Setup contracts for two distinct services
      pipeline.recordObservation({
        service: 'users',
        endpoint: '/users',
        method: 'GET',
        status: 200,
        headers: {},
        body: [{ id: '1', name: 'Alice' }],
        latencyMs: 10,
      });
      pipeline.recordObservation({
        service: 'payments',
        endpoint: '/payments',
        method: 'POST',
        status: 200,
        headers: {},
        body: { id: 'p1', amount: 99.0 },
        latencyMs: 25,
      });
      pipeline.establishBaseline('users', '/users');
      pipeline.establishBaseline('payments', '/payments');

      const res = await app.inject({
        method: 'GET',
        url: '/services',
      });

      expect(res.statusCode).toBe(200);
      const data = res.json();
      expect(data.services).toHaveLength(2);

      const usersService = data.services.find((s: any) => s.name === 'users');
      expect(usersService).toBeDefined();
      expect(usersService.endpoints).toContain('/users');
      expect(usersService.status).toBe('healthy');

      const paymentsService = data.services.find((s: any) => s.name === 'payments');
      expect(paymentsService).toBeDefined();
      expect(paymentsService.endpoints).toContain('/payments');
      expect(paymentsService.status).toBe('healthy');
    });
  });

  describe('GET /impact/:changeId Edge Cases', () => {
    it('returns 404 for unknown changeId', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/impact/chg_unknown_99999',
      });

      expect(res.statusCode).toBe(404);
      expect(res.json()).toEqual({ error: 'Impact analysis not found for change' });
    });

    it('returns 200 with impact analysis when changeId exists', async () => {
      const changeId = 'chg_test_impact_1';
      pipeline.impacts.set(changeId, {
        changeId,
        affectedWorkflows: ['checkout', 'paymentProcessing'],
        fieldPaths: ['payments.amount'],
        severity: 'high',
        dependencyChain: ['apps/checkout.ts'],
      });

      const res = await app.inject({
        method: 'GET',
        url: `/impact/${changeId}`,
      });

      expect(res.statusCode).toBe(200);
      const impact = res.json();
      expect(impact.changeId).toBe(changeId);
      expect(impact.affectedWorkflows).toContain('checkout');
      expect(impact.severity).toBe('high');
    });
  });

  describe('POST /apply/:proposalId Edge Cases', () => {
    it('returns 404 for unknown proposal', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/apply/prop_unknown_123',
        payload: { confirm: true },
      });

      expect(res.statusCode).toBe(404);
      expect(res.json()).toEqual({ error: 'Proposal not found' });
    });

    it('omitting { confirm: true } returns 400', async () => {
      const proposalId = 'prop_test_400';
      pipeline.proposals.set(proposalId, {
        id: proposalId,
        changeId: 'chg_test_1',
        service: 'users',
        endpoint: '/users',
        status: 'pending',
        proposedSchema: { types: {}, optionality: [], enums: {}, formats: {} },
        suggestedAdapterCode: '// adapter code',
        rationale: 'Schema migration required',
        createdAt: new Date().toISOString(),
      });

      // 1. Missing confirm field completely
      const resMissing = await app.inject({
        method: 'POST',
        url: `/apply/${proposalId}`,
        payload: {},
      });
      expect(resMissing.statusCode).toBe(400);
      expect(resMissing.json().error).toBe('Explicit confirm: true required to apply proposal');

      // 2. confirm is false
      const resFalse = await app.inject({
        method: 'POST',
        url: `/apply/${proposalId}`,
        payload: { confirm: false },
      });
      expect(resFalse.statusCode).toBe(400);
      expect(resFalse.json().error).toBe('Explicit confirm: true required to apply proposal');

      // Proposal status remains 'pending'
      expect(pipeline.proposals.get(proposalId)?.status).toBe('pending');
    });

    it('with { confirm: true } transitions proposal to approved', async () => {
      const proposalId = 'prop_test_approve';
      pipeline.proposals.set(proposalId, {
        id: proposalId,
        changeId: 'chg_test_2',
        service: 'payments',
        endpoint: '/payments',
        status: 'pending',
        proposedSchema: { types: {}, optionality: [], enums: {}, formats: {} },
        suggestedAdapterCode: '// adapter code',
        rationale: 'Breaking currency drift migration',
        createdAt: new Date().toISOString(),
      });

      const res = await app.inject({
        method: 'POST',
        url: `/apply/${proposalId}`,
        payload: { confirm: true },
      });

      expect(res.statusCode).toBe(200);
      const data = res.json();
      expect(data.success).toBe(true);
      expect(data.proposal.status).toBe('approved');

      // Verify internal state in engine
      expect(pipeline.proposals.get(proposalId)?.status).toBe('approved');
    });
  });

  describe('GET /events Edge Cases', () => {
    it("Content-Type is 'text/event-stream' and response starts with 'data: {'", async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/events',
      });

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('text/event-stream');
      expect(res.headers['cache-control']).toBe('no-cache');
      expect(res.body.startsWith('data: {')).toBe(true);

      const jsonStr = res.body.replace(/^data:\s*/, '').trim();
      const parsed = JSON.parse(jsonStr);
      expect(parsed.type).toBe('INIT');
      expect(typeof parsed.changesCount).toBe('number');
      expect(parsed.timestamp).toBeDefined();
    });
  });

  describe('GET /health Edge Cases', () => {
    it('returns 200 with ok status and rateLimitHeadroom', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.status).toBe('ok');
      expect(typeof body.uptime).toBe('number');
      expect(body.dependencies).toBeDefined();
      expect(body.dependencies.users).toBe('healthy');
      expect(body.dependencies.payments).toBe('healthy');

      // Verify rateLimitHeadroom
      expect(body.rateLimitHeadroom).toBeDefined();
      expect(typeof body.rateLimitHeadroom.payments).toBe('number');
      expect(body.rateLimitHeadroom.payments).toBeGreaterThan(0);
      expect(typeof body.rateLimitHeadroom.search).toBe('number');
      expect(body.rateLimitHeadroom.search).toBeGreaterThan(0);
    });
  });

  describe('Additional API Endpoints (/changes, /adapters, /proposals, /pipeline/run)', () => {
    it('GET /changes returns current detected changes', async () => {
      const res = await app.inject({ method: 'GET', url: '/changes' });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ changes: [] });
    });

    it('GET /adapters returns registered adapters', async () => {
      const res = await app.inject({ method: 'GET', url: '/adapters' });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ adapters: [] });
    });

    it('GET /proposals returns proposals list', async () => {
      const res = await app.inject({ method: 'GET', url: '/proposals' });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ proposals: [] });
    });

    it('POST /pipeline/run executes pipeline via HTTP', async () => {
      const res = await app.inject({ method: 'POST', url: '/pipeline/run' });
      expect(res.statusCode).toBe(200);
      const data = res.json();
      expect(data.success).toBe(true);
      expect(data.result).toBeDefined();
      expect(data.result.observationsCount).toBe(0);
    });
  });
});

describe('Concurrency & Rapid Burst Edge Cases', () => {
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

  it('handles rapid concurrent observation bursts across multiple endpoints', async () => {
    const burstPromises = Array.from({ length: 20 }, (_, i) => {
      return app.inject({
        method: 'POST',
        url: '/observe',
        payload: {
          id: `obs_burst_${i}`,
          service: i % 2 === 0 ? 'payments' : 'search',
          endpoint: i % 2 === 0 ? '/payments' : '/search',
          method: 'POST',
          status: 200,
          headers: { 'x-request-id': `req_${i}` },
          body: { id: `item_${i}`, amount: 10 + i },
          latencyMs: 5 + (i % 10),
          timestamp: new Date().toISOString(),
        },
      });
    });

    const responses = await Promise.all(burstPromises);
    for (const res of responses) {
      expect(res.statusCode).toBe(201);
    }

    expect(pipeline.collector.getAll().length).toBe(20);

    // Run pipeline
    const runRes = await app.inject({ method: 'POST', url: '/pipeline/run' });
    expect(runRes.statusCode).toBe(200);
    expect(runRes.json().result.observationsCount).toBe(20);
  });
});

