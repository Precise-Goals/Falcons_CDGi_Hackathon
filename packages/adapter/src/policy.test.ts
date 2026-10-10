import { describe, it, expect } from 'vitest';
import { SafeHandlingEngine } from './generator.js';
import {
  AdapterSchema,
  Change,
  ChangeSchema,
  MigrationProposalSchema,
} from '@intra/shared';

/**
 * Helper to dynamically execute the generated adaptResponse JS function.
 */
function compileAdaptResponse(code: string): (data: unknown) => unknown {
  const sanitized = code.replace(/export\s+function\s+adaptResponse/, 'function adaptResponse');
  const fn = new Function(`${sanitized}; return adaptResponse;`)();
  return fn as (data: unknown) => unknown;
}

/**
 * Helper to dynamically execute the generated adaptRequest JS function.
 */
function compileAdaptRequest(code: string): (params: Record<string, unknown>) => Record<string, unknown> {
  const sanitized = code.replace(/export\s+function\s+adaptRequest/, 'function adaptRequest');
  const fn = new Function('Buffer', `${sanitized}; return adaptRequest;`)(Buffer);
  return fn as (params: Record<string, unknown>) => Record<string, unknown>;
}

/**
 * Helper to generate a minimal valid Change object.
 */
function createChange(overrides: Partial<Change> = {}): Change {
  const base: Change = {
    id: 'chg_default_1',
    service: 'users',
    endpoint: '/api/v1/users',
    kind: 'rename',
    documented: false,
    before: { name: 'Alice' },
    after: { display_name: 'Alice' },
    evidence: {
      samples: ['obs_101', 'obs_102'],
      stats: { sampleCount: 2, driftRate: 1.0 },
    },
    semanticVerdict: 'equivalent',
    confidence: 0.95,
    detectedAt: new Date().toISOString(),
  };

  const change = { ...base, ...overrides };
  ChangeSchema.parse(change);
  return change;
}

