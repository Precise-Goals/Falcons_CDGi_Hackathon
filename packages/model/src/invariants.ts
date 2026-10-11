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
