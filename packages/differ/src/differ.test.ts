import { describe, it, expect } from 'vitest';
import { detectChanges } from './differ.js';
import { Contract } from '@intra/shared';

describe('@intra/differ Change Detection & Semantic Classification', () => {
  const makeBaseContract = (overrides?: Partial<Contract>): Contract => ({
    service: 'users',
    endpoint: '/users',
    schema: {
      types: { id: 'string', name: 'string', status: 'string' },
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
    },
    errorTaxonomy: {},
    paginationStyle: 'offset',
    updatedAt: new Date().toISOString(),
    ...overrides,
  });

  it('detects M1 rename candidate (name -> display_name) with high confidence and equivalent verdict', () => {
    const base = makeBaseContract();
    const mutated = makeBaseContract({
      schema: {
        types: { id: 'string', display_name: 'string', status: 'string' },
        optionality: [],
        enums: { status: ['active', 'suspended'] },
        formats: {},
      },
    });

    const changes = detectChanges(base, mutated, ['obs_1']);
    expect(changes.length).toBeGreaterThan(0);
    const renameChange = changes.find((c) => c.kind === 'rename');
    expect(renameChange).toBeDefined();
    expect(renameChange?.confidence).toBeGreaterThanOrEqual(0.9);
    expect(renameChange?.semanticVerdict).toBe('equivalent');
  });

  it('detects M3 unit shift (dollars -> cents) with equivalent verdict', () => {
    const base: Contract = {
      service: 'payments',
      endpoint: '/payments/charge',
      schema: {
        types: { amount: 'float', currency: 'string' },
        optionality: [],
        enums: {},
        formats: {},
      },
      fieldStats: {
        amount: {
          units: 'dollars',
          valueDistributions: { '10.5': 5 },
          cardinality: 'low',
        },
      },
      errorTaxonomy: {},
      paginationStyle: 'none',
      updatedAt: new Date().toISOString(),
    };

    const mutated: Contract = {
      ...base,
      schema: {
        ...base.schema,
        types: { amount: 'integer', currency: 'string' },
      },
      fieldStats: {
        amount: {
          units: 'cents',
          valueDistributions: { '1050': 5 },
          cardinality: 'low',
        },
      },
    };

    const changes = detectChanges(base, mutated, ['obs_pay']);
    const unitChange = changes.find((c) => c.kind === 'unit_shift');
    expect(unitChange).toBeDefined();
    expect(unitChange?.semanticVerdict).toBe('equivalent');
    expect(unitChange?.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('detects M5 pagination change (offset -> cursor)', () => {
    const base = makeBaseContract({ paginationStyle: 'offset' });
    const mutated = makeBaseContract({ paginationStyle: 'cursor' });

    const changes = detectChanges(base, mutated, ['obs_search']);
    const pagChange = changes.find((c) => c.kind === 'pagination_changed');
    expect(pagChange).toBeDefined();
    expect(pagChange?.semanticVerdict).toBe('equivalent');
  });

  it('detects M2 format shift as lossy verdict', () => {
    const base = makeBaseContract();
    const mutated = makeBaseContract({
      fieldStats: {
        ...base.fieldStats,
        name: {
          valueDistributions: { 'Walker, Alice': 1 },
          cardinality: 'low',
        },
      },
    });

    const changes = detectChanges(base, mutated, ['obs_m2']);
    const formatChange = changes.find((c) => c.kind === 'semantic_other');
    expect(formatChange).toBeDefined();
    expect(formatChange?.semanticVerdict).toBe('lossy');
  });

  it('detects M10 enum semantic drift as breaking verdict', () => {
    const base = makeBaseContract();
    const mutated = makeBaseContract({
      fieldStats: {
        ...base.fieldStats,
        status: {
          valueDistributions: { active: 12 }, // suspended disappeared
          cardinality: 'enum',
        },
      },
    });

    const changes = detectChanges(base, mutated, ['obs_m10']);
    const enumChange = changes.find((c) => c.kind === 'enum_semantics');
    expect(enumChange).toBeDefined();
    expect(enumChange?.semanticVerdict).toBe('breaking');
  });
});
