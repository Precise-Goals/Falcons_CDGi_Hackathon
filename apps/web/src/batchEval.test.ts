import { describe, it, expect } from 'vitest';
import { generateRandomApiBatch, analyzeSchemaPredictability } from './lib/apiGenerator';
import { runBatchEvaluation } from './lib/evalEngine';
import { MST_CHAIN_ID_DEC, MST_CHAIN_ID_HEX } from './lib/mstWallet';

describe('High-Volume Multi-Sample Verification Suite (50-60 APIs)', () => {
  it('generates a batch of 55 unique procedural schemas with varied mutation kinds and domains', () => {
    const batch = generateRandomApiBatch(55);
    expect(batch).toHaveLength(55);

    const domains = new Set(batch.map((s) => s.domain));
    expect(domains.size).toBeGreaterThanOrEqual(8);

    const mutationTypes = new Set(batch.map((s) => s.mutationType));
    expect(mutationTypes.size).toBeGreaterThanOrEqual(4);

    for (const sample of batch) {
      expect(sample.id).toMatch(/^api_sample_\d{2}$/);
      expect(sample.baselinePayload).toBeDefined();
      expect(sample.mutatedPayload).toBeDefined();
      expect(sample.predictability).toBeDefined();
      expect(sample.predictability.score).toBeGreaterThanOrEqual(0);
      expect(sample.predictability.score).toBeLessThanOrEqual(100);
    }
  });

  it('accurately predicts future schema upgrades across float units, camelCase, and pagination', () => {
    const testPayload = {
      amount: 49.95,
      customerId: 'cus_991',
      customer_name: 'John Doe',
      page: 1,
      status: 'active',
      metadata: { risk_score: 0.12 },
      event: { type: 'charge.succeeded' },
    };

    const analysis = analyzeSchemaPredictability(testPayload, 'https://api.stripe.com/v1/charges');
    expect(analysis.score).toBeGreaterThanOrEqual(60);
    expect(analysis.riskLevel).toBe('CRITICAL');

    const categories = analysis.findings.map((f) => f.category);
    expect(categories).toContain('Unit Shift');
    expect(categories).toContain('Casing Drift');
    expect(categories).toContain('Pagination Deprecation');
    expect(categories).toContain('Enum Semantic Widening');
    expect(categories).toContain('Envelope Flattening');
  });

  it(
    'executes a 50-sample batch verification with logs, policy distributions, and SHA-256 seal',
    async () => {
    const batch = generateRandomApiBatch(50);
    let progressUpdates = 0;

    const report = await runBatchEvaluation(batch, () => {
      progressUpdates++;
    });

    expect(report.totalSamples).toBe(50);
    expect(report.completedSamples).toBe(50);
    expect(progressUpdates).toBe(50);

    // Score validations
    expect(report.averageConfidence).toBeGreaterThanOrEqual(70);
    expect(report.averagePredictabilityScore).toBeGreaterThanOrEqual(50);
    expect(report.equivalencePassRate).toBeGreaterThanOrEqual(50);
    expect(report.accuracyScore).toBeGreaterThanOrEqual(65);

    // Section 10 Policy Distribution sums to 50
    const policySum =
      report.policyBreakdown.auto_apply +
      report.policyBreakdown.open_migration_pr +
      report.policyBreakdown.circuit_break +
      report.policyBreakdown.quarantine_alert;
    expect(policySum).toBe(50);

    // Predicted changes summary populated
    const changes = report.predictedChangesSummary;
    expect(
      changes.unitShiftsPredicted +
      changes.casingDriftsPredicted +
      changes.paginationChangesPredicted +
      changes.enumWideningsPredicted +
      changes.flatteningsPredicted
    ).toBeGreaterThan(0);

    // Cryptographic audit seal minted
    expect(report.batchSha256Digest).toHaveLength(64);
    expect(report.batchSha256Digest).toMatch(/^[0-9a-f]{64}$/);

    // Logs populated
    expect(report.logs.length).toBeGreaterThanOrEqual(50);
  }, 60000);

  it('validates BridgeKey wallet configuration on MST Blockchain Testnet', () => {
    expect(MST_CHAIN_ID_DEC).toBe(91562037);
    expect(MST_CHAIN_ID_HEX).toBe('0x5752035');
  });

  it('executes a live connected evaluation with engine observation, MCP tools, SDK adapter, and SHA-256 seal', async () => {
    const { generateRandomApi } = await import('./lib/apiGenerator');
    const { runDynamicEvaluation } = await import('./lib/evalEngine');

    const sample = generateRandomApi(1); // M1: rename
    const result = await runDynamicEvaluation(sample);

    // Stage 1 (OBSERVE)
    const observeLogs = result.logs.filter((l) => l.stage === 'OBSERVE');
    expect(observeLogs.length).toBeGreaterThanOrEqual(1);

    // Stage 4 (MCP)
    expect(result.mcpLiveOutput).toBeDefined();
    expect(result.mcpLiveOutput.contract).toBeDefined();
    expect(result.mcpLiveOutput.recentChanges).toBeDefined();
    expect(result.mcpLiveOutput.toolsExecuted).toContain('intra_get_contract');
    expect(result.mcpLiveOutput.toolsExecuted).toContain('intra_recent_changes');

    // Stage 6 (ADAPTER & SDK)
    expect(result.synthesizedAdapter).toContain('export function adaptResponse');
    const adapterLogs = result.logs.filter((l) => l.stage === 'ADAPTER');
    expect(adapterLogs.length).toBeGreaterThanOrEqual(1);

    // Stage 8 (VALIDATE)
    expect(result.validationPassed).toBe(true);

    // Stage 9 (LEDGER)
    expect(result.sha256Digest).toHaveLength(64);
    expect(result.sha256Digest).toMatch(/^[0-9a-f]{64}$/);
  });
});
