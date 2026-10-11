import { describe, it, expect } from 'vitest';
import {
  ImpactAnalyzer,
  isFinancialOrPaymentRoute,
  annotateCriticality,
  generateImpactSummary,
} from './analyzer.js';
import { extractPropertyAccesses } from './ast.js';
import { CallGraphTracer } from './callgraph.js';
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

  describe('Call Graph Downstream Dependency Tracing', () => {
    it('traces multi-hop downstream dependencies in linear workflow chains', () => {
      const tracer = new CallGraphTracer();
      tracer.addEdge('checkout', 'paymentGateway');
      tracer.addEdge('paymentGateway', 'stripeProxy');
      tracer.addEdge('stripeProxy', 'bankLedger');

      const downstream = tracer.traceDownstream('checkout');
      expect(downstream).toHaveLength(3);
      expect(downstream).toContain('paymentGateway');
      expect(downstream).toContain('stripeProxy');
      expect(downstream).toContain('bankLedger');

      const chain = tracer.findHopChain('checkout', 'bankLedger');
      expect(chain).toEqual(['checkout', 'paymentGateway', 'stripeProxy', 'bankLedger']);
    });

    it('handles cyclic dependencies gracefully without infinite recursion', () => {
      const tracer = new CallGraphTracer();
      tracer.addEdge('serviceA', 'serviceB');
      tracer.addEdge('serviceB', 'serviceC');
      tracer.addEdge('serviceC', 'serviceA'); // cycle

      const reachable = tracer.traceDownstream('serviceA');
      expect(reachable).toContain('serviceB');
      expect(reachable).toContain('serviceC');
    });

    it('returns null when target node is disconnected', () => {
      const tracer = new CallGraphTracer();
      tracer.addEdge('orderService', 'inventoryService');

      const path = tracer.findHopChain('orderService', 'unrelatedService');
      expect(path).toBeNull();
    });
  });

  describe('Financial Route Criticality Annotation', () => {
    it('detects sensitive payment and billing pathways', () => {
      expect(isFinancialOrPaymentRoute('payments', '/payments/charge')).toBe(true);
      expect(isFinancialOrPaymentRoute('billing', '/invoices/tax')).toBe(true);
      expect(isFinancialOrPaymentRoute('search', '/items/query')).toBe(false);
    });

    it('asserts critical severity rating on payment charge routes with medium/high verdict', () => {
      const analyzer = new ImpactAnalyzer({ escalateFinancialRoutes: true });
      const change: Change = {
        id: 'chg_pay_01',
        service: 'payments',
        endpoint: '/payments/charge',
        kind: 'unit_shift',
        before: { field: 'amount', unit: 'cents' },
        after: { field: 'amount', unit: 'dollars' },
        semanticVerdict: 'lossy',
        confidence: 0.99,
        timestamp: new Date().toISOString(),
      };

      const result = analyzer.analyze(change);
      expect(result.severity).toBe('critical');
      expect(result.affectedWorkflows).toContain('checkout');
    });

    it('elevates medium severity to critical for financial endpoints', () => {
      expect(annotateCriticality('payments', '/payments/charge', 'medium')).toBe('critical');
      expect(annotateCriticality('payments', '/payments/charge', 'high')).toBe('critical');
      expect(annotateCriticality('search', '/search/query', 'medium')).toBe('medium');
    });

    it('generates structured ImpactSummary JSON aggregating multiple impacts', () => {
      const summary = generateImpactSummary([
        {
          changeId: 'c1',
          affectedWorkflows: ['checkout', 'userProfile'],
          fieldPaths: ['payments.amount'],
          severity: 'critical',
          dependencyChain: [],
        },
        {
          changeId: 'c2',
          affectedWorkflows: ['checkout'],
          fieldPaths: ['payments.currency'],
          severity: 'low',
          dependencyChain: [],
        },
      ]);

      expect(summary.totalImpacts).toBe(2);
      expect(summary.criticalCount).toBe(1);
      expect(summary.lowCount).toBe(1);
      expect(summary.highCount).toBe(0);
      expect(summary.affectedWorkflows).toEqual(['checkout', 'userProfile']);
      expect(summary.generatedAt).toBeDefined();
    });
  });
});


