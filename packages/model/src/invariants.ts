/**
 * Invariant Mining & Nullability Distribution Validator
 * Part of Daikon-style specification discovery for API contract inference.
 */

export type NullabilityInvariant =
  | 'ALWAYS_PRESENT_NON_NULL'
  | 'NEVER_PRESENT'
  | 'SOMETIMES_NULL'
  | 'EXCLUSIVELY_NULL';

export interface NullabilityProfile {
  field: string;
  totalSamples: number;
  nullCount: number;
  undefinedCount: number;
  presentCount: number;
  nullRatio: number;
  isNeverNull: boolean;
  isAlwaysNull: boolean;
  invariant: NullabilityInvariant;
}

/**
 * Computes the empirical nullability distribution profile for a target field.
 */
export function analyzeNullability(
  records: Array<Record<string, unknown>>,
  field: string
): NullabilityProfile {
  const totalSamples = records.length;
  if (totalSamples === 0) {
    return {
      field,
      totalSamples: 0,
      nullCount: 0,
      undefinedCount: 0,
      presentCount: 0,
      nullRatio: 0,
      isNeverNull: true,
      isAlwaysNull: false,
      invariant: 'ALWAYS_PRESENT_NON_NULL',
    };
  }

  let nullCount = 0;
  let undefinedCount = 0;
  let presentCount = 0;

  for (const rec of records) {
    if (!rec || typeof rec !== 'object') {
      undefinedCount++;
      continue;
    }
    if (!(field in rec)) {
      undefinedCount++;
    } else {
      const val = rec[field];
      if (val === null) {
        nullCount++;
      } else if (val === undefined) {
        undefinedCount++;
      } else {
        presentCount++;
      }
    }
  }

  const nullOrMissing = nullCount + undefinedCount;
  const nullRatio = totalSamples > 0 ? nullOrMissing / totalSamples : 0;
  const isNeverNull = nullOrMissing === 0;
  const isAlwaysNull = presentCount === 0;

  let invariant: NullabilityInvariant;
  if (isNeverNull) {
    invariant = 'ALWAYS_PRESENT_NON_NULL';
  } else if (isAlwaysNull) {
    invariant = undefinedCount === totalSamples ? 'NEVER_PRESENT' : 'EXCLUSIVELY_NULL';
  } else {
    invariant = 'SOMETIMES_NULL';
  }

  return {
    field,
    totalSamples,
    nullCount,
    undefinedCount,
    presentCount,
    nullRatio: Math.round(nullRatio * 10000) / 10000,
    isNeverNull,
    isAlwaysNull,
    invariant,
  };
}

/**
 * Validates whether a mined profile satisfies non-nullability constraints
 * under an acceptable tolerance margin.
 */
export function validateNullabilityInvariant(
  profile: NullabilityProfile,
  maxAllowedNullRatio: number = 0.05
): boolean {
  if (profile.invariant === 'ALWAYS_PRESENT_NON_NULL') {
    return true;
  }
  return profile.nullRatio <= maxAllowedNullRatio;
}

export interface QuantileConstancyResult {
  isUnitShift: boolean;
  scaleFactor: number;
  variance: number;
  quantilesTested: number[];
  ratios: number[];
  confidence: number;
}

/**
 * Evaluates whether two sets of quantiles exhibit uniform multiplicative constancy,
 * indicating an M3 unit shift (e.g. dollars-to-cents scale shift).
 */
export function evaluateQuantileConstancy(
  quantilesBefore: number[],
  quantilesAfter: number[],
  tolerance: number = 0.02
): QuantileConstancyResult {
  if (
    quantilesBefore.length === 0 ||
    quantilesBefore.length !== quantilesAfter.length
  ) {
    return {
      isUnitShift: false,
      scaleFactor: 1.0,
      variance: Infinity,
      quantilesTested: [],
      ratios: [],
      confidence: 0,
    };
  }

  const ratios: number[] = [];
  for (let i = 0; i < quantilesBefore.length; i++) {
    const b = quantilesBefore[i];
    const a = quantilesAfter[i];
    if (b === 0) continue;
    ratios.push(a / b);
  }

  if (ratios.length < 2) {
    return {
      isUnitShift: false,
      scaleFactor: ratios[0] ?? 1.0,
      variance: 0,
      quantilesTested: quantilesBefore,
      ratios,
      confidence: 0.5,
    };
  }

  const meanRatio = ratios.reduce((sum, r) => sum + r, 0) / ratios.length;
  const variance =
    ratios.reduce((sum, r) => sum + Math.pow(r - meanRatio, 2), 0) /
    ratios.length;
  const stdDev = Math.sqrt(variance);
  const relativeStdDev = meanRatio !== 0 ? stdDev / Math.abs(meanRatio) : Infinity;

  const isUniformScale = relativeStdDev <= tolerance;
  const isUnitShift =
    isUniformScale && Math.abs(meanRatio - 1.0) > 0.05;

  const confidence = isUniformScale
    ? Math.max(0, Math.min(1, 1 - relativeStdDev / tolerance))
    : 0;

  return {
    isUnitShift,
    scaleFactor: Math.round(meanRatio * 1000) / 1000,
    variance: Math.round(variance * 10000) / 10000,
    quantilesTested: quantilesBefore,
    ratios: ratios.map((r) => Math.round(r * 1000) / 1000),
    confidence: Math.round(confidence * 1000) / 1000,
  };
}

