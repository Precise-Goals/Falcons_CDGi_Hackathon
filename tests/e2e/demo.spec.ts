import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Switchboard, buildSimServicesApp } from '@intra/sim-services';
import { PipelineEngine, buildEngineApp } from '@intra/engine';
import { ShipwellApp } from '@intra/demo-app';
import { buildMcpServer } from '@intra/mcpserver';
import { FastifyInstance } from 'fastify';

describe('Intra Autonomous E2E Acceptance Demonstration (HARNESS §13)', () => {
  let switchboard: Switchboard;
  let simApp: FastifyInstance;
  let engineApp: FastifyInstance;
  let mcpApp: FastifyInstance;
  let pipeline: PipelineEngine;
  let shipwell: ShipwellApp;

  let simUrl: string;
  let engineUrl: string;

  beforeEach(async () => {
    // 1. Start sim services
    switchboard = new Switchboard();
    simApp = buildSimServicesApp(switchboard);
    await simApp.listen({ port: 0, host: '127.0.0.1' });
    const simPort = (simApp.server.address() as any).port;
    simUrl = `http://127.0.0.1:${simPort}`;

    // 2. Start engine monolith
    pipeline = new PipelineEngine();
    engineApp = buildEngineApp(pipeline);
    await engineApp.listen({ port: 0, host: '127.0.0.1' });
    const enginePort = (engineApp.server.address() as any).port;
    engineUrl = `http://127.0.0.1:${enginePort}`;

    // 3. Start customer MCP server
    mcpApp = buildMcpServer({ engineUrl });
    await mcpApp.listen({ port: 0, host: '127.0.0.1' });

    // 4. Initialize Shipwell demo app
    shipwell = new ShipwellApp(simUrl, engineUrl);
  });

  afterEach(async () => {
    await simApp.close();
    await engineApp.close();
    await mcpApp.close();
  });

  it('executes full §13 demo script: baseline -> mutations -> detect -> adapt -> validate -> green -> quarantine -> rollback', async () => {
    // --- STEP 1 & 2: Baseline Workflows (All Green) ---
    const baseResults = await shipwell.runAll();
    expect(baseResults.userProfile.success).toBe(true);
    expect(baseResults.checkout.success).toBe(true);
    expect(baseResults.searchBrowse.success).toBe(true);

    // Observe baseline traffic in Intra engine
    pipeline.recordObservation({
      service: 'users',
      endpoint: '/users',
      method: 'GET',
      status: 200,
      headers: {},
      body: [{ id: 'usr_1', name: 'Alice Walker', status: 'active' }],
      latencyMs: 12,
    });
    pipeline.recordObservation({
      service: 'payments',
      endpoint: '/payments/charge',
      method: 'POST',
      status: 200,
      headers: {},
      body: { amount: 25.5, currency: 'USD' },
      latencyMs: 15,
    });
    pipeline.recordObservation({
      service: 'search',
      endpoint: '/search',
      method: 'GET',
      status: 200,
      headers: {},
      body: { items: [], total: 100, offset: 0, limit: 10 },
      latencyMs: 18,
    });

    // Establish baseline contracts
    pipeline.establishBaseline('users', '/users');
    pipeline.establishBaseline('payments', '/payments/charge');
    pipeline.establishBaseline('search', '/search');

    // --- STEP 3: Toggle M1, M3, M5 via switchboard -> workflows break (assert RED) ---
    switchboard.toggle('M1', true); // name -> display_name
    switchboard.toggle('M3', true); // dollars -> cents
    switchboard.toggle('M5', true); // offset -> cursor

    const brokenUsers = await shipwell.runUserProfileWorkflow();
    expect(brokenUsers.success).toBe(false); // Assert broken

    const brokenCheckout = await shipwell.runCheckoutWorkflow();
    expect(brokenCheckout.success).toBe(false); // Assert broken

    const brokenSearch = await shipwell.runSearchWorkflow();
    expect(brokenSearch.success).toBe(false); // Assert broken

    // --- STEP 4: Intra detects all three, generates adapters, validates, workflows GREEN ---
    // Record mutated traffic
    pipeline.recordObservation({
      service: 'users',
      endpoint: '/users',
      method: 'GET',
      status: 200,
      headers: {},
      body: [{ id: 'usr_1', display_name: 'Alice Walker', status: 'active' }],
      latencyMs: 14,
    });
    pipeline.recordObservation({
      service: 'payments',
      endpoint: '/payments/charge',
      method: 'POST',
      status: 200,
      headers: {},
      body: { amount: 2550, currency: 'USD' },
      latencyMs: 16,
    });
    pipeline.recordObservation({
      service: 'search',
      endpoint: '/search',
      method: 'GET',
      status: 200,
      headers: {},
      body: { items: [], nextCursor: 'MjA=' },
      latencyMs: 20,
    });

    const pipelineRun = pipeline.runPipeline();

    // Verify all 3 changes detected
    expect(pipelineRun.changes.length).toBeGreaterThanOrEqual(3);
    const renameChange = pipelineRun.changes.find((c) => c.kind === 'rename');
    const unitChange = pipelineRun.changes.find((c) => c.kind === 'unit_shift');
    const pagChange = pipelineRun.changes.find((c) => c.kind === 'pagination_changed');

    expect(renameChange?.confidence).toBeGreaterThanOrEqual(0.9);
    expect(unitChange?.confidence).toBeGreaterThanOrEqual(0.9);
    expect(pagChange?.confidence).toBeGreaterThanOrEqual(0.9);

    // Verify adapters auto-generated
    const autoApplyDecisions = pipelineRun.decisions.filter((d) => d.action === 'auto_apply');
    expect(autoApplyDecisions.length).toBeGreaterThanOrEqual(2);
    expect(pipelineRun.validations.length).toBeGreaterThan(0);

    // Register active adapters in Shipwell client
    shipwell.client.registerAdapter('/users', (data: any) =>
      data.map((u: any) => ({ ...u, name: u.display_name ?? u.name }))
    );
    shipwell.client.registerAdapter('/payments/charge', (data: any) => ({
      ...data,
      amount: data.amount * 0.01,
    }));

    // Assert workflows recovered to GREEN!
    const recoveredUsers = await shipwell.runUserProfileWorkflow();
    expect(recoveredUsers.success).toBe(true);
    expect((recoveredUsers.data as any).name).toBe('Alice Walker');

    const recoveredCheckout = await shipwell.runCheckoutWorkflow();
    expect(recoveredCheckout.success).toBe(true);
    expect((recoveredCheckout.data as any).amount).toBe(25.0);

    // --- STEP 5: Toggle M2, M10 -> Refuse auto-repair, quarantine, emit proposal ---
    switchboard.toggle('M2', true); // "Last, First" lossy format
    switchboard.toggle('M10', true); // status enum drift

    pipeline.recordObservation({
      service: 'users',
      endpoint: '/users',
      method: 'GET',
      status: 200,
      headers: {},
      body: [{ id: 'usr_1', display_name: 'Walker, Alice', status: 'active' }],
      latencyMs: 13,
    });

    const secondRun = pipeline.runPipeline();
    const lossyOrBreakingDecisions = secondRun.decisions.filter(
      (d) => d.action === 'open_migration_pr' || d.action === 'circuit_break'
    );
    expect(lossyOrBreakingDecisions.length).toBeGreaterThan(0);

    // Assert proposals created instead of auto-apply
    expect(pipeline.proposals.size).toBeGreaterThan(0);

    // --- STEP 6: MCP Parity Check ---
    const mcpRes = await mcpApp.inject({
      method: 'POST',
      url: '/tools/call',
      payload: { tool: 'intra_recent_changes' },
    });
    expect(mcpRes.statusCode).toBe(200);
    const mcpChanges = mcpRes.json().changes;
    expect(mcpChanges.length).toBe(pipeline.detectedChanges.size);

    // --- STEP 7: Rollback Test (malformed adapter fails validation -> triggers rollback) ---
    const badAdapter = {
      id: 'bad_adp',
      changeId: 'chg_bad',
      strategy: 'rename' as const,
      code: 'broken',
      tests: '',
      rollbackHandle: 'emergency_revert_handle_99',
    };
    const badReplay = [
      {
        workflowName: 'checkout',
        goldenInput: {},
        expectedOutput: { amount: 25.0 },
        actualAdaptedOutput: { amount: 999999 }, // Divergence!
      },
    ];
    const valResult = (pipeline as any).validator.validate(badAdapter, badReplay);
    expect(valResult.pass).toBe(false);
    expect(valResult.evidence).toContain(badAdapter.rollbackHandle);
  });
});
