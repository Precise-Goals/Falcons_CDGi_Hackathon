import { describe, it, expect } from 'vitest';
import { inferContract } from './infer.js';
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
});
