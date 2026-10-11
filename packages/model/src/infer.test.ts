import { describe, it, expect } from 'vitest';
import { inferContract } from './infer.js';
import {
  analyzeNullability,
  validateNullabilityInvariant,
  evaluateQuantileConstancy,
} from './invariants.js';
import { Observation } from '@intra/shared';

describe('Model Inference & Behavioural Fingerprinting', () => {
  it('infers schema and field stats from user observations', () => {
    const observations: Observation[] = [
      {
        id: 'obs_1',
        service: 'users',
        endpoint: '/users',
        method: 'GET',
        status: 200,
        headers: {},
        body: [
          { id: 'usr_1', name: 'Alice Walker', status: 'active' },
          { id: 'usr_2', name: 'Bob Stone', status: 'active' },
        ],
        latencyMs: 10,
        timestamp: '2026-10-10T19:00:00Z',
      },
    ];

    const contract = inferContract(observations);
    expect(contract.service).toBe('users');
    expect(contract.endpoint).toBe('/users');
    expect(contract.schema.types.name).toBe('string');
    expect(contract.schema.types.status).toBe('string');
    expect(contract.fieldStats.status.cardinality).toBe('enum');
  });

  it('infers pagination style and rate limit policy from payments traffic', () => {
    const observations: Observation[] = [
      {
        id: 'obs_pay',
        service: 'payments',
        endpoint: '/payments/charge',
        method: 'POST',
        status: 200,
        headers: {},
        rateLimitHeaders: { 'x-ratelimit-limit': '10' },
        body: { id: 'chg_1', amount: 25.5, currency: 'USD' },
        latencyMs: 15,
        timestamp: '2026-10-10T19:00:00Z',
      },
    ];

    const contract = inferContract(observations);
    expect(contract.rateLimitPolicy?.limit).toBe(10);
    expect(contract.fieldStats.amount.units).toBe('dollars');
  });

  describe('Daikon Invariant Discovery: Enum & Nullability Profiling', () => {
    it('discovers ALWAYS_PRESENT_NON_NULL invariant on strict enum streams', () => {
      const records = [
        { role: 'admin' },
        { role: 'operator' },
        { role: 'viewer' },
        { role: 'admin' },
      ];
      const profile = analyzeNullability(records, 'role');
      expect(profile.invariant).toBe('ALWAYS_PRESENT_NON_NULL');
      expect(profile.isNeverNull).toBe(true);
      expect(profile.nullRatio).toBe(0);
      expect(validateNullabilityInvariant(profile, 0.0)).toBe(true);
    });

    it('identifies SOMETIMES_NULL invariant on edge-case null or missing enum payloads', () => {
      const records = [
        { tier: 'gold' },
        { tier: null },
        { tier: 'silver' },
        {}, // missing field
        { tier: 'platinum' },
      ];
      const profile = analyzeNullability(records, 'tier');
      expect(profile.invariant).toBe('SOMETIMES_NULL');
      expect(profile.isNeverNull).toBe(false);
      expect(profile.nullCount).toBe(1);
      expect(profile.undefinedCount).toBe(1);
      expect(profile.presentCount).toBe(3);
      expect(profile.nullRatio).toBe(0.4);
      expect(validateNullabilityInvariant(profile, 0.1)).toBe(false);
      expect(validateNullabilityInvariant(profile, 0.5)).toBe(true);
    });

    it('handles EXCLUSIVELY_NULL and NEVER_PRESENT boundary conditions', () => {
      const allNulls = [{ legacy_flag: null }, { legacy_flag: null }];
      const profNull = analyzeNullability(allNulls, 'legacy_flag');
      expect(profNull.invariant).toBe('EXCLUSIVELY_NULL');
      expect(profNull.isAlwaysNull).toBe(true);

      const allMissing = [{ other: 1 }, { other: 2 }];
      const profMiss = analyzeNullability(allMissing, 'legacy_flag');
      expect(profMiss.invariant).toBe('NEVER_PRESENT');
      expect(profMiss.isAlwaysNull).toBe(true);
    });
  });

  describe('M3 Unit Shift Quantile Constancy Evaluator', () => {
    it('detects 100x scale shift from floating dollars to integer cents', () => {
      const dollarsQuantiles = [5.0, 12.5, 25.0, 49.99, 100.0];
      const centsQuantiles = [500, 1250, 2500, 4999, 10000];

      const res = evaluateQuantileConstancy(dollarsQuantiles, centsQuantiles);
      expect(res.isUnitShift).toBe(true);
      expect(res.scaleFactor).toBe(100);
      expect(res.variance).toBe(0);
      expect(res.confidence).toBe(1);
    });

    it('detects 0.01x scale shift from integer cents to floating dollars', () => {
      const centsQuantiles = [1000, 2000, 5000];
      const dollarsQuantiles = [10.0, 20.0, 50.0];

      const res = evaluateQuantileConstancy(centsQuantiles, dollarsQuantiles);
      expect(res.isUnitShift).toBe(true);
      expect(res.scaleFactor).toBe(0.01);
      expect(res.confidence).toBe(1);
    });

    it('rejects organic non-uniform price shifts as not a unit shift', () => {
      const before = [10, 20, 30, 40, 50];
      const organic = [12, 19, 45, 60, 52]; // unequal ratios: 1.2, 0.95, 1.5, etc.

      const res = evaluateQuantileConstancy(before, organic, 0.02);
      expect(res.isUnitShift).toBe(false);
      expect(res.confidence).toBe(0);
    });

    it('handles identical quantiles as non-unit shift (scale 1.0)', () => {
      const before = [10, 20, 30];
      const identical = [10, 20, 30];

      const res = evaluateQuantileConstancy(before, identical);
      expect(res.isUnitShift).toBe(false);
      expect(res.scaleFactor).toBe(1.0);
    });

    it('handles empty and mismatched quantile lengths gracefully', () => {
      const resEmpty = evaluateQuantileConstancy([], []);
      expect(resEmpty.isUnitShift).toBe(false);

      const resMismatch = evaluateQuantileConstancy([1, 2], [1, 2, 3]);
      expect(resMismatch.isUnitShift).toBe(false);
    });
  });
});


