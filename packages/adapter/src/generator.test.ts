import { describe, it, expect } from 'vitest';
import { SafeHandlingEngine } from './generator.js';
import { Change } from '@intra/shared';

describe('@intra/adapter Safe-Handling Policy Engine', () => {
  const engine = new SafeHandlingEngine();

  it('auto-applies adapter for high-confidence equivalent change (M1, M3, M5)', () => {
    const change: Change = {
      id: 'chg_m1_test',
      service: 'users',
      endpoint: '/users',
      kind: 'rename',
      documented: false,
      before: { field: 'name' },
      after: { field: 'display_name' },
      evidence: { samples: ['1'], stats: {} },
      semanticVerdict: 'equivalent',
      confidence: 0.95,
      detectedAt: new Date().toISOString(),
    };

    const decision = engine.evaluate(change);
    expect(decision.action).toBe('auto_apply');
    expect(decision.adapter).toBeDefined();
    expect(decision.adapter?.strategy).toBe('rename');
    expect(decision.rollbackHandle).toBeDefined();
    expect(decision.proposal).toBeUndefined();
  });

  it('generates migration PR for lossy semantic format change (M2)', () => {
    const change: Change = {
      id: 'chg_m2_test',
      service: 'users',
      endpoint: '/users',
      kind: 'semantic_other',
      documented: false,
      before: { format: 'First Last' },
      after: { format: 'Last, First' },
      evidence: { samples: ['1'], stats: {} },
      semanticVerdict: 'lossy',
      confidence: 0.82,
      detectedAt: new Date().toISOString(),
    };

    const decision = engine.evaluate(change);
    expect(decision.action).toBe('open_migration_pr');
    expect(decision.proposal).toBeDefined();
    expect(decision.proposal?.status).toBe('pending');
  });

  it('trips circuit breaker for breaking enum drift with no mapping (M10)', () => {
    const change: Change = {
      id: 'chg_m10_test',
      service: 'users',
      endpoint: '/users',
      kind: 'enum_semantics',
      documented: false,
      before: {},
      after: {},
      evidence: { samples: ['1'], stats: {} },
      semanticVerdict: 'breaking',
      confidence: 0.75,
      detectedAt: new Date().toISOString(),
    };

    const decision = engine.evaluate(change);
    expect(decision.action).toBe('circuit_break');
    expect(decision.adapter).toBeUndefined();
    expect(decision.proposal).toBeDefined();
  });

  it('quarantines low confidence change (<0.70)', () => {
    const change: Change = {
      id: 'chg_low_conf',
      service: 'unknown',
      endpoint: '/unknown',
      kind: 'semantic_other',
      documented: false,
      before: {},
      after: {},
      evidence: { samples: [], stats: {} },
      semanticVerdict: 'equivalent',
      confidence: 0.55,
      detectedAt: new Date().toISOString(),
    };

    const decision = engine.evaluate(change);
    expect(decision.action).toBe('quarantine_alert');
    expect(decision.adapter).toBeUndefined();
  });
});
