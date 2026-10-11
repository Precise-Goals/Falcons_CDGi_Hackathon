/**
 * Quantile-Ratio Constancy Test for detecting multiplier unit shifts.
 * Identifies scale shifts (e.g. x10, x100, x1000, 0.01) by checking whether
 * quantile ratios across the distribution have low coefficient of variation (CV < 0.05).
 * Zero external dependencies.
 */

export interface UnitShiftResult {
  /** Whether a systematic unit shift was detected */
  detected: boolean;
  /** The identified shift multiplier (e.g. 10, 100, 1000, 0.01) */
  multiplier?: number;
  /** Coefficient of variation of the decile ratios (sigma / |mu|) */
  ratioCV: number;
  /** Mean ratio across all valid deciles */
  meanRatio: number;
  /** Deciles of the baseline distribution (p = 0.1 .. 0.9) */
  decilesOld: number[];
  /** Deciles of the current distribution (p = 0.1 .. 0.9) */
  decilesNew: number[];
  /** Ratio vector: decilesNew[i] / decilesOld[i] */
  ratios: number[];
  /** Detection confidence score in [0, 1] */
  confidence: number;
}

const CANDIDATE_MULTIPLIERS = [1000, 100, 10, 0.1, 0.01, 0.001];

/**
 * Computes the interpolated quantile at percentile p in [0, 1] for a sorted array.
 */
function computeQuantile(sorted: number[], p: number): number {
  if (sorted.length === 1) return sorted[0];
  const index = p * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Computes deciles (p = 0.1, 0.2, ..., 0.9) for a list of numbers.
 */
function computeDeciles(values: number[]): number[] {
  const deciles: number[] = [];
  const percentiles = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
  for (const p of percentiles) {
    deciles.push(computeQuantile(values, p));
  }
  return deciles;
}

/**
 * Quantile-Ratio Constancy Test:
 * Calculates deciles of old and new value distributions, constructs the ratio vector,
 * and checks if the Coefficient of Variation (CV) is < 0.05 to detect multiplier shifts.
 *
 * @param oldValues Baseline sample array
 * @param newValues Current sample array
 * @returns UnitShiftResult with detected status, multiplier, CV, and ratio vector
 */
export function detectUnitShift(oldValues: number[], newValues: number[]): UnitShiftResult {
  const cleanOld = oldValues.filter(Number.isFinite).sort((a, b) => a - b);
  const cleanNew = newValues.filter(Number.isFinite).sort((a, b) => a - b);

  if (cleanOld.length < 2 || cleanNew.length < 2) {
    return {
      detected: false,
      multiplier: undefined,
      ratioCV: NaN,
      meanRatio: NaN,
      decilesOld: [],
      decilesNew: [],
      ratios: [],
      confidence: 0,
    };
  }

  const decilesOld = computeDeciles(cleanOld);
  const decilesNew = computeDeciles(cleanNew);

  // Compute ratio vector where old decile is non-zero
  const ratios: number[] = [];
  for (let i = 0; i < decilesOld.length; i++) {
    const dOld = decilesOld[i];
    const dNew = decilesNew[i];
    if (Math.abs(dOld) > 1e-9) {
      const r = dNew / dOld;
      if (Number.isFinite(r)) {
        ratios.push(r);
      }
    }
  }

  if (ratios.length < 3) {
    return {
      detected: false,
      multiplier: undefined,
      ratioCV: NaN,
      meanRatio: NaN,
      decilesOld,
      decilesNew,
      ratios,
      confidence: 0,
    };
  }

  // Calculate mean of ratio vector
  const sum = ratios.reduce((acc, v) => acc + v, 0);
  const meanRatio = sum / ratios.length;

  // Calculate standard deviation of ratio vector
  const variance = ratios.reduce((acc, v) => acc + Math.pow(v - meanRatio, 2), 0) / ratios.length;
  const stdDev = Math.sqrt(variance);

  // Coefficient of Variation (CV)
  const ratioCV = Math.abs(meanRatio) > 1e-9 ? stdDev / Math.abs(meanRatio) : Infinity;

  // Constancy criterion: CV < 0.05
  let detected = false;
  let multiplier: number | undefined;

  if (ratioCV < 0.05 && meanRatio > 0) {
    for (const candidate of CANDIDATE_MULTIPLIERS) {
      const relativeDiff = Math.abs(meanRatio - candidate) / candidate;
      if (relativeDiff < 0.05) {
        multiplier = candidate;
        detected = true;
        break;
      }
    }
  }

  const confidence = detected
    ? Math.max(0, Math.min(1, Number((1 - ratioCV).toFixed(4))))
    : 0;

  return {
    detected,
    multiplier,
    ratioCV,
    meanRatio,
    decilesOld,
    decilesNew,
    ratios,
    confidence,
  };
}
