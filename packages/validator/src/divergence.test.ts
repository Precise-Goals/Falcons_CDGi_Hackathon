import { describe, it, expect } from 'vitest';
import {
  computeWasserstein1D,
  computeKolmogorovSmirnov,
  computeLatencyDivergence,
} from './divergence.js';

describe('@intra/validator Empirical Distribution Divergence Metrics', () => {
  describe('1D Wasserstein Distance (Earth Mover Distance)', () => {
    it('returns zero distance for identical empirical samples', () => {
      const dist = [10, 12, 14, 16, 18, 20];
      expect(computeWasserstein1D(dist, dist)).toBe(0);
    });

    it('returns exact translation distance for uniform shift', () => {
      const base = [10, 20, 30, 40, 50];
      const shifted = [15, 25, 35, 45, 55]; // +5ms shift
      const emd = computeWasserstein1D(base, shifted);
      expect(emd).toBeCloseTo(5.0, 1);
    });

    it('handles empty distributions gracefully', () => {
      expect(computeWasserstein1D([], [1, 2, 3])).toBe(0);
    });
  });

  describe('Two-Sample Kolmogorov-Smirnov Test', () => {
    it('computes low D statistic for identical distributions', () => {
      const sample = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      const ks = computeKolmogorovSmirnov(sample, sample);
      expect(ks.dStatistic).toBe(0);
      expect(ks.isSignificant).toBe(false);
    });

    it('detects statistically significant divergence when distributions are disjoint', () => {
      const base = [10, 12, 14, 16, 18, 20, 22, 24, 26, 28];
      const outlier = [100, 105, 110, 115, 120, 125, 130, 135, 140, 145];
      const ks = computeKolmogorovSmirnov(base, outlier);
      expect(ks.dStatistic).toBe(1.0); // complete separation
      expect(ks.isSignificant).toBe(true);
    });
  });

  describe('Full Latency Divergence Report', () => {
    it('generates structured LatencyDivergenceReport with p50 and p95 metrics', () => {
      const baseline = [20, 22, 25, 28, 30, 32, 35, 38, 40, 50];
      const canary = [22, 24, 27, 30, 32, 34, 38, 40, 45, 55];

      const report = computeLatencyDivergence(baseline, canary);

      expect(report.baselineP50).toBeGreaterThanOrEqual(28);
      expect(report.canaryP50).toBeGreaterThanOrEqual(30);
      expect(report.wassersteinDistanceMs).toBeGreaterThan(0);
      expect(report.kolmogorovSmirnovD).toBeGreaterThanOrEqual(0);
      expect(typeof report.isDistributionShifted).toBe('boolean');
    });
  });
});
