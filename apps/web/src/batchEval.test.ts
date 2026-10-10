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

  it('executes a 50-sample batch verification with logs, policy distributions, and SHA-256 seal', async () => {
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
    expect(report.equivalencePassRate).toBeGreaterThanOrEqual(70);
    expect(report.accuracyScore).toBeGreaterThanOrEqual(70);

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
  });

  it('validates BridgeKey wallet configuration on MST Blockchain Testnet', () => {
    expect(MST_CHAIN_ID_DEC).toBe(91562037);
    expect(MST_CHAIN_ID_HEX).toBe('0x5752035');
  });
});
