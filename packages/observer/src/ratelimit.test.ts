import { describe, it, expect } from 'vitest';
import { TokenBucketFilter } from './ratelimit.js';

describe('@intra/observer Token Bucket Rate Limiter', () => {
  it('enforces positive capacity and refill rates', () => {
    expect(() => new TokenBucketFilter({ capacity: 0, refillRatePerSec: 10 })).toThrow('must be positive');
    expect(() => new TokenBucketFilter({ capacity: 10, refillRatePerSec: -1 })).toThrow('must be positive');
  });

  it('permits burst traffic up to capacity then throttles', () => {
    const bucket = new TokenBucketFilter({ capacity: 5, refillRatePerSec: 1 });
    const now = 1000000;

    // Consume 5 tokens immediately
    expect(bucket.consume(1, now)).toBe(true);
    expect(bucket.consume(1, now)).toBe(true);
    expect(bucket.consume(1, now)).toBe(true);
    expect(bucket.consume(1, now)).toBe(true);
    expect(bucket.consume(1, now)).toBe(true);

    // 6th consume should be throttled
    expect(bucket.consume(1, now)).toBe(false);
    expect(bucket.getAvailableTokens(now)).toBeLessThan(1);
  });

  it('refills tokens linearly over elapsed time', () => {
    let now = 1000000;
    const bucket = new TokenBucketFilter({
      capacity: 10,
      refillRatePerSec: 5,
      initialTokens: 0,
      initialTimestamp: now,
    });

    // Initial state: 0 tokens
    expect(bucket.consume(1, now)).toBe(false);

    // Advance 1 second -> should have +5 tokens
    now += 1000;
    expect(bucket.getAvailableTokens(now)).toBeCloseTo(5.0, 1);
    expect(bucket.consume(3, now)).toBe(true);
    expect(bucket.getAvailableTokens(now)).toBeCloseTo(2.0, 1);

    // Advance 2 seconds -> should cap at capacity (10)
    now += 2000;
    expect(bucket.getAvailableTokens(now)).toBe(10);
  });

  it('supports reset to restore full capacity', () => {
    const bucket = new TokenBucketFilter({ capacity: 4, refillRatePerSec: 1 });
    const now = 1000000;

    expect(bucket.consume(4, now)).toBe(true);
    expect(bucket.consume(1, now)).toBe(false);

    bucket.reset(now);
    expect(bucket.getAvailableTokens(now)).toBe(4);
    expect(bucket.consume(1, now)).toBe(true);
  });
});
