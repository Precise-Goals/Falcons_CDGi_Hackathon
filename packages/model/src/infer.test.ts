import { describe, it, expect } from 'vitest';
import { inferContract } from './infer.js';
import {
  analyzeNullability,
  validateNullabilityInvariant,
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
});