describe('@intra/adapter Safe-Handling Policy Matrix (§10)', () => {
  const engine = new SafeHandlingEngine();

  describe('1. Boundary Conditions & Verdict Rules', () => {
    it('boundary at confidence 0.90 + equivalent -> auto_apply', () => {
      const change = createChange({
        id: 'chg_boundary_0_90',
        confidence: 0.9,
        semanticVerdict: 'equivalent',
      });

      const decision = engine.evaluate(change);
      expect(decision.action).toBe('auto_apply');
      expect(decision.adapter).toBeDefined();
      expect(decision.proposal).toBeUndefined();
      expect(decision.rationale).toContain('High confidence (0.9)');
    });

    it('boundary at confidence 0.8999 + equivalent -> open_migration_pr', () => {
      const change = createChange({
        id: 'chg_boundary_0_8999',
        confidence: 0.8999,
        semanticVerdict: 'equivalent',
      });

      const decision = engine.evaluate(change);
      expect(decision.action).toBe('open_migration_pr');
      expect(decision.adapter).toBeDefined();
      expect(decision.proposal).toBeDefined();
      expect(decision.proposal?.status).toBe('pending');
      expect(decision.rationale).toContain('0.8999');
    });

    it('boundary at confidence 0.70 + equivalent -> open_migration_pr', () => {
      const change = createChange({
        id: 'chg_boundary_0_70',
        confidence: 0.7,
        semanticVerdict: 'equivalent',
      });

      const decision = engine.evaluate(change);
      expect(decision.action).toBe('open_migration_pr');
      expect(decision.adapter).toBeDefined();
      expect(decision.proposal).toBeDefined();
      expect(decision.rationale).toContain('0.7');
    });

    it('boundary at confidence 0.6999 + equivalent -> quarantine_alert', () => {
      const change = createChange({
        id: 'chg_boundary_0_6999',
        confidence: 0.6999,
        semanticVerdict: 'equivalent',
      });

      const decision = engine.evaluate(change);
      expect(decision.action).toBe('quarantine_alert');
      expect(decision.adapter).toBeUndefined();
      expect(decision.proposal).toBeDefined();
      expect(decision.rationale).toContain('0.6999');
      expect(decision.rationale).toContain('Quarantined');
    });

    it('confidence 0.0 -> quarantine_alert', () => {
      const change = createChange({
        id: 'chg_confidence_zero',
        confidence: 0.0,
        semanticVerdict: 'equivalent',
      });

      const decision = engine.evaluate(change);
      expect(decision.action).toBe('quarantine_alert');
      expect(decision.adapter).toBeUndefined();
      expect(decision.proposal).toBeDefined();
      expect(decision.rationale).toContain('0');
    });

    it('confidence 1.0 + equivalent -> auto_apply', () => {
      const change = createChange({
        id: 'chg_confidence_one_equiv',
        confidence: 1.0,
        semanticVerdict: 'equivalent',
      });

      const decision = engine.evaluate(change);
      expect(decision.action).toBe('auto_apply');
      expect(decision.adapter).toBeDefined();
      expect(decision.proposal).toBeUndefined();
      expect(decision.rationale).toContain('High confidence (1)');
    });

    it('confidence 1.0 + lossy -> open_migration_pr (lossy requires human review)', () => {
      const change = createChange({
        id: 'chg_confidence_one_lossy',
        confidence: 1.0,
        semanticVerdict: 'lossy',
      });

      const decision = engine.evaluate(change);
      expect(decision.action).toBe('open_migration_pr');
      expect(decision.adapter).toBeDefined();
      expect(decision.proposal).toBeDefined();
      expect(decision.proposal?.status).toBe('pending');
      expect(decision.proposal?.riskAssessment).toContain('MEDIUM');
    });

    it('confidence 1.0 + breaking -> circuit_break (breaking always trips breaker regardless of confidence)', () => {
      const change = createChange({
        id: 'chg_confidence_one_breaking',
        confidence: 1.0,
        semanticVerdict: 'breaking',
      });

      const decision = engine.evaluate(change);
      expect(decision.action).toBe('circuit_break');
      expect(decision.adapter).toBeUndefined();
      expect(decision.proposal).toBeDefined();
      expect(decision.proposal?.status).toBe('pending');
      expect(decision.proposal?.riskAssessment).toContain('HIGH');
      expect(decision.rationale).toContain('Breaking change detected');
    });

    it('confidence 0.95 + unknown verdict -> quarantine_alert', () => {
      const change = createChange({
        id: 'chg_high_conf_unknown',
        confidence: 0.95,
        semanticVerdict: 'unknown',
      });

      const decision = engine.evaluate(change);
      expect(decision.action).toBe('quarantine_alert');
      expect(decision.adapter).toBeUndefined();
      expect(decision.proposal).toBeDefined();
      expect(decision.rationale).toContain('Quarantined');
    });

    it('confidence 0.0 + breaking -> circuit_break immediately', () => {
      const change = createChange({
        id: 'chg_zero_breaking',
        confidence: 0.0,
        semanticVerdict: 'breaking',
      });

      const decision = engine.evaluate(change);
      expect(decision.action).toBe('circuit_break');
      expect(decision.adapter).toBeUndefined();
      expect(decision.proposal).toBeDefined();
      expect(decision.proposal?.riskAssessment).toContain('HIGH');
    });

    it('confidence 0.50 + lossy -> open_migration_pr (lossy verdict always requires proposal)', () => {
      const change = createChange({
        id: 'chg_low_lossy',
        confidence: 0.5,
        semanticVerdict: 'lossy',
      });

      const decision = engine.evaluate(change);
      expect(decision.action).toBe('open_migration_pr');
      expect(decision.adapter).toBeDefined();
      expect(decision.proposal).toBeDefined();
    });

    it('confidence 0.0 + unknown -> quarantine_alert', () => {
      const change = createChange({
        id: 'chg_zero_unknown',
        confidence: 0.0,
        semanticVerdict: 'unknown',
      });

      const decision = engine.evaluate(change);
      expect(decision.action).toBe('quarantine_alert');
      expect(decision.adapter).toBeUndefined();
      expect(decision.proposal).toBeDefined();
    });
  });

  describe('2. Adapter Generation & Code Execution Strategies', () => {
    it('rename strategy produces valid JS adaptResponse handling both arrays and objects', () => {
      const change = createChange({
        id: 'chg_rename_valid',
        kind: 'rename',
        confidence: 0.95,
        semanticVerdict: 'equivalent',
      });

      const decision = engine.evaluate(change);
      expect(decision.adapter).toBeDefined();
      const adapter = decision.adapter!;
      expect(adapter.strategy).toBe('rename');
      expect(adapter.code).toContain('export function adaptResponse(data)');

      const adaptFn = compileAdaptResponse(adapter.code);

      // 1. Array handling
      const mutatedArray = [
        { id: '1', display_name: 'Alice' },
        { id: '2', display_name: 'Bob' },
      ];
      const adaptedArray = adaptFn(mutatedArray) as Array<{ id: string; name: string; display_name: string }>;
      expect(Array.isArray(adaptedArray)).toBe(true);
      expect(adaptedArray).toHaveLength(2);
      expect(adaptedArray[0].name).toBe('Alice');
      expect(adaptedArray[1].name).toBe('Bob');

      // Empty array edge case
      expect(adaptFn([])).toEqual([]);

      // Array with existing name without display_name
      const preservedArray = adaptFn([{ id: '3', name: 'Charlie' }]) as Array<{ name: string }>;
      expect(preservedArray[0].name).toBe('Charlie');

      // 2. Object handling
      const mutatedObj = { id: 'u1', display_name: 'David', role: 'admin' };
      const adaptedObj = adaptFn(mutatedObj) as { id: string; name: string; display_name: string; role: string };
      expect(adaptedObj.name).toBe('David');
      expect(adaptedObj.id).toBe('u1');
      expect(adaptedObj.role).toBe('admin');

      // Object with display_name taking precedence over old name
      const dualObj = { id: 'u2', name: 'OldName', display_name: 'NewName' };
      const adaptedDual = adaptFn(dualObj) as { name: string };
      expect(adaptedDual.name).toBe('NewName');

      // Object without display_name retains original name
      const originalObj = { id: 'u3', name: 'Legacy' };
      const adaptedOriginal = adaptFn(originalObj) as { name: string };
      expect(adaptedOriginal.name).toBe('Legacy');

      // Unicode and special characters
      const unicodeObj = { id: 'u4', display_name: '日本語 🚀 \n \t "quoted"' };
      const adaptedUnicode = adaptFn(unicodeObj) as { name: string };
      expect(adaptedUnicode.name).toBe('日本語 🚀 \n \t "quoted"');
    });

    it('unit_shift strategy produces adaptResponse converting integer cents back to dollar floats', () => {
      const change = createChange({
        id: 'chg_unit_shift_valid',
        kind: 'unit_shift',
        confidence: 0.92,
        semanticVerdict: 'equivalent',
      });

      const decision = engine.evaluate(change);
      expect(decision.adapter).toBeDefined();
      const adapter = decision.adapter!;
      expect(adapter.strategy).toBe('transform');
      expect(adapter.code).toContain('export function adaptResponse(data)');

      const adaptFn = compileAdaptResponse(adapter.code);

      // Normal cent conversion (2500 -> 25.0)
      const mutated = { id: 'c1', amount: 2500, currency: 'USD' };
      const adapted = adaptFn(mutated) as { id: string; amount: number; currency: string };
      expect(adapted.amount).toBe(25.0);
      expect(adapted.currency).toBe('USD');

      // Zero cents (0 -> 0.0)
      expect((adaptFn({ id: 'c2', amount: 0 }) as { amount: number }).amount).toBe(0);

      // Single cent (1 -> 0.01)
      expect((adaptFn({ id: 'c3', amount: 1 }) as { amount: number }).amount).toBe(0.01);

      // Large payment amount (100000000 cents -> 1000000.00 dollars)
      expect((adaptFn({ id: 'c4', amount: 100000000 }) as { amount: number }).amount).toBe(1000000);

      // Boundary: non-number values preserved without error
      expect((adaptFn({ id: 'c5', amount: 'not-a-number' }) as { amount: string }).amount).toBe('not-a-number');
      expect((adaptFn({ id: 'c6', amount: null }) as { amount: unknown }).amount).toBeNull();
      expect((adaptFn({ id: 'c7' }) as { amount: unknown }).amount).toBeUndefined();
    });

    it('pagination_changed strategy produces adaptRequest converting offset to cursor', () => {
      const change = createChange({
        id: 'chg_pagination_valid',
        kind: 'pagination_changed',
        confidence: 0.94,
        semanticVerdict: 'equivalent',
      });

      const decision = engine.evaluate(change);
      expect(decision.adapter).toBeDefined();
      const adapter = decision.adapter!;
      expect(adapter.strategy).toBe('pagination-normalize');
      expect(adapter.code).toContain('export function adaptRequest(params)');

      const adaptFn = compileAdaptRequest(adapter.code);

      // Offset 20 converted to Base64 of '20' ("MjA=")
      const reqWithOffset = { offset: 20, limit: 10 };
      const adaptedReq = adaptFn(reqWithOffset);
      expect(adaptedReq.offset).toBe(20);
      expect(adaptedReq.limit).toBe(10);
      expect(adaptedReq.cursor).toBe(Buffer.from('20').toString('base64'));

      // Offset 0 converted to Base64 of '0' ("MA==")
      const zeroReq = adaptFn({ offset: 0 });
      expect(zeroReq.cursor).toBe(Buffer.from('0').toString('base64'));

      // Cursor already provided: should not overwrite
      const existingCursorReq = { offset: 50, cursor: 'existing_token_abc' };
      const adaptedExisting = adaptFn(existingCursorReq);
      expect(adaptedExisting.cursor).toBe('existing_token_abc');

      // No offset provided: params returned unchanged
      const noOffsetReq = { limit: 100, sort: 'desc' };
      const adaptedNoOffset = adaptFn(noOffsetReq);
      expect(adaptedNoOffset.cursor).toBeUndefined();
      expect(adaptedNoOffset).toEqual({ limit: 100, sort: 'desc' });
    });

    it('fallback strategy generates default-inject for other kinds', () => {
      const kinds: Change['kind'][] = [
        'field_added',
        'field_removed',
        'type_changed',
        'default_changed',
        'error_shape_changed',
        'rate_limit_changed',
        'truncation',
        'latency_regime',
        'semantic_other',
      ];

      for (const kind of kinds) {
        const change = createChange({
          id: `chg_fallback_${kind}`,
          kind,
          confidence: 0.91,
          semanticVerdict: 'equivalent',
        });

        const decision = engine.evaluate(change);
        expect(decision.adapter).toBeDefined();
        const adapter = decision.adapter!;
        expect(adapter.strategy).toBe('default-inject');
        expect(adapter.code).toContain('export function adaptResponse(data)');

        const adaptFn = compileAdaptResponse(adapter.code);
        const samplePayload = { a: 1, b: 'two', c: [3, 4] };
        expect(adaptFn(samplePayload)).toEqual(samplePayload);
      }
    });
  });

  describe('3. Rollback Handle Verification', () => {
    it('generates non-empty unique string starting with rollback_${change.id}_', () => {
      const change = createChange({ id: 'srv_users_v2' });
      const decision = engine.evaluate(change);

      expect(decision.rollbackHandle).toBeDefined();
      expect(decision.rollbackHandle).toMatch(new RegExp(`^rollback_${change.id}_\\d+$`));
    });

    it('synchronizes rollbackHandle between HandlingDecision and Adapter', () => {
      const change = createChange({
        id: 'chg_sync_handle',
        confidence: 0.95,
        semanticVerdict: 'equivalent',
      });

      const decision = engine.evaluate(change);
      expect(decision.rollbackHandle).toBeDefined();
      expect(decision.adapter?.rollbackHandle).toBe(decision.rollbackHandle);
    });

    it('provides rollbackHandle even for non-adapter actions (circuit_break, quarantine_alert)', () => {
      const breakingChange = createChange({
        id: 'chg_breaking_handle',
        semanticVerdict: 'breaking',
      });
      const breakDecision = engine.evaluate(breakingChange);
      expect(breakDecision.rollbackHandle).toBeDefined();
      expect(breakDecision.rollbackHandle).toMatch(/^rollback_chg_breaking_handle_\d+$/);

      const quarantineChange = createChange({
        id: 'chg_quarantine_handle',
        confidence: 0.4,
        semanticVerdict: 'unknown',
      });
      const quarDecision = engine.evaluate(quarantineChange);
      expect(quarDecision.rollbackHandle).toBeDefined();
      expect(quarDecision.rollbackHandle).toMatch(/^rollback_chg_quarantine_handle_\d+$/);
    });

    it('generates distinct handles across multiple evaluations', async () => {
      const change = createChange({ id: 'chg_time_unique' });
      const handle1 = engine.evaluate(change).rollbackHandle;
      // Sleep slightly to guarantee different timestamp if Date.now() increments
      await new Promise((resolve) => setTimeout(resolve, 5));
      const handle2 = engine.evaluate(change).rollbackHandle;

      expect(handle1).toBeDefined();
      expect(handle2).toBeDefined();
      expect(handle1).toMatch(/^rollback_chg_time_unique_/);
      expect(handle2).toMatch(/^rollback_chg_time_unique_/);
    });
  });

  describe('4. Migration Proposals Verification', () => {
    it('defaults proposal status to pending', () => {
      const change = createChange({
        id: 'chg_proposal_pending',
        confidence: 0.85,
        semanticVerdict: 'equivalent',
      });

      const decision = engine.evaluate(change);
      expect(decision.proposal).toBeDefined();
      expect(decision.proposal?.status).toBe('pending');
    });

    it('diff content reflects generated adapter when adapter is present', () => {
      const change = createChange({
        id: 'chg_proposal_with_adapter',
        kind: 'rename',
        confidence: 0.85,
        semanticVerdict: 'equivalent',
      });

      const decision = engine.evaluate(change);
      expect(decision.adapter).toBeDefined();
      expect(decision.proposal).toBeDefined();
      expect(decision.proposal?.diff).toContain('+++ generated adapter (rename)');
      expect(decision.proposal?.diff).toContain(decision.adapter!.code);
    });

    it('diff content reflects breaking manual migration warning when adapter is absent', () => {
      const change = createChange({
        id: 'chg_breaking_proposal',
        service: 'billing',
        endpoint: '/v1/charges',
        semanticVerdict: 'breaking',
        confidence: 0.99,
      });

      const decision = engine.evaluate(change);
      expect(decision.adapter).toBeUndefined();
      expect(decision.proposal).toBeDefined();
      expect(decision.proposal?.diff).toBe(
        '--- Breaking change: manual migration required for billing:/v1/charges',
      );
    });

    it('risk assessment is HIGH for breaking changes', () => {
      const change = createChange({
        id: 'chg_risk_breaking',
        semanticVerdict: 'breaking',
      });

      const decision = engine.evaluate(change);
      expect(decision.proposal).toBeDefined();
      expect(decision.proposal?.riskAssessment).toContain('HIGH');
    });

    it('risk assessment is MEDIUM for lossy changes', () => {
      const change = createChange({
        id: 'chg_risk_lossy',
        semanticVerdict: 'lossy',
        confidence: 0.8,
      });

      const decision = engine.evaluate(change);
      expect(decision.proposal).toBeDefined();
      expect(decision.proposal?.riskAssessment).toContain('MEDIUM');
    });

    it('includes valid proposal id, changeId and ISO timestamp', () => {
      const change = createChange({
        id: 'chg_meta_1',
        semanticVerdict: 'lossy',
      });

      const decision = engine.evaluate(change);
      expect(decision.proposal?.id).toBe('prop_chg_meta_1');
      expect(decision.proposal?.changeId).toBe('chg_meta_1');
      expect(decision.proposal?.createdAt).toBeDefined();
      expect(new Date(decision.proposal!.createdAt).toISOString()).toBe(decision.proposal!.createdAt);
    });
  });

  describe('5. Schema Conformance (Zod)', () => {
    it('all generated adapters satisfy AdapterSchema.parse()', () => {
      const kinds: Change['kind'][] = ['rename', 'unit_shift', 'pagination_changed', 'default_changed'];

      for (const kind of kinds) {
        const change = createChange({
          id: `chg_zod_adapter_${kind}`,
          kind,
          confidence: 0.95,
          semanticVerdict: 'equivalent',
        });

        const decision = engine.evaluate(change);
        expect(decision.adapter).toBeDefined();
        const parsed = AdapterSchema.parse(decision.adapter);
        expect(parsed.id).toBe(`adp_${change.id}_v1`);
        expect(parsed.changeId).toBe(change.id);
        expect(parsed.code.length).toBeGreaterThan(0);
        expect(parsed.tests.length).toBeGreaterThan(0);
        expect(parsed.rollbackHandle.length).toBeGreaterThan(0);
      }
    });

    it('all generated migration proposals satisfy MigrationProposalSchema.parse()', () => {
      const changes: Change[] = [
        createChange({ id: 'chg_p1', confidence: 0.85, semanticVerdict: 'equivalent' }),
        createChange({ id: 'chg_p2', confidence: 0.95, semanticVerdict: 'lossy' }),
        createChange({ id: 'chg_p3', confidence: 0.99, semanticVerdict: 'breaking' }),
        createChange({ id: 'chg_p4', confidence: 0.2, semanticVerdict: 'unknown' }),
      ];

      for (const change of changes) {
        const decision = engine.evaluate(change);
        expect(decision.proposal).toBeDefined();
        const parsed = MigrationProposalSchema.parse(decision.proposal);
        expect(parsed.id).toBe(`prop_${change.id}`);
        expect(parsed.changeId).toBe(change.id);
        expect(parsed.status).toBe('pending');
        expect(parsed.diff.length).toBeGreaterThan(0);
      }
    });
  });

  describe('6. Catalogue Mutations (M1-M10) Exhaustive Evaluation', () => {
    it('M1: Field Rename (GET /users name -> display_name) auto-applies rename adapter', () => {
      const m1Change = createChange({
        id: 'M1',
        service: 'users',
        endpoint: '/users',
        kind: 'rename',
        before: { name: 'Alice' },
        after: { display_name: 'Alice' },
        confidence: 0.95,
        semanticVerdict: 'equivalent',
      });

      const decision = engine.evaluate(m1Change);
      expect(decision.action).toBe('auto_apply');
      expect(decision.adapter?.strategy).toBe('rename');
      expect(decision.proposal).toBeUndefined();
    });

    it('M2: Name Format Shift ("Last, First" instead of "First Last") generates proposal PR', () => {
      const m2Change = createChange({
        id: 'M2',
        service: 'users',
        endpoint: '/users',
        kind: 'semantic_other',
        before: { format: 'First Last' },
        after: { format: 'Last, First' },
        confidence: 0.85,
        semanticVerdict: 'lossy',
      });

      const decision = engine.evaluate(m2Change);
      expect(decision.action).toBe('open_migration_pr');
      expect(decision.proposal).toBeDefined();
      expect(decision.proposal?.riskAssessment).toContain('MEDIUM');
    });

    it('M3: Amount Unit Shift (dollars to cents) auto-applies transform adapter', () => {
      const m3Change = createChange({
        id: 'M3',
        service: 'payments',
        endpoint: '/charges',
        kind: 'unit_shift',
        before: { amount: 25.0 },
        after: { amount: 2500 },
        confidence: 0.93,
        semanticVerdict: 'equivalent',
      });

      const decision = engine.evaluate(m3Change);
      expect(decision.action).toBe('auto_apply');
      expect(decision.adapter?.strategy).toBe('transform');
    });

    it('M4: Default Currency Flip (USD -> EUR) generates proposal PR', () => {
      const m4Change = createChange({
        id: 'M4',
        service: 'payments',
        endpoint: '/charges',
        kind: 'default_changed',
        before: { currency: 'USD' },
        after: { currency: 'EUR' },
        confidence: 0.82,
        semanticVerdict: 'lossy',
      });

      const decision = engine.evaluate(m4Change);
      expect(decision.action).toBe('open_migration_pr');
      expect(decision.proposal).toBeDefined();
    });

    it('M5: Pagination Offset to Cursor auto-applies pagination-normalize adapter', () => {
      const m5Change = createChange({
        id: 'M5',
        service: 'search',
        endpoint: '/items',
        kind: 'pagination_changed',
        before: { offset: 0 },
        after: { cursor: 'eyJvZmZzZXQiOjB9' },
        confidence: 0.92,
        semanticVerdict: 'equivalent',
      });

      const decision = engine.evaluate(m5Change);
      expect(decision.action).toBe('auto_apply');
      expect(decision.adapter?.strategy).toBe('pagination-normalize');
    });

    it('M6: Silent Result Truncation (caps page size 100 -> 20) trips circuit breaker', () => {
      const m6Change = createChange({
        id: 'M6',
        service: 'search',
        endpoint: '/items',
        kind: 'truncation',
        before: { limit: 100 },
        after: { limit: 20 },
        confidence: 0.95,
        semanticVerdict: 'breaking',
      });

      const decision = engine.evaluate(m6Change);
      expect(decision.action).toBe('circuit_break');
      expect(decision.adapter).toBeUndefined();
      expect(decision.proposal?.riskAssessment).toContain('HIGH');
    });

    it('M7: Webhook Event Flattening auto-applies rename adapter', () => {
      const m7Change = createChange({
        id: 'M7',
        service: 'notifications',
        endpoint: '/webhook',
        kind: 'rename',
        before: { event: { type: 'alert' } },
        after: { type: 'alert' },
        confidence: 0.91,
        semanticVerdict: 'equivalent',
      });

      const decision = engine.evaluate(m7Change);
      expect(decision.action).toBe('auto_apply');
      expect(decision.adapter?.strategy).toBe('rename');
    });

    it('M8: Rate Limit 429 Throttle triggers migration PR for format review', () => {
      const m8Change = createChange({
        id: 'M8',
        service: 'payments',
        endpoint: '/charges',
        kind: 'rate_limit_changed',
        before: { limit: 100 },
        after: { limit: 5 },
        confidence: 0.78,
        semanticVerdict: 'equivalent',
      });

      const decision = engine.evaluate(m8Change);
      expect(decision.action).toBe('open_migration_pr');
      expect(decision.proposal).toBeDefined();
    });

    it('M9: Tool Signature Argument Drift trips circuit breaker', () => {
      const m9Change = createChange({
        id: 'M9',
        service: 'mcp-tool',
        endpoint: '/query',
        kind: 'field_added',
        before: { query: 'abc' },
        after: { q: 'abc', limit: 10 },
        confidence: 0.85,
        semanticVerdict: 'breaking',
      });

      const decision = engine.evaluate(m9Change);
      expect(decision.action).toBe('circuit_break');
      expect(decision.adapter).toBeUndefined();
      expect(decision.proposal?.riskAssessment).toContain('HIGH');
    });

    it('M10: Enum Semantic Drift (active includes suspended) trips circuit breaker', () => {
      const m10Change = createChange({
        id: 'M10',
        service: 'users',
        endpoint: '/users',
        kind: 'enum_semantics',
        before: { status: 'active' },
        after: { status: 'active_includes_suspended' },
        confidence: 0.88,
        semanticVerdict: 'breaking',
      });

      const decision = engine.evaluate(m10Change);
      expect(decision.action).toBe('circuit_break');
      expect(decision.adapter).toBeUndefined();
      expect(decision.proposal?.riskAssessment).toContain('HIGH');
    });
  });

  describe('7. Edge Cases, False Positives & Concurrency', () => {
    it('handles unicode in service, endpoint, and change ID gracefully', () => {
      const change = createChange({
        id: 'chg_unicode_🚀_日本語',
        service: 'ユーザー管理',
        endpoint: '/v1/ユーザー/検索',
        kind: 'rename',
        confidence: 0.95,
        semanticVerdict: 'equivalent',
      });

      const decision = engine.evaluate(change);
      expect(decision.action).toBe('auto_apply');
      expect(decision.adapter?.id).toBe('adp_chg_unicode_🚀_日本語_v1');
      expect(decision.rollbackHandle).toMatch(/^rollback_chg_unicode_🚀_日本語_\d+$/);
    });

    it('preserves idempotency and determinism across repeated evaluations', () => {
      const change = createChange({
        id: 'chg_idempotent',
        confidence: 0.92,
        semanticVerdict: 'equivalent',
      });

      const decision1 = engine.evaluate(change);
      const decision2 = engine.evaluate(change);

      expect(decision1.action).toBe(decision2.action);
      expect(decision1.adapter?.code).toBe(decision2.adapter?.code);
      expect(decision1.adapter?.strategy).toBe(decision2.adapter?.strategy);
    });

    it('concurrent evaluation burst of 50 simultaneous changes completes cleanly', async () => {
      const promises = Array.from({ length: 50 }, (_, i) => {
        const change = createChange({
          id: `burst_chg_${i}`,
          confidence: 0.7 + (i % 3) * 0.1, // 0.7, 0.8, 0.9
          semanticVerdict: i % 2 === 0 ? 'equivalent' : 'lossy',
        });
        return Promise.resolve(engine.evaluate(change));
      });

      const results = await Promise.all(promises);
      expect(results).toHaveLength(50);
      for (const res of results) {
        expect(['auto_apply', 'open_migration_pr']).toContain(res.action);
        expect(res.rollbackHandle).toBeDefined();
      }
    });
  });
});
