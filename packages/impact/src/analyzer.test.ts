import { describe, it, expect } from 'vitest';
import { ImpactAnalyzer } from './analyzer.js';
import { extractPropertyAccesses } from './ast.js';
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

  describe('AST Property Access Extraction', () => {
    it('extracts nested dot-access chains from TypeScript source code', () => {
      const source = `
        import axios from 'axios';
        async function fetchPayment(id: string) {
          const res = await axios.get('/api/v1/charges/' + id);
          const amount = res.data.charge.amount;
          const currency = res.data.charge.currency;
          return { amount, currency };
        }
      `;

      const accesses = extractPropertyAccesses(source, ['res']);
      expect(accesses.length).toBeGreaterThanOrEqual(2);
      const fields = accesses.map((a) => a.fieldPath);
      expect(fields).toContain('data.charge.amount');
      expect(fields).toContain('data.charge.currency');

      const amountAccess = accesses.find((a) => a.fieldPath === 'data.charge.amount');
      expect(amountAccess?.line).toBe(5);
    });

    it('extracts object destructuring expressions with line tracking', () => {
      const source = `
        function handleUser(payload: any) {
          const { id, name, role } = payload.data;
          console.log(id, name, role);
        }
      `;

      const accesses = extractPropertyAccesses(source, ['payload']);
      expect(accesses.length).toBeGreaterThanOrEqual(3);
      const fields = accesses.map((a) => a.fieldPath);
      expect(fields).toContain('data.id');
      expect(fields).toContain('data.name');
      expect(fields).toContain('data.role');
    });
  });
});

