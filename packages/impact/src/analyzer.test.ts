import { describe, it, expect } from 'vitest';
import { ImpactAnalyzer } from './analyzer.js';
import { Change } from '@intra/shared';

describe('@intra/impact Blast Radius & Dependency Mapping', () => {
  it('determines affected workflows when name field is renamed', () => {
    const analyzer = new ImpactAnalyzer();
    const change: Change = {
      id: 'chg_rename_name',
      service: 'users',
      endpoint: '/users',
      kind: 'rename',
      documented: false,
      before: { field: 'name' },
      after: { field: 'display_name' },
      evidence: { samples: [], stats: {} },
      semanticVerdict: 'equivalent',
      confidence: 0.95,
      detectedAt: new Date().toISOString(),
    };

    const impact = analyzer.analyze(change);
    expect(impact.affectedWorkflows).toContain('userProfile');
    expect(impact.fieldPaths).toContain('users.name');
    expect(impact.severity).toBe('low');
  });

  it('rates breaking enum changes as critical severity', () => {
    const analyzer = new ImpactAnalyzer();
    const change: Change = {
      id: 'chg_enum_m10',
      service: 'users',
      endpoint: '/users',
      kind: 'enum_semantics',
      documented: false,
      before: {},
      after: {},
      evidence: { samples: [], stats: {} },
      semanticVerdict: 'breaking',
      confidence: 0.8,
      detectedAt: new Date().toISOString(),
    };

    const impact = analyzer.analyze(change);
    expect(impact.severity).toBe('critical');
    expect(impact.affectedWorkflows).toContain('userProfile');
  });
});
