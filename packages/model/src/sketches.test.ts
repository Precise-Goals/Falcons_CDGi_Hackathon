import { describe, it, expect } from 'vitest';
import { TDigest, HyperLogLog, fnv1a64 } from './sketches.js';

describe('Streaming Sketches (@intra/model)', () => {
  describe('TDigest: Streaming Quantile Estimation', () => {
    it('returns NaN on empty digest', () => {
      const td = new TDigest();
      expect(Number.isNaN(td.quantile(0.5))).toBe(true);
      expect(Number.isNaN(td.quantile(0))).toBe(true);
      expect(Number.isNaN(td.quantile(1))).toBe(true);
      expect(td.size).toBe(0);
      expect(td.count).toBe(0);
    });

    it('handles single item correctly across all quantiles', () => {
      const td = new TDigest();
      td.add(42);
      expect(td.quantile(0)).toBe(42);
      expect(td.quantile(0.5)).toBe(42);
      expect(td.quantile(1)).toBe(42);
      expect(td.min).toBe(42);
      expect(td.max).toBe(42);
      expect(td.totalWeight).toBe(1);
    });

    it('estimates exact quantiles on uniform sequence (1 to 1000)', () => {
      const td = new TDigest(200);
      for (let i = 1; i <= 1000; i++) {
        td.add(i);
      }
      td.compress();

      expect(td.min).toBe(1);
      expect(td.max).toBe(1000);
      expect(td.totalWeight).toBe(1000);

      // Quantile boundaries
      expect(td.quantile(0)).toBe(1);
      expect(td.quantile(1)).toBe(1000);

      // Deciles should be close to expected within 1% error
      const p10 = td.quantile(0.1);
      const p50 = td.quantile(0.5);
      const p90 = td.quantile(0.9);
      const p99 = td.quantile(0.99);

      expect(Math.abs(p10 - 100)).toBeLessThan(15);
      expect(Math.abs(p50 - 500)).toBeLessThan(15);
      expect(Math.abs(p90 - 900)).toBeLessThan(15);
      expect(Math.abs(p99 - 990)).toBeLessThan(10);
    });

    it('respects non-linear scale function by preserving extreme tail resolution', () => {
      const td = new TDigest(100);
      // Heavy tail distribution with extreme outliers
      for (let i = 0; i < 9900; i++) {
        td.add(10 + Math.random() * 5); // baseline ~10-15
      }
      for (let i = 0; i < 100; i++) {
        td.add(500 + Math.random() * 50); // p99+ spike ~500-550
      }
      td.compress();

      const p90 = td.quantile(0.9);
      const p995 = td.quantile(0.995);

      expect(p90).toBeLessThan(20);
      expect(p995).toBeGreaterThan(450);
    });

    it('correctly weighs samples when using add(x, weight)', () => {
      const td = new TDigest();
      td.add(10, 100); // 10 with weight 100
      td.add(20, 100); // 20 with weight 100
      td.compress();

      expect(td.totalWeight).toBe(200);
      expect(td.quantile(0.5)).toBeCloseTo(15, 0);
      expect(td.quantile(0.1)).toBeCloseTo(10, 0);
      expect(td.quantile(0.9)).toBeCloseTo(20, 0);
    });

    it('supports merging two independent digests', () => {
      const td1 = new TDigest();
      const td2 = new TDigest();

      for (let i = 1; i <= 500; i++) td1.add(i);
      for (let i = 501; i <= 1000; i++) td2.add(i);

      td1.merge(td2);
      expect(td1.totalWeight).toBe(1000);
      expect(td1.min).toBe(1);
      expect(td1.max).toBe(1000);
      expect(Math.abs(td1.quantile(0.5) - 500)).toBeLessThan(20);
    });

    it('estimates CDF correctly across intervals', () => {
      const td = new TDigest();
      for (let i = 1; i <= 100; i++) td.add(i);
      td.compress();

      expect(td.cdf(0)).toBe(0);
      expect(td.cdf(100)).toBe(1);
      expect(td.cdf(50)).toBeCloseTo(0.5, 1);
    });

    it('resets properly to clean state', () => {
      const td = new TDigest();
      td.add(100);
      td.reset();
      expect(td.totalWeight).toBe(0);
      expect(Number.isNaN(td.quantile(0.5))).toBe(true);
    });
  });

  describe('HyperLogLog: 64-Bit FNV-1a Cardinality Counter', () => {
    it('produces deterministic 64-bit FNV-1a hash values', () => {
      const h1 = fnv1a64('test-item');
      const h2 = fnv1a64('test-item');
      expect(h1).toBe(h2);
      expect(typeof h1).toBe('bigint');
      expect(h1).toBeGreaterThan(0n);

      const h3 = fnv1a64('different-item');
      expect(h1).not.toBe(h3);
    });

    it('estimates 0 for an empty sketch', () => {
      const hll = new HyperLogLog(12);
      expect(hll.estimateCardinality()).toBe(0);
      expect(hll.m).toBe(4096);
    });

    it('handles single item insertion', () => {
      const hll = new HyperLogLog(12);
      hll.add('user_123');
      const est = hll.estimateCardinality();
      expect(est).toBeGreaterThanOrEqual(1);
      expect(est).toBeLessThanOrEqual(2);
    });

    it('is idempotent under duplicate insertions', () => {
      const hll = new HyperLogLog(12);
      for (let i = 0; i < 500; i++) {
        hll.add('constant-duplicate-key');
      }
      expect(hll.estimateCardinality()).toBe(1);
    });

    it('estimates small-to-medium cardinality within theoretical error bound', () => {
      const b = 12; // m = 4096, theoretical std error = 1.04 / sqrt(4096) = ~1.625%
      const hll = new HyperLogLog(b);
      const trueCardinality = 2500;

      for (let i = 0; i < trueCardinality; i++) {
        hll.add(`customer_session_${i}`);
      }

      const estimate = hll.estimateCardinality();
      const relativeError = Math.abs(estimate - trueCardinality) / trueCardinality;

      // Allow 3 standard deviations (under 5%)
      expect(relativeError).toBeLessThan(0.05);
    });

    it('estimates large cardinality (~20,000 distinct items)', () => {
      const hll = new HyperLogLog(14); // m = 16384, std error ~ 0.8%
      const trueCardinality = 20000;

      for (let i = 0; i < trueCardinality; i++) {
        hll.add(`telemetry_event_${i}`);
      }

      const estimate = hll.estimateCardinality();
      const relativeError = Math.abs(estimate - trueCardinality) / trueCardinality;
      expect(relativeError).toBeLessThan(0.03);
    });

    it('supports heterogeneous types (numbers, objects, null)', () => {
      const hll = new HyperLogLog(10);
      hll.add(100);
      hll.add('100'); // Note: '100' and 100 serialize to '100'
      hll.add({ id: 1, key: 'val' });
      hll.add(null);
      hll.add(undefined);

      const est = hll.estimateCardinality();
      expect(est).toBeGreaterThanOrEqual(3);
    });

    it('supports merging two HyperLogLog sketches', () => {
      const hll1 = new HyperLogLog(12);
      const hll2 = new HyperLogLog(12);

      // Disjoint sets
      for (let i = 0; i < 1000; i++) hll1.add(`group_a_${i}`);
      for (let i = 0; i < 1000; i++) hll2.add(`group_b_${i}`);

      hll1.merge(hll2);
      const est = hll1.estimateCardinality();
      const relativeError = Math.abs(est - 2000) / 2000;
      expect(relativeError).toBeLessThan(0.05);
    });

    it('throws when merging sketches with different precision b', () => {
      const hll1 = new HyperLogLog(10);
      const hll2 = new HyperLogLog(12);
      expect(() => hll1.merge(hll2)).toThrowError(/precision/);
    });

    it('resets correctly to 0', () => {
      const hll = new HyperLogLog(10);
      for (let i = 0; i < 50; i++) hll.add(i);
      expect(hll.estimateCardinality()).toBeGreaterThan(0);
      hll.reset();
      expect(hll.estimateCardinality()).toBe(0);
    });
  });
});
