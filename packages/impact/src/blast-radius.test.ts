import { describe, it, expect, beforeEach } from 'vitest';
import { ImpactAnalyzer, type WorkflowDependency } from './analyzer.js';
import {
  ImpactSchema,
  type Change,
  type ChangeKind,
  type SemanticVerdict,
} from '@intra/shared';

describe('@intra/impact Blast Radius & AST Dependency Graph Test Suite', () => {
  let analyzer: ImpactAnalyzer;

  const buildChange = (overrides?: Partial<Change>): Change => ({
    id: 'chg_blast_001',
    service: 'payments',
    endpoint: '/payments/charge',
    kind: 'rename',
    documented: false,
    before: { field: 'amount' },
    after: { field: 'charged_amount' },
    evidence: {
      samples: ['obs_payload_001', 'obs_payload_002'],
      stats: { errorRateDelta: 0.05, latencyP95DeltaMs: 12 },
    },
    semanticVerdict: 'breaking',
    confidence: 0.98,
    detectedAt: '2026-10-10T15:00:00.000Z',
    ...overrides,
  });

  beforeEach(() => {
    analyzer = new ImpactAnalyzer();
  });

  // =========================================================================
  // 1. Custom Dependency Registration & Case-Insensitivity
  // =========================================================================
  describe('1. Custom Dependency Registration & Case-Insensitivity', () => {
    it('registers an arbitrary custom workflow and successfully retrieves it in impact analysis', () => {
      const customDep: WorkflowDependency = {
        workflowName: 'inventoryAudit',
        service: 'warehouse',
        endpoint: '/inventory/check',
        usedFields: ['sku', 'quantity', 'warehouse_id'],
        filePath: 'apps/logistics/src/workflows/audit.ts',
      };
      analyzer.registerDependency(customDep);

      const change = buildChange({
        id: 'chg_inventory_qty',
        service: 'warehouse',
        endpoint: '/inventory/check',
        kind: 'type_changed',
        before: { field: 'quantity' },
        after: { field: 'quantity' },
        semanticVerdict: 'equivalent',
      });

      const impact = analyzer.analyze(change);
      expect(impact.affectedWorkflows).toEqual(['inventoryAudit']);
      expect(impact.fieldPaths).toEqual(['warehouse.quantity']);
      expect(impact.dependencyChain).toContain(
        'apps/logistics/src/workflows/audit.ts -> depends on [warehouse:/inventory/check]'
      );
      expect(impact.severity).toBe('low');
    });

    it('matches service and endpoint case-insensitively when registration is uppercase and change is lowercase', () => {
      analyzer.registerDependency({
        workflowName: 'corporateBilling',
        service: 'PAYMENTS',
        endpoint: '/PAYMENTS/CHARGE',
        usedFields: ['amount', 'invoice_id'],
        filePath: 'apps/enterprise/src/billing.ts',
      });

      const change = buildChange({
        service: 'payments',
        endpoint: '/payments/charge',
        before: { field: 'invoice_id' },
        semanticVerdict: 'equivalent',
      });

      const impact = analyzer.analyze(change);
      expect(impact.affectedWorkflows).toContain('corporateBilling');
    });

    it('matches service and endpoint case-insensitively when registration is lowercase and change is UPPERCASE', () => {
      analyzer.registerDependency({
        workflowName: 'fraudScanner',
        service: 'fraud-engine',
        endpoint: '/risk/evaluate',
        usedFields: ['ip_address', 'device_fingerprint'],
        filePath: 'apps/security/src/scanner.ts',
      });

      const change = buildChange({
        service: 'FRAUD-ENGINE',
        endpoint: '/RISK/EVALUATE',
        before: { field: 'device_fingerprint' },
        semanticVerdict: 'breaking',
      });

      const impact = analyzer.analyze(change);
      expect(impact.affectedWorkflows).toContain('fraudScanner');
      expect(impact.dependencyChain).toContain(
        'apps/security/src/scanner.ts -> depends on [fraud-engine:/risk/evaluate]'
      );
    });

    it('matches service and endpoint with mixed-case variations', () => {
      analyzer.registerDependency({
        workflowName: 'kycVerification',
        service: 'IdentityVerification',
        endpoint: '/Api/V2/KycStatus',
        usedFields: ['status', 'document_id'],
        filePath: 'services/kyc/verifier.ts',
      });

      const change = buildChange({
        service: 'iDeNtItYvErIfIcAtIoN',
        endpoint: '/aPi/v2/kYcStAtUs',
        before: { field: 'document_id' },
        semanticVerdict: 'lossy',
      });

      const impact = analyzer.analyze(change);
      expect(impact.affectedWorkflows).toEqual(['kycVerification']);
      expect(impact.severity).toBe('high');
    });

    it('supports registering multiple distinct workflows on the same endpoint', () => {
      analyzer.registerDependency({
        workflowName: 'orderProcessor',
        service: 'orders',
        endpoint: '/orders/submit',
        usedFields: ['order_id', 'items'],
        filePath: 'apps/orders/processor.ts',
      });
      analyzer.registerDependency({
        workflowName: 'orderAnalytics',
        service: 'orders',
        endpoint: '/orders/submit',
        usedFields: ['order_id', 'total_amount'],
        filePath: 'apps/analytics/orders.ts',
      });

      // Change on shared field order_id
      const sharedChange = buildChange({
        service: 'orders',
        endpoint: '/orders/submit',
        before: { field: 'order_id' },
        semanticVerdict: 'equivalent',
      });

      const impact = analyzer.analyze(sharedChange);
      expect(impact.affectedWorkflows).toHaveLength(2);
      expect(impact.affectedWorkflows).toContain('orderProcessor');
      expect(impact.affectedWorkflows).toContain('orderAnalytics');
      // >= 2 affected workflows escalates severity to high even if equivalent
      expect(impact.severity).toBe('high');
    });

    it('deduplicates workflowName if the same workflow is registered multiple times on the same endpoint', () => {
      analyzer.registerDependency({
        workflowName: 'checkout',
        service: 'payments',
        endpoint: '/payments/charge',
        usedFields: ['amount'],
        filePath: 'apps/demo-app/src/workflows/checkout-part1.ts',
      });

      const change = buildChange({
        service: 'payments',
        endpoint: '/payments/charge',
        before: { field: 'amount' },
        semanticVerdict: 'equivalent',
      });

      const impact = analyzer.analyze(change);
      // 'checkout' is in default workflows + registered again; should only appear once
      const checkoutCount = impact.affectedWorkflows.filter((w) => w === 'checkout').length;
      expect(checkoutCount).toBe(1);
      // But dependencyChain preserves both file occurrences
      expect(impact.dependencyChain.length).toBeGreaterThanOrEqual(2);
    });

    it('isolates workflows registered on different endpoints of the same service', () => {
      analyzer.registerDependency({
        workflowName: 'chargeWorkflow',
        service: 'payments',
        endpoint: '/payments/charge',
        usedFields: ['amount'],
        filePath: 'apps/pay/charge.ts',
      });
      analyzer.registerDependency({
        workflowName: 'refundWorkflow',
        service: 'payments',
        endpoint: '/payments/refund',
        usedFields: ['refund_id', 'amount'],
        filePath: 'apps/pay/refund.ts',
      });

      const refundChange = buildChange({
        service: 'payments',
        endpoint: '/payments/refund',
        before: { field: 'amount' },
        semanticVerdict: 'equivalent',
      });

      const impact = analyzer.analyze(refundChange);
      expect(impact.affectedWorkflows).toContain('refundWorkflow');
      expect(impact.affectedWorkflows).not.toContain('chargeWorkflow');
      expect(impact.affectedWorkflows).not.toContain('checkout');
    });

    it('handles custom workflow with empty usedFields correctly', () => {
      analyzer.registerDependency({
        workflowName: 'healthPinger',
        service: 'health',
        endpoint: '/ping',
        usedFields: [],
        filePath: 'ops/monitor/ping.ts',
      });

      // Specific field change should NOT affect it
      const fieldChange = buildChange({
        service: 'health',
        endpoint: '/ping',
        kind: 'rename',
        before: { field: 'latency' },
        semanticVerdict: 'equivalent',
      });
      const fieldImpact = analyzer.analyze(fieldChange);
      expect(fieldImpact.affectedWorkflows).toEqual([]);

      // Global change without field should affect it
      const globalChange = buildChange({
        service: 'health',
        endpoint: '/ping',
        kind: 'rate_limit_changed',
        before: {},
        semanticVerdict: 'breaking',
      });
      const globalImpact = analyzer.analyze(globalChange);
      expect(globalImpact.affectedWorkflows).toContain('healthPinger');
    });
  });

  // =========================================================================
  // 2. Field-Level Precision & Selective Blast Radius
  // =========================================================================
  describe('2. Field-Level Precision & Selective Blast Radius', () => {
    beforeEach(() => {
      // Register multi-consumer setup on orders service
      analyzer.registerDependency({
        workflowName: 'receiptGenerator',
        service: 'orders',
        endpoint: '/orders/summary',
        usedFields: ['receipt_id', 'subtotal', 'tax'],
        filePath: 'apps/billing/receipt.ts',
      });
      analyzer.registerDependency({
        workflowName: 'shippingDispatcher',
        service: 'orders',
        endpoint: '/orders/summary',
        usedFields: ['shipping_address', 'carrier', 'tracking_code'],
        filePath: 'apps/shipping/dispatch.ts',
      });
      analyzer.registerDependency({
        workflowName: 'executiveDashboard',
        service: 'orders',
        endpoint: '/orders/summary',
        usedFields: ['subtotal', 'carrier'],
        filePath: 'apps/analytics/dashboard.ts',
      });
    });

    it('changes touching unused fields do not flag unrelated workflows', () => {
      // Change on internal_debug_info which no workflow reads
      const change = buildChange({
        service: 'orders',
        endpoint: '/orders/summary',
        kind: 'type_changed',
        before: { field: 'internal_debug_info' },
        after: { field: 'internal_debug_info' },
        semanticVerdict: 'equivalent',
      });

      const impact = analyzer.analyze(change);
      expect(impact.affectedWorkflows).toEqual([]);
      // When no workflows are affected, fieldPaths falls back to service:endpoint
      expect(impact.fieldPaths).toEqual(['orders:/orders/summary']);
      expect(impact.severity).toBe('low');
    });

    it('changes touching exclusively single-consumer field flag ONLY that consumer', () => {
      // 'tax' is only used by receiptGenerator
      const taxChange = buildChange({
        service: 'orders',
        endpoint: '/orders/summary',
        kind: 'rename',
        before: { field: 'tax' },
        after: { field: 'vat_amount' },
        semanticVerdict: 'equivalent',
      });

      const taxImpact = analyzer.analyze(taxChange);
      expect(taxImpact.affectedWorkflows).toEqual(['receiptGenerator']);
      expect(taxImpact.affectedWorkflows).not.toContain('shippingDispatcher');
      expect(taxImpact.affectedWorkflows).not.toContain('executiveDashboard');
      expect(taxImpact.fieldPaths).toEqual(['orders.tax']);
      expect(taxImpact.severity).toBe('low');

      // 'tracking_code' is only used by shippingDispatcher
      const trackingChange = buildChange({
        service: 'orders',
        endpoint: '/orders/summary',
        kind: 'field_removed',
        before: { field: 'tracking_code' },
        semanticVerdict: 'lossy',
      });

      const trackingImpact = analyzer.analyze(trackingChange);
      expect(trackingImpact.affectedWorkflows).toEqual(['shippingDispatcher']);
      expect(trackingImpact.affectedWorkflows).not.toContain('receiptGenerator');
      expect(trackingImpact.affectedWorkflows).not.toContain('executiveDashboard');
      expect(trackingImpact.severity).toBe('high');
    });

    it('changes touching shared fields flag ALL dependent workflows accurately', () => {
      // 'subtotal' is used by receiptGenerator AND executiveDashboard
      const subtotalChange = buildChange({
        service: 'orders',
        endpoint: '/orders/summary',
        kind: 'unit_shift',
        before: { field: 'subtotal' },
        semanticVerdict: 'equivalent',
      });

      const subtotalImpact = analyzer.analyze(subtotalChange);
      expect(subtotalImpact.affectedWorkflows).toHaveLength(2);
      expect(subtotalImpact.affectedWorkflows).toContain('receiptGenerator');
      expect(subtotalImpact.affectedWorkflows).toContain('executiveDashboard');
      expect(subtotalImpact.affectedWorkflows).not.toContain('shippingDispatcher');

      // 'carrier' is used by shippingDispatcher AND executiveDashboard
      const carrierChange = buildChange({
        service: 'orders',
        endpoint: '/orders/summary',
        kind: 'rename',
        before: { field: 'carrier' },
        semanticVerdict: 'breaking',
      });

      const carrierImpact = analyzer.analyze(carrierChange);
      expect(carrierImpact.affectedWorkflows).toHaveLength(2);
      expect(carrierImpact.affectedWorkflows).toContain('shippingDispatcher');
      expect(carrierImpact.affectedWorkflows).toContain('executiveDashboard');
      expect(carrierImpact.affectedWorkflows).not.toContain('receiptGenerator');
    });

    it('global changes (pagination_changed) flag ALL workflows for that endpoint', () => {
      const change = buildChange({
        service: 'orders',
        endpoint: '/orders/summary',
        kind: 'pagination_changed',
        before: { field: 'cursor' }, // not in any usedFields
        semanticVerdict: 'breaking',
      });

      const impact = analyzer.analyze(change);
      expect(impact.affectedWorkflows).toHaveLength(3);
      expect(impact.affectedWorkflows).toContain('receiptGenerator');
      expect(impact.affectedWorkflows).toContain('shippingDispatcher');
      expect(impact.affectedWorkflows).toContain('executiveDashboard');
      expect(impact.severity).toBe('critical');
    });

    it('global changes (rate_limit_changed) flag ALL workflows for that endpoint', () => {
      const change = buildChange({
        service: 'orders',
        endpoint: '/orders/summary',
        kind: 'rate_limit_changed',
        before: {},
        semanticVerdict: 'lossy',
      });

      const impact = analyzer.analyze(change);
      expect(impact.affectedWorkflows).toHaveLength(3);
      expect(impact.affectedWorkflows).toContain('receiptGenerator');
      expect(impact.affectedWorkflows).toContain('shippingDispatcher');
      expect(impact.affectedWorkflows).toContain('executiveDashboard');
      expect(impact.severity).toBe('high');
    });

    it('global changes (enum_semantics) flag ALL workflows for that endpoint', () => {
      const change = buildChange({
        service: 'orders',
        endpoint: '/orders/summary',
        kind: 'enum_semantics',
        before: { field: 'status_enum_unlisted' },
        semanticVerdict: 'breaking',
      });

      const impact = analyzer.analyze(change);
      expect(impact.affectedWorkflows).toHaveLength(3);
      expect(impact.affectedWorkflows).toContain('receiptGenerator');
      expect(impact.affectedWorkflows).toContain('shippingDispatcher');
      expect(impact.affectedWorkflows).toContain('executiveDashboard');
    });

    it('derives default field when before has no field property', () => {
      // rename defaults to 'name'
      const renameChange = buildChange({
        service: 'users',
        endpoint: '/users',
        kind: 'rename',
        before: {},
        semanticVerdict: 'equivalent',
      });
      const renameImpact = analyzer.analyze(renameChange);
      expect(renameImpact.affectedWorkflows).toContain('userProfile');
      expect(renameImpact.fieldPaths).toContain('users.name');

      // unit_shift defaults to 'amount'
      const unitShiftChange = buildChange({
        service: 'payments',
        endpoint: '/payments/charge',
        kind: 'unit_shift',
        before: {},
        semanticVerdict: 'equivalent',
      });
      const unitShiftImpact = analyzer.analyze(unitShiftChange);
      expect(unitShiftImpact.affectedWorkflows).toContain('checkout');
      expect(unitShiftImpact.fieldPaths).toContain('payments.amount');

      // pagination_changed defaults to 'offset'
      const paginationChange = buildChange({
        service: 'search',
        endpoint: '/search',
        kind: 'pagination_changed',
        before: {},
        semanticVerdict: 'equivalent',
      });
      const paginationImpact = analyzer.analyze(paginationChange);
      expect(paginationImpact.affectedWorkflows).toContain('searchBrowse');
      expect(paginationImpact.fieldPaths).toContain('search.offset');
    });

    it('explicit before.field takes precedence over default kind heuristic', () => {
      // unit_shift with explicit field 'currency' should target currency, not 'amount'
      const change = buildChange({
        service: 'payments',
        endpoint: '/payments/charge',
        kind: 'unit_shift',
        before: { field: 'currency' },
        semanticVerdict: 'equivalent',
      });
      const impact = analyzer.analyze(change);
      expect(impact.affectedWorkflows).toContain('checkout');
      expect(impact.fieldPaths).toEqual(['payments.currency']);
    });

    it('flags all workflows on endpoint when changedField cannot be extracted and kind has no default', () => {
      // truncation with empty before has changedField === '' -> !changedField is true
      const change = buildChange({
        service: 'orders',
        endpoint: '/orders/summary',
        kind: 'truncation',
        before: {},
        semanticVerdict: 'breaking',
      });
      const impact = analyzer.analyze(change);
      expect(impact.affectedWorkflows).toHaveLength(3);
      // Fallback field path when changedField is empty string
      expect(impact.fieldPaths).toEqual(['orders:/orders/summary']);
    });
  });

  // =========================================================================
  // 3. Severity Matrix & Precedence Rules
  // =========================================================================
  describe('3. Severity Matrix & Precedence Rules', () => {
    it('rates breaking verdict as "critical" regardless of affected workflows count', () => {
      // 0 affected workflows + breaking -> critical
      const change0 = buildChange({
        service: 'payments',
        endpoint: '/payments/charge',
        before: { field: 'completely_unknown_field' },
        semanticVerdict: 'breaking',
      });
      const impact0 = analyzer.analyze(change0);
      expect(impact0.affectedWorkflows).toHaveLength(0);
      expect(impact0.severity).toBe('critical');

      // 1 affected workflow + breaking -> critical
      const change1 = buildChange({
        service: 'payments',
        endpoint: '/payments/charge',
        before: { field: 'amount' },
        semanticVerdict: 'breaking',
      });
      const impact1 = analyzer.analyze(change1);
      expect(impact1.affectedWorkflows).toHaveLength(1);
      expect(impact1.severity).toBe('critical');

      // 2+ affected workflows + breaking -> critical
      analyzer.registerDependency({
        workflowName: 'fraudCheckout',
        service: 'payments',
        endpoint: '/payments/charge',
        usedFields: ['amount'],
        filePath: 'apps/fraud.ts',
      });
      const change2 = buildChange({
        service: 'payments',
        endpoint: '/payments/charge',
        before: { field: 'amount' },
        semanticVerdict: 'breaking',
      });
      const impact2 = analyzer.analyze(change2);
      expect(impact2.affectedWorkflows.length).toBeGreaterThanOrEqual(2);
      expect(impact2.severity).toBe('critical');
    });

    it('rates lossy verdict as "high" when not breaking', () => {
      // 0 affected workflows + lossy -> high
      const change0 = buildChange({
        service: 'payments',
        endpoint: '/payments/charge',
        before: { field: 'nonexistent_field' },
        semanticVerdict: 'lossy',
      });
      const impact0 = analyzer.analyze(change0);
      expect(impact0.affectedWorkflows).toHaveLength(0);
      expect(impact0.severity).toBe('high');

      // 1 affected workflow + lossy -> high
      const change1 = buildChange({
        service: 'payments',
        endpoint: '/payments/charge',
        before: { field: 'amount' },
        semanticVerdict: 'lossy',
      });
      const impact1 = analyzer.analyze(change1);
      expect(impact1.affectedWorkflows).toHaveLength(1);
      expect(impact1.severity).toBe('high');
    });

    it('escalates severity to "high" when >=2 workflows are affected, even if semanticVerdict is equivalent', () => {
      analyzer.registerDependency({
        workflowName: 'orderHistory',
        service: 'payments',
        endpoint: '/payments/charge',
        usedFields: ['amount', 'status'],
        filePath: 'apps/history.ts',
      });

      const change = buildChange({
        service: 'payments',
        endpoint: '/payments/charge',
        before: { field: 'status' },
        semanticVerdict: 'equivalent',
      });

      const impact = analyzer.analyze(change);
      expect(impact.affectedWorkflows).toContain('checkout');
      expect(impact.affectedWorkflows).toContain('orderHistory');
      expect(impact.affectedWorkflows.length).toBeGreaterThanOrEqual(2);
      expect(impact.severity).toBe('high');
    });

    it('rates equivalent verdict with exactly 1 affected workflow as "low"', () => {
      const change = buildChange({
        service: 'payments',
        endpoint: '/payments/charge',
        before: { field: 'currency' },
        semanticVerdict: 'equivalent',
      });

      const impact = analyzer.analyze(change);
      expect(impact.affectedWorkflows).toEqual(['checkout']);
      expect(impact.severity).toBe('low');
    });

    it('rates equivalent verdict with 0 affected workflows as "low"', () => {
      const change = buildChange({
        service: 'payments',
        endpoint: '/payments/charge',
        before: { field: 'unrelated_field' },
        semanticVerdict: 'equivalent',
      });

      const impact = analyzer.analyze(change);
      expect(impact.affectedWorkflows).toEqual([]);
      expect(impact.severity).toBe('low');
    });

    it('falls back to "medium" severity for unknown verdicts with <2 affected workflows', () => {
      // 0 affected workflows + unknown verdict -> medium
      const change0 = buildChange({
        service: 'payments',
        endpoint: '/payments/charge',
        before: { field: 'unrelated_field' },
        semanticVerdict: 'unknown',
      });
      const impact0 = analyzer.analyze(change0);
      expect(impact0.affectedWorkflows).toHaveLength(0);
      expect(impact0.severity).toBe('medium');

      // 1 affected workflow + unknown verdict -> medium
      const change1 = buildChange({
        service: 'payments',
        endpoint: '/payments/charge',
        before: { field: 'amount' },
        semanticVerdict: 'unknown',
      });
      const impact1 = analyzer.analyze(change1);
      expect(impact1.affectedWorkflows).toHaveLength(1);
      expect(impact1.severity).toBe('medium');
    });

    it('escalates unknown verdict to "high" when >=2 workflows are affected', () => {
      analyzer.registerDependency({
        workflowName: 'taxCalculator',
        service: 'payments',
        endpoint: '/payments/charge',
        usedFields: ['amount'],
        filePath: 'apps/tax.ts',
      });

      const change = buildChange({
        service: 'payments',
        endpoint: '/payments/charge',
        before: { field: 'amount' },
        semanticVerdict: 'unknown',
      });

      const impact = analyzer.analyze(change);
      expect(impact.affectedWorkflows.length).toBeGreaterThanOrEqual(2);
      expect(impact.severity).toBe('high');
    });
  });

  // =========================================================================
  // 4. Default Shipwell Workflow Coverage (Full Matrix)
  // =========================================================================
  describe('4. Default Shipwell Workflow Coverage (Full Matrix)', () => {
    describe('Workflow 1: checkout (service: payments, endpoint: /payments/charge)', () => {
      const used = ['amount', 'currency', 'status'];

      it.each(used)('flags checkout when used field "%s" changes', (fieldName) => {
        const change = buildChange({
          service: 'payments',
          endpoint: '/payments/charge',
          before: { field: fieldName },
          semanticVerdict: 'equivalent',
        });
        const impact = analyzer.analyze(change);
        expect(impact.affectedWorkflows).toContain('checkout');
        expect(impact.fieldPaths).toContain(`payments.${fieldName}`);
        expect(impact.dependencyChain).toContain(
          'apps/demo-app/src/workflows/checkout.ts -> depends on [payments:/payments/charge]'
        );
      });

      it('does NOT flag checkout when unused field changes', () => {
        const change = buildChange({
          service: 'payments',
          endpoint: '/payments/charge',
          before: { field: 'receipt_email' },
          semanticVerdict: 'equivalent',
        });
        const impact = analyzer.analyze(change);
        expect(impact.affectedWorkflows).not.toContain('checkout');
      });
    });

    describe('Workflow 2: userProfile (service: users, endpoint: /users)', () => {
      const used = ['id', 'name', 'status'];

      it.each(used)('flags userProfile when used field "%s" changes', (fieldName) => {
        const change = buildChange({
          service: 'users',
          endpoint: '/users',
          before: { field: fieldName },
          semanticVerdict: 'equivalent',
        });
        const impact = analyzer.analyze(change);
        expect(impact.affectedWorkflows).toContain('userProfile');
        expect(impact.fieldPaths).toContain(`users.${fieldName}`);
        expect(impact.dependencyChain).toContain(
          'apps/demo-app/src/workflows/userProfile.ts -> depends on [users:/users]'
        );
      });

      it('does NOT flag userProfile when unused field changes', () => {
        const change = buildChange({
          service: 'users',
          endpoint: '/users',
          before: { field: 'phone_number' },
          semanticVerdict: 'equivalent',
        });
        const impact = analyzer.analyze(change);
        expect(impact.affectedWorkflows).not.toContain('userProfile');
      });
    });

    describe('Workflow 3: searchBrowse (service: search, endpoint: /search)', () => {
      const used = ['items', 'total', 'offset', 'limit'];

      it.each(used)('flags searchBrowse when used field "%s" changes', (fieldName) => {
        const change = buildChange({
          service: 'search',
          endpoint: '/search',
          before: { field: fieldName },
          semanticVerdict: 'equivalent',
        });
        const impact = analyzer.analyze(change);
        expect(impact.affectedWorkflows).toContain('searchBrowse');
        expect(impact.fieldPaths).toContain(`search.${fieldName}`);
        expect(impact.dependencyChain).toContain(
          'apps/demo-app/src/workflows/searchBrowse.ts -> depends on [search:/search]'
        );
      });

      it('does NOT flag searchBrowse when unused field changes', () => {
        const change = buildChange({
          service: 'search',
          endpoint: '/search',
          before: { field: 'facets' },
          semanticVerdict: 'equivalent',
        });
        const impact = analyzer.analyze(change);
        expect(impact.affectedWorkflows).not.toContain('searchBrowse');
      });
    });

    describe('Workflow 4: notificationAck (service: notifications, endpoint: /notifications/webhook)', () => {
      const used = ['event.type', 'event.id'];

      it.each(used)('flags notificationAck when nested field "%s" changes', (fieldName) => {
        const change = buildChange({
          service: 'notifications',
          endpoint: '/notifications/webhook',
          before: { field: fieldName },
          semanticVerdict: 'equivalent',
        });
        const impact = analyzer.analyze(change);
        expect(impact.affectedWorkflows).toContain('notificationAck');
        expect(impact.fieldPaths).toContain(`notifications.${fieldName}`);
        expect(impact.dependencyChain).toContain(
          'apps/demo-app/src/workflows/notifications.ts -> depends on [notifications:/notifications/webhook]'
        );
      });

      it('does NOT flag notificationAck when unused field changes', () => {
        const change = buildChange({
          service: 'notifications',
          endpoint: '/notifications/webhook',
          before: { field: 'event.payload' },
          semanticVerdict: 'equivalent',
        });
        const impact = analyzer.analyze(change);
        expect(impact.affectedWorkflows).not.toContain('notificationAck');
      });
    });

    describe('Workflow 5: mcpAssistantCall (service: mcp-tool, endpoint: /mcp-tool/execute)', () => {
      const used = ['query', 'result'];

      it.each(used)('flags mcpAssistantCall when used field "%s" changes', (fieldName) => {
        const change = buildChange({
          service: 'mcp-tool',
          endpoint: '/mcp-tool/execute',
          before: { field: fieldName },
          semanticVerdict: 'equivalent',
        });
        const impact = analyzer.analyze(change);
        expect(impact.affectedWorkflows).toContain('mcpAssistantCall');
        expect(impact.fieldPaths).toContain(`mcp-tool.${fieldName}`);
        expect(impact.dependencyChain).toContain(
          'apps/demo-app/src/workflows/mcpAssistant.ts -> depends on [mcp-tool:/mcp-tool/execute]'
        );
      });

      it('does NOT flag mcpAssistantCall when unused field changes', () => {
        const change = buildChange({
          service: 'mcp-tool',
          endpoint: '/mcp-tool/execute',
          before: { field: 'session_id' },
          semanticVerdict: 'equivalent',
        });
        const impact = analyzer.analyze(change);
        expect(impact.affectedWorkflows).not.toContain('mcpAssistantCall');
      });
    });
  });

  // =========================================================================
  // 5. Catalogue Mutations (M1-M10) Blast-Radius Mapping
  // =========================================================================
  describe('5. Catalogue Mutations (M1-M10) Across Impact Pipeline', () => {
    const mutations: Array<{
      id: string;
      kind: ChangeKind;
      service: string;
      endpoint: string;
      field: string;
      verdict: SemanticVerdict;
      expectedWorkflow: string;
      expectedSeverity: 'low' | 'medium' | 'high' | 'critical';
    }> = [
      {
        id: 'M1_field_added',
        kind: 'field_added',
        service: 'users',
        endpoint: '/users',
        field: 'status',
        verdict: 'equivalent',
        expectedWorkflow: 'userProfile',
        expectedSeverity: 'low',
      },
      {
        id: 'M2_field_removed',
        kind: 'field_removed',
        service: 'users',
        endpoint: '/users',
        field: 'name',
        verdict: 'breaking',
        expectedWorkflow: 'userProfile',
        expectedSeverity: 'critical',
      },
      {
        id: 'M3_type_changed',
        kind: 'type_changed',
        service: 'payments',
        endpoint: '/payments/charge',
        field: 'amount',
        verdict: 'breaking',
        expectedWorkflow: 'checkout',
        expectedSeverity: 'critical',
      },
      {
        id: 'M4_rename',
        kind: 'rename',
        service: 'mcp-tool',
        endpoint: '/mcp-tool/execute',
        field: 'query',
        verdict: 'equivalent',
        expectedWorkflow: 'mcpAssistantCall',
        expectedSeverity: 'low',
      },
      {
        id: 'M5_unit_shift',
        kind: 'unit_shift',
        service: 'payments',
        endpoint: '/payments/charge',
        field: 'amount',
        verdict: 'lossy',
        expectedWorkflow: 'checkout',
        expectedSeverity: 'high',
      },
      {
        id: 'M6_truncation',
        kind: 'truncation',
        service: 'mcp-tool',
        endpoint: '/mcp-tool/execute',
        field: 'result',
        verdict: 'lossy',
        expectedWorkflow: 'mcpAssistantCall',
        expectedSeverity: 'high',
      },
      {
        id: 'M7_default_changed',
        kind: 'default_changed',
        service: 'search',
        endpoint: '/search',
        field: 'limit',
        verdict: 'equivalent',
        expectedWorkflow: 'searchBrowse',
        expectedSeverity: 'low',
      },
      {
        id: 'M8_pagination_changed',
        kind: 'pagination_changed',
        service: 'search',
        endpoint: '/search',
        field: 'offset',
        verdict: 'breaking',
        expectedWorkflow: 'searchBrowse',
        expectedSeverity: 'critical',
      },
      {
        id: 'M9_rate_limit_changed',
        kind: 'rate_limit_changed',
        service: 'payments',
        endpoint: '/payments/charge',
        field: 'status',
        verdict: 'breaking',
        expectedWorkflow: 'checkout',
        expectedSeverity: 'critical',
      },
      {
        id: 'M10_enum_semantics',
        kind: 'enum_semantics',
        service: 'users',
        endpoint: '/users',
        field: 'status',
        verdict: 'breaking',
        expectedWorkflow: 'userProfile',
        expectedSeverity: 'critical',
      },
    ];

    it.each(mutations)(
      'evaluates mutation $id ($kind) correctly',
      ({ id, kind, service, endpoint, field, verdict, expectedWorkflow, expectedSeverity }) => {
        const change = buildChange({
          id,
          service,
          endpoint,
          kind,
          before: { field },
          after: { field: `${field}_next` },
          semanticVerdict: verdict,
        });

        const impact = analyzer.analyze(change);
        expect(impact.affectedWorkflows).toContain(expectedWorkflow);
        expect(impact.severity).toBe(expectedSeverity);
        expect(impact.fieldPaths).toContain(`${service}.${field}`);
      }
    );
  });

  // =========================================================================
  // 6. Schema Conformance & Contract Validation
  // =========================================================================
  describe('6. Schema Conformance & Contract Validation', () => {
    it('produces an Impact object that strictly satisfies ImpactSchema.parse()', () => {
      const change = buildChange({
        id: 'chg_conformance_001',
        service: 'payments',
        endpoint: '/payments/charge',
        before: { field: 'amount' },
        semanticVerdict: 'breaking',
      });

      const impact = analyzer.analyze(change);
      const parsed = ImpactSchema.parse(impact);

      expect(parsed.changeId).toBe(change.id);
      expect(Array.isArray(parsed.affectedWorkflows)).toBe(true);
      expect(Array.isArray(parsed.fieldPaths)).toBe(true);
      expect(Array.isArray(parsed.dependencyChain)).toBe(true);
      expect(['low', 'medium', 'high', 'critical']).toContain(parsed.severity);
    });

    it('falls back to service:endpoint in fieldPaths when no specific field is identified', () => {
      const change = buildChange({
        id: 'chg_no_field',
        service: 'unknown-service',
        endpoint: '/unknown/endpoint',
        kind: 'semantic_other',
        before: null,
        after: null,
        semanticVerdict: 'equivalent',
      });

      const impact = analyzer.analyze(change);
      expect(impact.fieldPaths).toEqual(['unknown-service:/unknown/endpoint']);
      expect(impact.affectedWorkflows).toEqual([]);
      expect(impact.dependencyChain).toEqual([]);
      expect(() => ImpactSchema.parse(impact)).not.toThrow();
    });

    it('retains changeId verbatim in generated Impact', () => {
      const customId = 'change_uuid_98765-xyz-123';
      const change = buildChange({ id: customId });
      const impact = analyzer.analyze(change);
      expect(impact.changeId).toBe(customId);
    });
  });

  // =========================================================================
  // 7. Boundary Conditions, Adversarial Inputs & Scale
  // =========================================================================
  describe('7. Boundary Conditions, Adversarial Inputs & Scale', () => {
    it('handles null, undefined, primitive, and empty before values safely', () => {
      const beforeVariants = [
        null,
        undefined,
        '',
        'string-payload',
        12345,
        true,
        [],
        {},
        { notField: 'foo' },
      ];

      for (const beforeVal of beforeVariants) {
        const change = buildChange({
          id: `chg_variant_${String(beforeVal)}`,
          service: 'payments',
          endpoint: '/payments/charge',
          kind: 'type_changed',
          before: beforeVal,
          semanticVerdict: 'equivalent',
        });

        // When changedField is empty string, analyzer treats it as affecting all deps of that endpoint
        const impact = analyzer.analyze(change);
        expect(() => ImpactSchema.parse(impact)).not.toThrow();
        expect(impact.affectedWorkflows).toContain('checkout');
      }
    });

    it('handles non-string field property safely via String coercion', () => {
      analyzer.registerDependency({
        workflowName: 'numericFieldConsumer',
        service: 'payments',
        endpoint: '/payments/charge',
        usedFields: ['99999'],
        filePath: 'apps/numeric.ts',
      });

      const change = buildChange({
        service: 'payments',
        endpoint: '/payments/charge',
        before: { field: 99999 },
        semanticVerdict: 'equivalent',
      });

      const impact = analyzer.analyze(change);
      expect(impact.fieldPaths).toEqual(['payments.99999']);
      expect(impact.affectedWorkflows).toEqual(['numericFieldConsumer']);
      expect(impact.affectedWorkflows).not.toContain('checkout');
    });

    it('handles unicode strings in endpoint, field, and workflow names', () => {
      analyzer.registerDependency({
        workflowName: 'workflow_日本語_🚀',
        service: 'intl-service',
        endpoint: '/api/v1/国際化',
        usedFields: ['ユーザー名', '通貨'],
        filePath: 'apps/intl/handler.ts',
      });

      const change = buildChange({
        service: 'intl-service',
        endpoint: '/api/v1/国際化',
        before: { field: 'ユーザー名' },
        semanticVerdict: 'lossy',
      });

      const impact = analyzer.analyze(change);
      expect(impact.affectedWorkflows).toContain('workflow_日本語_🚀');
      expect(impact.fieldPaths).toContain('intl-service.ユーザー名');
      expect(impact.severity).toBe('high');
      expect(() => ImpactSchema.parse(impact)).not.toThrow();
    });

    it('remains fast and consistent under burst registration of hundreds of dependencies', () => {
      const burstSize = 250;
      for (let i = 0; i < burstSize; i++) {
        analyzer.registerDependency({
          workflowName: `bulkWorkflow_${i}`,
          service: `service_${i % 10}`,
          endpoint: `/route_${i % 5}`,
          usedFields: [`field_${i % 20}`, 'shared_metric'],
          filePath: `apps/bulk/job_${i}.ts`,
        });
      }

      const start = performance.now();
      const change = buildChange({
        service: 'service_3',
        endpoint: '/route_3',
        before: { field: 'shared_metric' },
        semanticVerdict: 'breaking',
      });

      const impact = analyzer.analyze(change);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(100); // Sub-100ms analysis
      expect(impact.affectedWorkflows.length).toBeGreaterThan(0);
      expect(impact.severity).toBe('critical');
      expect(() => ImpactSchema.parse(impact)).not.toThrow();
    });

    it('deduplicates fieldPaths when multiple matching workflows depend on the same field', () => {
      analyzer.registerDependency({
        workflowName: 'billing_a',
        service: 'payments',
        endpoint: '/payments/charge',
        usedFields: ['amount'],
        filePath: 'apps/billing_a.ts',
      });
      analyzer.registerDependency({
        workflowName: 'billing_b',
        service: 'payments',
        endpoint: '/payments/charge',
        usedFields: ['amount'],
        filePath: 'apps/billing_b.ts',
      });

      const change = buildChange({
        service: 'payments',
        endpoint: '/payments/charge',
        before: { field: 'amount' },
        semanticVerdict: 'breaking',
      });

      const impact = analyzer.analyze(change);
      const amountFields = impact.fieldPaths.filter((f) => f === 'payments.amount');
      expect(amountFields).toHaveLength(1);
    });

    it('maintains strict isolation between consecutive analyze calls', () => {
      const change1 = buildChange({
        id: 'chg_1',
        service: 'payments',
        endpoint: '/payments/charge',
        before: { field: 'amount' },
        semanticVerdict: 'breaking',
      });
      const change2 = buildChange({
        id: 'chg_2',
        service: 'users',
        endpoint: '/users',
        before: { field: 'id' },
        semanticVerdict: 'equivalent',
      });

      const impact1 = analyzer.analyze(change1);
      const impact2 = analyzer.analyze(change2);

      expect(impact1.changeId).toBe('chg_1');
      expect(impact1.affectedWorkflows).toEqual(['checkout']);
      expect(impact1.severity).toBe('critical');

      expect(impact2.changeId).toBe('chg_2');
      expect(impact2.affectedWorkflows).toEqual(['userProfile']);
      expect(impact2.severity).toBe('low');
    });

    it('treats empty field string { field: "" } as empty changedField, flagging all workflows on endpoint', () => {
      const change = buildChange({
        service: 'payments',
        endpoint: '/payments/charge',
        before: { field: '' },
        semanticVerdict: 'breaking',
      });

      const impact = analyzer.analyze(change);
      expect(impact.affectedWorkflows).toContain('checkout');
      // When changedField is empty string, fieldPaths falls back to service:endpoint
      expect(impact.fieldPaths).toEqual(['payments:/payments/charge']);
      expect(() => ImpactSchema.parse(impact)).not.toThrow();
    });
  });
});

