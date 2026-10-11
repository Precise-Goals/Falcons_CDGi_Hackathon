import { describe, it, expect } from 'vitest';
import {
  detectChanges,
  calculateLevenshtein,
  normalizedLevenshteinDistance,
  stringSimilarity,
  clearLevenshteinCache,
} from './differ.js';
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

  describe('Levenshtein Similarity & Nested Property Renames', () => {
    it('accurately computes edit distance and normalized similarity on nested paths', () => {
      const p1 = 'billing.address.postal_code';
      const p2 = 'billing.address.post_code';
      const dist = calculateLevenshtein(p1, p2);
      expect(dist).toBe(2); // 'al' removed

      const normDist = normalizedLevenshteinDistance(p1, p2);
      expect(normDist).toBeCloseTo(2 / p1.length, 3);

      const sim = stringSimilarity(p1, p2);
      expect(sim).toBeGreaterThan(0.9);
    });

    it('leverages memoization across repeated distance computations', () => {
      clearLevenshteinCache();
      const a = 'customer.tax_identifier';
      const b = 'customer.tax_id';

      const d1 = calculateLevenshtein(a, b);
      const d2 = calculateLevenshtein(a, b);
      const dSymmetric = calculateLevenshtein(b, a);

      expect(d1).toBe(d2);
      expect(d1).toBe(dSymmetric);
    });

    it('detects renames between nested dot-delimited field structures', () => {
      const base = makeBaseContract({
        schema: {
          types: { id: 'string', 'account.billing_email': 'string' },
          optionality: [],
          enums: {},
          formats: {},
        },
      });

      const mutated = makeBaseContract({
        schema: {
          types: { id: 'string', 'account.billing_addr_email': 'string' },
          optionality: [],
          enums: {},
          formats: {},
        },
      });

      const changes = detectChanges(base, mutated, ['obs_nested']);
      const rename = changes.find((c) => c.kind === 'rename');
      expect(rename).toBeDefined();
      expect(rename?.semanticVerdict).toBe('equivalent');
    });
  });

  describe('Security Enum Drift & Breaking Change Classification', () => {
    it('flags revocation or terminal enum omission as breaking change for circuit breaker', () => {
      const base = makeBaseContract({
        schema: {
          types: { id: 'string', account_state: 'string' },
          optionality: [],
          enums: { account_state: ['ACTIVE', 'PENDING', 'SUSPENDED', 'REVOKED'] },
          formats: {},
        },
      });

      const mutated = makeBaseContract({
        schema: {
          types: { id: 'string', account_state: 'string' },
          optionality: [],
          enums: { account_state: ['ACTIVE', 'PENDING'] }, // dropped SUSPENDED & REVOKED
          formats: {},
        },
      });

      const changes = detectChanges(base, mutated, ['obs_security_drift']);
      const enumChange = changes.find((c) => c.kind === 'enum_semantics');
      expect(enumChange).toBeDefined();
      expect(enumChange?.semanticVerdict).toBe('breaking');
      expect(enumChange?.confidence).toBeGreaterThanOrEqual(0.95);
      expect((enumChange?.after as any).missingEnums).toContain('REVOKED');
      expect((enumChange?.after as any).missingEnums).toContain('SUSPENDED');
    });

    it('classifies benign non-security enum drops as lossy rather than breaking', () => {
      const base = makeBaseContract({
        schema: {
          types: { id: 'string', ui_theme: 'string' },
          optionality: [],
          enums: { ui_theme: ['light', 'dark', 'solarized'] },
          formats: {},
        },
      });

      const mutated = makeBaseContract({
        schema: {
          types: { id: 'string', ui_theme: 'string' },
          optionality: [],
          enums: { ui_theme: ['light', 'dark'] }, // solarized dropped
          formats: {},
        },
      });

      const changes = detectChanges(base, mutated, ['obs_ui']);
      const enumChange = changes.find((c) => c.kind === 'enum_semantics');
      expect(enumChange).toBeDefined();
      expect(enumChange?.semanticVerdict).toBe('lossy');
    });
  });
});

