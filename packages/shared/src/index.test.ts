import { describe, it, expect } from 'vitest';
import {
  ChangeSchema,
  ObservationSchema,
  ContractSchema,
  ImpactSchema,
  AdapterSchema,
  ChangeSetRollupSchema,
  rollupChangeSet,
  type Change,
  type Impact,
  type Observation,
} from './index.js';

describe('@intra/shared Domain Types & Schemas', () => {
  it('validates a well-formed Observation record', () => {
    const observation: Observation = {
      id: 'obs-001',
      service: 'users',
      endpoint: '/users',
      method: 'GET',
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: [{ id: 'u1', name: 'Alice' }],
      latencyMs: 12,
      timestamp: '2026-10-10T19:00:00.000Z',
    };

    const parsed = ObservationSchema.safeParse(observation);
    expect(parsed.success).toBe(true);
  });

  it('validates a Change record with confidence and semantic verdict', () => {
    const change: Change = {
      id: 'chg-001',
      service: 'users',
      endpoint: '/users',
      kind: 'rename',
      documented: false,
      before: { name: 'Alice' },
      after: { display_name: 'Alice' },
      evidence: {
        samples: ['obs-001', 'obs-002'],
        stats: { valueOverlap: 0.98 },
      },
      semanticVerdict: 'equivalent',
      confidence: 0.95,
      detectedAt: '2026-10-10T19:05:00.000Z',
    };

    const parsed = ChangeSchema.safeParse(change);
    expect(parsed.success).toBe(true);
  });

  it('rejects an invalid Change record with out-of-bound confidence', () => {
    const invalid = {
      id: 'chg-bad',
      service: 'users',
      endpoint: '/users',
      kind: 'rename',
      documented: false,
      before: {},
      after: {},
      evidence: { samples: [], stats: {} },
      semanticVerdict: 'equivalent',
      confidence: 1.5, // invalid: max 1
      detectedAt: '2026-10-10T19:05:00.000Z',
    };

    const parsed = ChangeSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('validates Impact analysis and Adapter definitions', () => {
    const impact = {
      changeId: 'chg-001',
      affectedWorkflows: ['checkout', 'userProfile'],
      fieldPaths: ['user.name'],
      severity: 'high' as const,
      dependencyChain: ['apps/demo-app/src/user.ts:line 42'],
    };

    expect(ImpactSchema.safeParse(impact).success).toBe(true);

    const adapter = {
      id: 'adp-001',
      changeId: 'chg-001',
      strategy: 'rename' as const,
      code: 'function adapt(res) { res.name = res.display_name; return res; }',
      tests: 'it("renames display_name back to name", () => { ... })',
      rollbackHandle: 'handle_adp_001_revert',
    };

    expect(AdapterSchema.safeParse(adapter).success).toBe(true);
  });

  describe('ChangeSet Rollup & Confidence Weighting', () => {
    it('generates an empty rollup when no changes exist', () => {
      const rollup = rollupChangeSet('payment-service', '/charges', []);
      expect(rollup.totalChanges).toBe(0);
      expect(rollup.highestSeverity).toBe('low');
      expect(rollup.hasBreakingChanges).toBe(false);
      expect(rollup.averageConfidence).toBe(1.0);
      expect(ChangeSetRollupSchema.safeParse(rollup).success).toBe(true);
    });

    it('aggregates multiple changes, calculates average confidence, and dedupes samples', () => {
      const changes: Change[] = [
        {
          id: 'c1',
          service: 'payment-service',
          endpoint: '/charges',
          kind: 'rename',
          documented: false,
          before: { amount: 10 },
          after: { charge_amount: 10 },
          evidence: { samples: ['obs-1', 'obs-2'], stats: {} },
          semanticVerdict: 'equivalent',
          confidence: 0.9,
          detectedAt: '2026-10-10T00:00:00Z',
        },
        {
          id: 'c2',
          service: 'payment-service',
          endpoint: '/charges',
          kind: 'unit_shift',
          documented: false,
          before: { amount: 10 },
          after: { amount: 1000 },
          evidence: { samples: ['obs-2', 'obs-3'], stats: {} },
          semanticVerdict: 'breaking',
          confidence: 0.8,
          detectedAt: '2026-10-10T00:01:00Z',
        },
      ];

      const impacts: Impact[] = [
        {
          changeId: 'c2',
          affectedWorkflows: ['billing'],
          fieldPaths: ['amount'],
          severity: 'critical',
          dependencyChain: ['billing.ts'],
        },
      ];

      const rollup = rollupChangeSet('payment-service', '/charges', changes, impacts);
      expect(rollup.totalChanges).toBe(2);
      expect(rollup.hasBreakingChanges).toBe(true);
      expect(rollup.highestSeverity).toBe('critical');
      expect(rollup.averageConfidence).toBe(0.85);
      expect(rollup.changesByKind.rename).toBe(1);
      expect(rollup.changesByKind.unit_shift).toBe(1);
      expect(rollup.samplesSummary).toHaveLength(3);
      expect(rollup.samplesSummary).toContain('obs-1');
      expect(rollup.samplesSummary).toContain('obs-2');
      expect(rollup.samplesSummary).toContain('obs-3');

      expect(ChangeSetRollupSchema.safeParse(rollup).success).toBe(true);
    });
  });
});

