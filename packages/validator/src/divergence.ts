/**
 * Empirical Distribution Divergence Metrics (Wasserstein & Kolmogorov-Smirnov)
 */

export interface LatencyDivergenceReport {
  baselineP50: number;
  baselineP95: number;
  canaryP50: number;
  canaryP95: number;
  wassersteinDistanceMs: number;
  kolmogorovSmirnovD: number;
  isDistributionShifted: boolean;
}

/**
 * Computes 1D Wasserstein distance (Earth Mover's Distance) between two empirical distributions.
 */
export function computeWasserstein1D(u: number[], v: number[]): number {
  if (u.length === 0 || v.length === 0) return 0;

  const sortedU = [...u].sort((a, b) => a - b);
  const sortedV = [...v].sort((a, b) => a - b);

  // Evaluate integrated absolute difference between empirical quantiles
  const steps = 100;
  let totalDiff = 0;

  for (let i = 0; i < steps; i++) {
    const q = (i + 0.5) / steps;
    const quantU = getQuantile(sortedU, q);
    const quantV = getQuantile(sortedV, q);
    totalDiff += Math.abs(quantU - quantV);
  }

  return totalDiff / steps;
}

function getQuantile(sorted: number[], q: number): number {
  const pos = q * (sorted.length - 1);
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

/**
 * Computes two-sample Kolmogorov-Smirnov (KS) statistic D = sup_x |F1(x) - F2(x)|.
 */
export function computeKolmogorovSmirnov(
  sample1: number[],
  sample2: number[]
): { dStatistic: number; isSignificant: boolean } {
  if (sample1.length === 0 || sample2.length === 0) {
    return { dStatistic: 0, isSignificant: false };
  }

  const s1 = [...sample1].sort((a, b) => a - b);
  const s2 = [...sample2].sort((a, b) => a - b);
  const allValues = Array.from(new Set([...s1, ...s2])).sort((a, b) => a - b);

  let maxDiff = 0;

  for (const val of allValues) {
    const cdf1 = countLessOrEqual(s1, val) / s1.length;
    const cdf2 = countLessOrEqual(s2, val) / s2.length;
    const diff = Math.abs(cdf1 - cdf2);
    if (diff > maxDiff) {
      maxDiff = diff;
    }
  }

  // Critical value for alpha = 0.05: 1.36 * sqrt((n1 + n2) / (n1 * n2))
  const n1 = s1.length;
  const n2 = s2.length;
  const criticalValue = 1.36 * Math.sqrt((n1 + n2) / (n1 * n2));
  const isSignificant = maxDiff > criticalValue;

  return {
    dStatistic: Math.round(maxDiff * 1000) / 1000,
    isSignificant,
  };
}

function countLessOrEqual(sorted: number[], val: number): number {
  let count = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] <= val) count++;
    else break;
  }
  return count;
}

/**
 * Analyzes latency shift between baseline and canary telemetry samples.
 */
export function computeLatencyDivergence(
  baseline: number[],
  canary: number[]
): LatencyDivergenceReport {
  const sortedBase = [...baseline].sort((a, b) => a - b);
  const sortedCanary = [...canary].sort((a, b) => a - b);

  const baselineP50 = getQuantile(sortedBase, 0.5);
  const baselineP95 = getQuantile(sortedBase, 0.95);
  const canaryP50 = getQuantile(sortedCanary, 0.5);
  const canaryP95 = getQuantile(sortedCanary, 0.95);

  const wasserstein = computeWasserstein1D(baseline, canary);
  const ks = computeKolmogorovSmirnov(baseline, canary);

  return {
    baselineP50: Math.round(baselineP50 * 100) / 100,
    baselineP95: Math.round(baselineP95 * 100) / 100,
    canaryP50: Math.round(canaryP50 * 100) / 100,
    canaryP95: Math.round(canaryP95 * 100) / 100,
    wassersteinDistanceMs: Math.round(wasserstein * 100) / 100,
    kolmogorovSmirnovD: ks.dStatistic,
    isDistributionShifted: ks.isSignificant,
  };
}
