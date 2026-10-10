import { describe, it, expect } from 'vitest';
import {
  ChangeSchema,
  ObservationSchema,
  ContractSchema,
  ImpactSchema,
  AdapterSchema,
  type Change,
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
});
