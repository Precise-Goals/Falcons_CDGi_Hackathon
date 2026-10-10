import { describe, it, expect } from 'vitest';
import { detectChanges } from './differ.js';
import { Contract, ChangeSchema } from '@intra/shared';

describe('@intra/differ Adversarial False-Positive & Edge-Case Drift Tests', () => {
  const createBaseContract = (overrides?: Partial<Contract>): Contract => ({
    service: 'catalog-service',
    endpoint: '/api/v1/items',
    schema: {
      types: {
        id: 'string',
        name: 'string',
        status: 'string',
        amount: 'float',
      },
      optionality: [],
      enums: { status: ['active', 'suspended'] },
      formats: {},
    },
    fieldStats: {
      id: {
        valueDistributions: { 'item_1': 1, 'item_2': 1 },
        cardinality: 'unique',
      },
      name: {
        valueDistributions: { 'Product Alpha': 10, 'Product Beta': 12 },
        cardinality: 'low',
      },
      status: {
        valueDistributions: { active: 20, suspended: 2 },
        cardinality: 'enum',
      },
      amount: {
        units: 'dollars',
        valueDistributions: { '19.99': 15, '49.99': 7 },
        cardinality: 'low',
      },
    },
    errorTaxonomy: {},
    paginationStyle: 'offset',
    rateLimitPolicy: {
      limit: 100,
      window: '1m',
    },
    updatedAt: '2026-10-10T12:00:00.000Z',
    ...overrides,
  });

  describe('1. False Positive Resistance', () => {
    it('produces 0 changes when contracts are completely identical', () => {
      const base = createBaseContract();
      const current = createBaseContract();

      const changes = detectChanges(base, current, ['obs_fp_1', 'obs_fp_2']);
      expect(changes).toEqual([]);
      expect(changes.length).toBe(0);
    });

    it('produces 0 changes when only metadata updatedAt timestamp changes', () => {
      const base = createBaseContract({ updatedAt: '2026-01-01T00:00:00.000Z' });
      const current = createBaseContract({ updatedAt: '2026-10-10T23:59:59.999Z' });

      const changes = detectChanges(base, current, ['obs_fp_time']);
      expect(changes).toEqual([]);
      expect(changes.length).toBe(0);
    });

    it('does not trigger rename when independent new field (e.g. avatar_url) is added without missing fields', () => {
      const base = createBaseContract();
      const current = createBaseContract({
        schema: {
          types: {
            ...base.schema.types,
            avatar_url: 'string',
          },
          optionality: ['avatar_url'],
          enums: base.schema.enums,
          formats: base.schema.formats,
        },
        fieldStats: {
          ...base.fieldStats,
          avatar_url: {
            valueDistributions: { 'https://cdn.example.com/a.png': 5 },
            cardinality: 'low',
          },
        },
      });

      const changes = detectChanges(base, current, ['obs_add_avatar']);
      const renames = changes.filter((c) => c.kind === 'rename');
      expect(renames).toHaveLength(0);
    });

    it('does not trigger rename when field is removed without any new field added', () => {
      const base = createBaseContract();
      const { status: _, ...remainingTypes } = base.schema.types;
      const current = createBaseContract({
        schema: {
          types: remainingTypes,
          optionality: [],
          enums: {},
          formats: {},
        },
        fieldStats: {
          id: base.fieldStats.id,
          name: base.fieldStats.name,
          amount: base.fieldStats.amount,
        },
      });

      const changes = detectChanges(base, current, ['obs_del_field']);
      const renames = changes.filter((c) => c.kind === 'rename');
      expect(renames).toHaveLength(0);
    });

    it('does not trigger rename for dissimilar missing/new field pairs (similarity < 0.3)', () => {
      // baseline has account_id; current drops account_id and adds theme_preference
      const base = createBaseContract({
        schema: {
          types: { id: 'string', account_id: 'string' },
          optionality: [],
          enums: {},
          formats: {},
        },
        fieldStats: {
          id: { valueDistributions: { '1': 1 }, cardinality: 'unique' },
          account_id: { valueDistributions: { 'acc_1': 1 }, cardinality: 'unique' },
        },
      });

      const current = createBaseContract({
        schema: {
          types: { id: 'string', theme_preference: 'string' },
          optionality: [],
          enums: {},
          formats: {},
        },
        fieldStats: {
          id: { valueDistributions: { '1': 1 }, cardinality: 'unique' },
          theme_preference: { valueDistributions: { 'dark': 1 }, cardinality: 'low' },
        },
      });

      const changes = detectChanges(base, current, ['obs_dissimilar']);
      const renames = changes.filter((c) => c.kind === 'rename');
      expect(renames).toHaveLength(0);
    });

    it('does not trigger unit_shift for non-amount float to integer conversion (e.g. score, ratio)', () => {
      const base = createBaseContract({
        schema: {
          types: { id: 'string', score: 'float', ratio: 'float' },
          optionality: [],
          enums: {},
          formats: {},
        },
        fieldStats: {
          score: { valueDistributions: { '0.85': 10 }, cardinality: 'low' },
          ratio: { valueDistributions: { '1.5': 5 }, cardinality: 'low' },
        },
      });

      const current = createBaseContract({
        schema: {
          types: { id: 'string', score: 'integer', ratio: 'integer' },
          optionality: [],
          enums: {},
          formats: {},
        },
        fieldStats: {
          score: { valueDistributions: { '1': 10 }, cardinality: 'low' },
          ratio: { valueDistributions: { '2': 5 }, cardinality: 'low' },
        },
      });

      const changes = detectChanges(base, current, ['obs_score_fp']);
      const unitShifts = changes.filter((c) => c.kind === 'unit_shift');
      expect(unitShifts).toHaveLength(0);
    });

    it('does not trigger unit_shift when units and types are identical', () => {
      const base = createBaseContract({
        schema: {
          types: { amount: 'float' },
          optionality: [],
          enums: {},
          formats: {},
        },
        fieldStats: {
          amount: {
            units: 'dollars',
            valueDistributions: { '25.0': 5 },
            cardinality: 'low',
          },
        },
      });

      const current = createBaseContract({
        schema: {
          types: { amount: 'float' },
          optionality: [],
          enums: {},
          formats: {},
        },
        fieldStats: {
          amount: {
            units: 'dollars',
            valueDistributions: { '30.0': 8 },
            cardinality: 'low',
          },
        },
      });

      const changes = detectChanges(base, current, ['obs_ident_units']);
      const unitShifts = changes.filter((c) => c.kind === 'unit_shift');
      expect(unitShifts).toHaveLength(0);
    });

    it('does not trigger enum_semantics drift when active and suspended values both remain present', () => {
      const base = createBaseContract();
      const current = createBaseContract({
        fieldStats: {
          ...base.fieldStats,
          status: {
            valueDistributions: { active: 35, suspended: 5 },
            cardinality: 'enum',
          },
        },
      });

      const changes = detectChanges(base, current, ['obs_enum_stable']);
      const enumChanges = changes.filter((c) => c.kind === 'enum_semantics');
      expect(enumChanges).toHaveLength(0);
    });
  });

  describe('2. Rename Detection Accuracy', () => {
    it('detects query -> q rename with confidence >= 0.88 and verdict equivalent', () => {
      const base = createBaseContract({
        schema: {
          types: { id: 'string', query: 'string' },
          optionality: [],
          enums: {},
          formats: {},
        },
        fieldStats: {},
      });

      const current = createBaseContract({
        schema: {
          types: { id: 'string', q: 'string' },
          optionality: [],
          enums: {},
          formats: {},
        },
        fieldStats: {},
      });

      const changes = detectChanges(base, current, ['obs_query_rename']);
      const rename = changes.find((c) => c.kind === 'rename');

      expect(rename).toBeDefined();
      expect(rename?.before).toEqual({ field: 'query', type: 'string' });
      expect(rename?.after).toEqual({ field: 'q', type: 'string' });
      expect(rename?.confidence).toBeGreaterThanOrEqual(0.88);
      expect(rename?.semanticVerdict).toBe('equivalent');
    });

    it('detects name -> display_name rename with confidence 0.95 and verdict equivalent', () => {
      const base = createBaseContract({
        schema: {
          types: { id: 'string', name: 'string' },
          optionality: [],
          enums: {},
          formats: {},
        },
        fieldStats: {
          name: { valueDistributions: { 'Alice Walker': 1 }, cardinality: 'low' },
        },
      });

      const current = createBaseContract({
        schema: {
          types: { id: 'string', display_name: 'string' },
          optionality: [],
          enums: {},
          formats: {},
        },
        fieldStats: {
          display_name: { valueDistributions: { 'Alice Walker': 1 }, cardinality: 'low' },
        },
      });

      const changes = detectChanges(base, current, ['obs_name_rename']);
      const rename = changes.find((c) => c.kind === 'rename');

      expect(rename).toBeDefined();
      expect(rename?.before).toEqual({ field: 'name', type: 'string' });
      expect(rename?.after).toEqual({ field: 'display_name', type: 'string' });
      expect(rename?.confidence).toBe(0.95);
      expect(rename?.semanticVerdict).toBe('equivalent');
    });

    it('detects multi-field rename simultaneously (query -> q and name -> display_name)', () => {
      const base = createBaseContract({
        schema: {
          types: { id: 'string', name: 'string', query: 'string' },
          optionality: [],
          enums: {},
          formats: {},
        },
        fieldStats: {
          name: { valueDistributions: { 'Alice Walker': 1 }, cardinality: 'low' },
        },
      });

      const current = createBaseContract({
        schema: {
          types: { id: 'string', display_name: 'string', q: 'string' },
          optionality: [],
          enums: {},
          formats: {},
        },
        fieldStats: {
          display_name: { valueDistributions: { 'Alice Walker': 1 }, cardinality: 'low' },
        },
      });

      const sampleIds = ['obs_multi_1', 'obs_multi_2'];
      const changes = detectChanges(base, current, sampleIds);
      const renames = changes.filter((c) => c.kind === 'rename');

      expect(renames).toHaveLength(2);

      const nameRename = renames.find(
        (c) =>
          typeof c.before === 'object' &&
          c.before !== null &&
          'field' in c.before &&
          (c.before as { field: string }).field === 'name'
      );
      expect(nameRename).toBeDefined();
      expect(nameRename?.after).toEqual({ field: 'display_name', type: 'string' });
      expect(nameRename?.confidence).toBe(0.95);
      expect(nameRename?.semanticVerdict).toBe('equivalent');

      const queryRename = renames.find(
        (c) =>
          typeof c.before === 'object' &&
          c.before !== null &&
          'field' in c.before &&
          (c.before as { field: string }).field === 'query'
      );
      expect(queryRename).toBeDefined();
      expect(queryRename?.after).toEqual({ field: 'q', type: 'string' });
      expect(queryRename?.confidence).toBeGreaterThanOrEqual(0.88);
      expect(queryRename?.semanticVerdict).toBe('equivalent');
    });

    it('detects high string similarity renames with confidence >= 0.88 (e.g. postal_code -> post_code)', () => {
      const base = createBaseContract({
        schema: {
          types: { id: 'string', postal_code: 'string' },
          optionality: [],
          enums: {},
          formats: {},
        },
        fieldStats: {},
      });

      const current = createBaseContract({
        schema: {
          types: { id: 'string', post_code: 'string' },
          optionality: [],
          enums: {},
          formats: {},
        },
        fieldStats: {},
      });

      const changes = detectChanges(base, current, ['obs_sim_rename']);
      const rename = changes.find((c) => c.kind === 'rename');

      expect(rename).toBeDefined();
      expect(rename?.confidence).toBeGreaterThanOrEqual(0.88);
      expect(rename?.semanticVerdict).toBe('equivalent');
    });
  });

  describe('3. Unit Shift Edge Cases', () => {
    it('triggers unit_shift when amount changes from float to integer', () => {
      const base = createBaseContract({
        schema: {
          types: { id: 'string', amount: 'float' },
          optionality: [],
          enums: {},
          formats: {},
        },
        fieldStats: {
          amount: {
            valueDistributions: { '19.99': 5 },
            cardinality: 'low',
          },
        },
      });

      const current = createBaseContract({
        schema: {
          types: { id: 'string', amount: 'integer' },
          optionality: [],
          enums: {},
          formats: {},
        },
        fieldStats: {
          amount: {
            valueDistributions: { '1999': 5 },
            cardinality: 'low',
          },
        },
      });

      const changes = detectChanges(base, current, ['obs_float_int']);
      const unitChange = changes.find((c) => c.kind === 'unit_shift');

      expect(unitChange).toBeDefined();
      expect(unitChange?.before).toEqual({ field: 'amount', unit: 'float' });
      expect(unitChange?.after).toEqual({ field: 'amount', unit: 'integer' });
      expect(unitChange?.semanticVerdict).toBe('equivalent');
      expect(unitChange?.confidence).toBe(0.92);
      expect(unitChange?.evidence.stats.multiplier).toBe(100);
    });

    it('triggers unit_shift for case-insensitive amount fields (e.g. TotalAmount, transaction_amount)', () => {
      const base = createBaseContract({
        schema: {
          types: { id: 'string', TotalAmount: 'float', transaction_amount: 'float' },
          optionality: [],
          enums: {},
          formats: {},
        },
        fieldStats: {
          TotalAmount: { valueDistributions: { '5.5': 2 }, cardinality: 'low' },
          transaction_amount: { valueDistributions: { '12.0': 3 }, cardinality: 'low' },
        },
      });

      const current = createBaseContract({
        schema: {
          types: { id: 'string', TotalAmount: 'integer', transaction_amount: 'integer' },
          optionality: [],
          enums: {},
          formats: {},
        },
        fieldStats: {
          TotalAmount: { valueDistributions: { '550': 2 }, cardinality: 'low' },
          transaction_amount: { valueDistributions: { '1200': 3 }, cardinality: 'low' },
        },
      });

      const changes = detectChanges(base, current, ['obs_case_amount']);
      const unitChanges = changes.filter((c) => c.kind === 'unit_shift');

      expect(unitChanges).toHaveLength(2);
      expect(unitChanges.map((u) => (u.before as { field: string }).field).sort()).toEqual([
        'TotalAmount',
        'transaction_amount',
      ]);
    });

    it('triggers unit_shift when amount has explicit units dollars -> cents', () => {
      const base = createBaseContract({
        schema: {
          types: { id: 'string', amount: 'number' },
          optionality: [],
          enums: {},
          formats: {},
        },
        fieldStats: {
          amount: {
            units: 'dollars',
            valueDistributions: { '42.50': 4 },
            cardinality: 'low',
          },
        },
      });

      const current = createBaseContract({
        schema: {
          types: { id: 'string', amount: 'number' },
          optionality: [],
          enums: {},
          formats: {},
        },
        fieldStats: {
          amount: {
            units: 'cents',
            valueDistributions: { '4250': 4 },
            cardinality: 'low',
          },
        },
      });

      const changes = detectChanges(base, current, ['obs_explicit_units']);
      const unitChange = changes.find((c) => c.kind === 'unit_shift');

      expect(unitChange).toBeDefined();
      expect(unitChange?.before).toEqual({ field: 'amount', unit: 'dollars' });
      expect(unitChange?.after).toEqual({ field: 'amount', unit: 'cents' });
      expect(unitChange?.semanticVerdict).toBe('equivalent');
    });

    it('does not trigger unit_shift if units and types are identical', () => {
      const base = createBaseContract({
        schema: {
          types: { id: 'string', amount: 'integer' },
          optionality: [],
          enums: {},
          formats: {},
        },
        fieldStats: {
          amount: {
            units: 'cents',
            valueDistributions: { '100': 1 },
            cardinality: 'low',
          },
        },
      });

      const current = createBaseContract({
        schema: {
          types: { id: 'string', amount: 'integer' },
          optionality: [],
          enums: {},
          formats: {},
        },
        fieldStats: {
          amount: {
            units: 'cents',
            valueDistributions: { '200': 1 },
            cardinality: 'low',
          },
        },
      });

      const changes = detectChanges(base, current, ['obs_same_units']);
      const unitChanges = changes.filter((c) => c.kind === 'unit_shift');
      expect(unitChanges).toHaveLength(0);
    });
  });

  describe('4. Rate Limit Changes (M8)', () => {
    it('triggers rate_limit_changed from baseline undefined rateLimitPolicy to current { limit: 10, windowMs: 60000 }', () => {
      const base = createBaseContract({
        rateLimitPolicy: undefined,
        schema: { types: { id: 'string' }, optionality: [], enums: {}, formats: {} },
        fieldStats: {},
      });

      const currentRateLimit = { limit: 10, window: '60000ms', windowMs: 60000 };
      const current = createBaseContract({
        rateLimitPolicy: currentRateLimit as unknown as Contract['rateLimitPolicy'],
        schema: { types: { id: 'string' }, optionality: [], enums: {}, formats: {} },
        fieldStats: {},
      });

      const changes = detectChanges(base, current, ['obs_rl_1']);
      const rlChange = changes.find((c) => c.kind === 'rate_limit_changed');

      expect(rlChange).toBeDefined();
      expect(rlChange?.before).toBeUndefined();
      expect(rlChange?.after).toEqual(currentRateLimit);
      expect(rlChange?.evidence.stats.newLimit).toBe(10);
      expect(rlChange?.semanticVerdict).toBe('equivalent');
      expect(rlChange?.confidence).toBe(0.95);
    });

    it('triggers rate_limit_changed from limit 100 to limit 20', () => {
      const base = createBaseContract({
        rateLimitPolicy: { limit: 100, window: '1m' },
        schema: { types: { id: 'string' }, optionality: [], enums: {}, formats: {} },
        fieldStats: {},
      });

      const current = createBaseContract({
        rateLimitPolicy: { limit: 20, window: '1m' },
        schema: { types: { id: 'string' }, optionality: [], enums: {}, formats: {} },
        fieldStats: {},
      });

      const changes = detectChanges(base, current, ['obs_rl_drop']);
      const rlChange = changes.find((c) => c.kind === 'rate_limit_changed');

      expect(rlChange).toBeDefined();
      expect(rlChange?.before).toEqual({ limit: 100, window: '1m' });
      expect(rlChange?.after).toEqual({ limit: 20, window: '1m' });
      expect(rlChange?.evidence.stats.newLimit).toBe(20);
      expect(rlChange?.semanticVerdict).toBe('equivalent');
    });

    it('does not trigger rate_limit_changed when limit is identical', () => {
      const base = createBaseContract({
        rateLimitPolicy: { limit: 50, window: '1m' },
        schema: { types: { id: 'string' }, optionality: [], enums: {}, formats: {} },
        fieldStats: {},
      });

      const current = createBaseContract({
        rateLimitPolicy: { limit: 50, window: '1m' },
        schema: { types: { id: 'string' }, optionality: [], enums: {}, formats: {} },
        fieldStats: {},
      });

      const changes = detectChanges(base, current, ['obs_rl_identical']);
      const rlChanges = changes.filter((c) => c.kind === 'rate_limit_changed');
      expect(rlChanges).toHaveLength(0);
    });

    it('does not trigger rate_limit_changed when current rateLimitPolicy is undefined', () => {
      const base = createBaseContract({
        rateLimitPolicy: { limit: 50, window: '1m' },
        schema: { types: { id: 'string' }, optionality: [], enums: {}, formats: {} },
        fieldStats: {},
      });

      const current = createBaseContract({
        rateLimitPolicy: undefined,
        schema: { types: { id: 'string' }, optionality: [], enums: {}, formats: {} },
        fieldStats: {},
      });

      const changes = detectChanges(base, current, ['obs_rl_removed']);
      const rlChanges = changes.filter((c) => c.kind === 'rate_limit_changed');
      expect(rlChanges).toHaveLength(0);
    });
  });

  describe('5. Pagination Changes (M5)', () => {
    it('triggers pagination_changed on offset -> cursor transition', () => {
      const base = createBaseContract({
        paginationStyle: 'offset',
        schema: { types: { id: 'string' }, optionality: [], enums: {}, formats: {} },
        fieldStats: {},
      });
      const current = createBaseContract({
        paginationStyle: 'cursor',
        schema: { types: { id: 'string' }, optionality: [], enums: {}, formats: {} },
        fieldStats: {},
      });

      const sampleIds = ['obs_pag_1', 'obs_pag_2'];
      const changes = detectChanges(base, current, sampleIds);
      const pagChange = changes.find((c) => c.kind === 'pagination_changed');

      expect(pagChange).toBeDefined();
      expect(pagChange?.before).toEqual({ paginationStyle: 'offset' });
      expect(pagChange?.after).toEqual({ paginationStyle: 'cursor' });
      expect(pagChange?.evidence.stats.sampleCount).toBe(2);
      expect(pagChange?.semanticVerdict).toBe('equivalent');
      expect(pagChange?.confidence).toBe(0.91);
    });

    it('produces no pagination change on cursor -> cursor transition', () => {
      const base = createBaseContract({
        paginationStyle: 'cursor',
        schema: { types: { id: 'string' }, optionality: [], enums: {}, formats: {} },
        fieldStats: {},
      });
      const current = createBaseContract({
        paginationStyle: 'cursor',
        schema: { types: { id: 'string' }, optionality: [], enums: {}, formats: {} },
        fieldStats: {},
      });

      const changes = detectChanges(base, current, ['obs_cursor_cursor']);
      const pagChanges = changes.filter((c) => c.kind === 'pagination_changed');
      expect(pagChanges).toHaveLength(0);
    });

    it('triggers pagination_changed on none -> cursor transition', () => {
      const base = createBaseContract({
        paginationStyle: 'none',
        schema: { types: { id: 'string' }, optionality: [], enums: {}, formats: {} },
        fieldStats: {},
      });
      const current = createBaseContract({
        paginationStyle: 'cursor',
        schema: { types: { id: 'string' }, optionality: [], enums: {}, formats: {} },
        fieldStats: {},
      });

      const changes = detectChanges(base, current, ['obs_none_to_cursor']);
      const pagChange = changes.find((c) => c.kind === 'pagination_changed');

      expect(pagChange).toBeDefined();
      expect(pagChange?.before).toEqual({ paginationStyle: 'none' });
      expect(pagChange?.after).toEqual({ paginationStyle: 'cursor' });
      expect(pagChange?.semanticVerdict).toBe('equivalent');
    });

    it('triggers pagination_changed on page -> cursor transition', () => {
      const base = createBaseContract({
        paginationStyle: 'page',
        schema: { types: { id: 'string' }, optionality: [], enums: {}, formats: {} },
        fieldStats: {},
      });
      const current = createBaseContract({
        paginationStyle: 'cursor',
        schema: { types: { id: 'string' }, optionality: [], enums: {}, formats: {} },
        fieldStats: {},
      });

      const changes = detectChanges(base, current, ['obs_page_to_cursor']);
      const pagChange = changes.find((c) => c.kind === 'pagination_changed');

      expect(pagChange).toBeDefined();
      expect(pagChange?.before).toEqual({ paginationStyle: 'page' });
      expect(pagChange?.after).toEqual({ paginationStyle: 'cursor' });
    });

    it('does not trigger pagination_changed when transitioning to none', () => {
      const base = createBaseContract({
        paginationStyle: 'cursor',
        schema: { types: { id: 'string' }, optionality: [], enums: {}, formats: {} },
        fieldStats: {},
      });
      const current = createBaseContract({
        paginationStyle: 'none',
        schema: { types: { id: 'string' }, optionality: [], enums: {}, formats: {} },
        fieldStats: {},
      });

      const changes = detectChanges(base, current, ['obs_cursor_to_none']);
      const pagChanges = changes.filter((c) => c.kind === 'pagination_changed');
      expect(pagChanges).toHaveLength(0);
    });
  });

  describe('6. Evidence Verification & Schema Compliance', () => {
    it('attaches passed sample IDs to all generated changes in evidence.samples', () => {
      const base = createBaseContract({
        schema: {
          types: { id: 'string', query: 'string', amount: 'float' },
          optionality: [],
          enums: {},
          formats: {},
        },
        fieldStats: {},
        paginationStyle: 'offset',
        rateLimitPolicy: { limit: 100, window: '1m' },
      });

      const current = createBaseContract({
        schema: {
          types: { id: 'string', q: 'string', amount: 'integer' },
          optionality: [],
          enums: {},
          formats: {},
        },
        fieldStats: {},
        paginationStyle: 'cursor',
        rateLimitPolicy: { limit: 10, window: '1m' },
      });

      const sampleIds = ['obs_uuid_101', 'obs_uuid_102', 'obs_uuid_103'];
      const changes = detectChanges(base, current, sampleIds);

      expect(changes.length).toBeGreaterThanOrEqual(4);
      for (const change of changes) {
        expect(change.evidence.samples).toEqual(sampleIds);
      }
    });

    it('validates every generated change against ChangeSchema.parse()', () => {
      const base = createBaseContract({
        schema: {
          types: { id: 'string', name: 'string', query: 'string', amount: 'float' },
          optionality: [],
          enums: { status: ['active', 'suspended'] },
          formats: {},
        },
        fieldStats: {
          status: {
            valueDistributions: { active: 10, suspended: 2 },
            cardinality: 'enum',
          },
          name: {
            valueDistributions: { 'Alice Walker': 1 },
            cardinality: 'low',
          },
          amount: {
            units: 'dollars',
            valueDistributions: { '10.5': 5 },
            cardinality: 'low',
          },
        },
        paginationStyle: 'offset',
        rateLimitPolicy: { limit: 100, window: '1m' },
      });

      // Induce multi-drift: rename query->q, rename name->display_name, unit_shift, pagination, rate_limit
      const current = createBaseContract({
        schema: {
          types: { id: 'string', display_name: 'string', q: 'string', amount: 'integer' },
          optionality: [],
          enums: { status: ['active', 'suspended'] },
          formats: {},
        },
        fieldStats: {
          status: {
            valueDistributions: { active: 10, suspended: 2 },
            cardinality: 'enum',
          },
          display_name: {
            valueDistributions: { 'Alice Walker': 1 },
            cardinality: 'low',
          },
          amount: {
            units: 'cents',
            valueDistributions: { '1050': 5 },
            cardinality: 'low',
          },
        },
        paginationStyle: 'cursor',
        rateLimitPolicy: { limit: 20, window: '1m' },
      });

      const sampleIds = ['obs_verify_a', 'obs_verify_b'];
      const changes = detectChanges(base, current, sampleIds);

      expect(changes.length).toBeGreaterThanOrEqual(4);
      for (const change of changes) {
        expect(() => ChangeSchema.parse(change)).not.toThrow();
        const parsed = ChangeSchema.parse(change);
        expect(parsed.id).toMatch(/^chg_\d+_/);
        expect(parsed.service).toBe(current.service);
        expect(parsed.endpoint).toBe(current.endpoint);
        expect(parsed.confidence).toBeGreaterThanOrEqual(0);
        expect(parsed.confidence).toBeLessThanOrEqual(1);
        expect(parsed.evidence.samples).toEqual(sampleIds);
      }
    });

    it('handles empty sampleIds array gracefully and passes ChangeSchema.parse()', () => {
      const base = createBaseContract({
        paginationStyle: 'offset',
        schema: { types: { id: 'string' }, optionality: [], enums: {}, formats: {} },
        fieldStats: {},
      });
      const current = createBaseContract({
        paginationStyle: 'cursor',
        schema: { types: { id: 'string' }, optionality: [], enums: {}, formats: {} },
        fieldStats: {},
      });

      const changes = detectChanges(base, current);
      expect(changes.length).toBeGreaterThan(0);

      for (const change of changes) {
        expect(change.evidence.samples).toEqual([]);
        expect(() => ChangeSchema.parse(change)).not.toThrow();
      }
    });

    it('handles large sample ID bursts (1000 IDs) without loss or truncation', () => {
      const base = createBaseContract({
        paginationStyle: 'offset',
        schema: { types: { id: 'string' }, optionality: [], enums: {}, formats: {} },
        fieldStats: {},
      });
      const current = createBaseContract({
        paginationStyle: 'cursor',
        schema: { types: { id: 'string' }, optionality: [], enums: {}, formats: {} },
        fieldStats: {},
      });

      const largeSampleSet = Array.from({ length: 1000 }, (_, i) => `obs_burst_${i}`);
      const changes = detectChanges(base, current, largeSampleSet);

      expect(changes.length).toBe(1);
      const pagChange = changes[0];
      expect(pagChange.evidence.samples).toHaveLength(1000);
      expect(pagChange.evidence.samples[0]).toBe('obs_burst_0');
      expect(pagChange.evidence.samples[999]).toBe('obs_burst_999');
      expect(pagChange.evidence.stats.sampleCount).toBe(1000);
      expect(() => ChangeSchema.parse(pagChange)).not.toThrow();
    });
  });

  describe('7. Adversarial & Boundary Conditions', () => {
    it('handles contracts with unicode strings and special symbols in fields safely', () => {
      const base = createBaseContract({
        schema: {
          types: {
            'ユーザー_id': 'string',
            'über_field': 'string',
            'order$$amount': 'float',
          },
          optionality: [],
          enums: {},
          formats: {},
        },
        fieldStats: {
          'order$$amount': {
            units: 'dollars',
            valueDistributions: { '10.0': 1 },
            cardinality: 'low',
          },
        },
      });

      const current = createBaseContract({
        schema: {
          types: {
            'ユーザー_id': 'string',
            'über_field': 'string',
            'order$$amount': 'integer',
          },
          optionality: [],
          enums: {},
          formats: {},
        },
        fieldStats: {
          'order$$amount': {
            units: 'cents',
            valueDistributions: { '1000': 1 },
            cardinality: 'low',
          },
        },
      });

      const changes = detectChanges(base, current, ['obs_unicode']);
      expect(changes.length).toBe(1);
      expect(changes[0].kind).toBe('unit_shift');
      expect(() => ChangeSchema.parse(changes[0])).not.toThrow();
    });

    it('handles empty schema types without throwing errors', () => {
      const emptyBase = createBaseContract({
        schema: {
          types: {},
          optionality: [],
          enums: {},
          formats: {},
        },
        fieldStats: {},
        rateLimitPolicy: undefined,
        paginationStyle: 'none',
      });

      const emptyCurrent = createBaseContract({
        schema: {
          types: {},
          optionality: [],
          enums: {},
          formats: {},
        },
        fieldStats: {},
        rateLimitPolicy: undefined,
        paginationStyle: 'none',
      });

      const changes = detectChanges(emptyBase, emptyCurrent, []);
      expect(changes).toEqual([]);
    });
  });
});
