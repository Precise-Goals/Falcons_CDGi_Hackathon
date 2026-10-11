/**
 * Numerical Scaling and Currency Unit Converters for Drift Adapters
 */

export interface UnitConversionRule {
  fromUnit: string;
  toUnit: string;
  factor: number; // toUnit = fromUnit * factor
  precision: number;
}

const PREDEFINED_CONVERSIONS: Record<string, UnitConversionRule> = {
  'cents:dollars': { fromUnit: 'cents', toUnit: 'dollars', factor: 0.01, precision: 2 },
  'dollars:cents': { fromUnit: 'dollars', toUnit: 'cents', factor: 100, precision: 0 },
  'bps:ratio': { fromUnit: 'bps', toUnit: 'ratio', factor: 0.0001, precision: 6 },
  'ratio:bps': { fromUnit: 'ratio', toUnit: 'bps', factor: 10000, precision: 0 },
  'ms:seconds': { fromUnit: 'ms', toUnit: 'seconds', factor: 0.001, precision: 3 },
  'seconds:ms': { fromUnit: 'seconds', toUnit: 'ms', factor: 1000, precision: 0 },
  'bytes:kb': { fromUnit: 'bytes', toUnit: 'kb', factor: 1 / 1024, precision: 2 },
  'kb:mb': { fromUnit: 'kb', toUnit: 'mb', factor: 1 / 1024, precision: 2 },
};

/**
 * Rounds a floating point value to exact decimal precision without IEEE-754 precision drift.
 */
export function roundPrecision(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Converts monetary amount from integer cents to fractional dollars with exact rounding.
 */
export function centsToDollars(cents: number): number {
  return roundPrecision(cents / 100, 2);
}

/**
 * Converts monetary amount from fractional dollars to integer cents safely.
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Converts numerical value between known units using conversion table.
 */
export function convertUnit(
  value: number,
  fromUnit: string,
  toUnit: string
): number {
  const normFrom = fromUnit.toLowerCase();
  const normTo = toUnit.toLowerCase();
  if (normFrom === normTo) return value;

  const key = `${normFrom}:${normTo}`;
  const rule = PREDEFINED_CONVERSIONS[key];
  if (rule) {
    return roundPrecision(value * rule.factor, rule.precision);
  }

  // Inverse lookup
  const invKey = `${normTo}:${normFrom}`;
  const invRule = PREDEFINED_CONVERSIONS[invKey];
  if (invRule) {
    return roundPrecision(value / invRule.factor, invRule.precision);
  }

  throw new Error(`Unsupported unit conversion: from "${fromUnit}" to "${toUnit}"`);
}

/**
 * Automatically deduces numerical scaling ratio from sample input/output observations.
 */
export function detectScalingFactor(
  inputs: number[],
  outputs: number[]
): { factor: number; confidence: number } | null {
  if (inputs.length === 0 || inputs.length !== outputs.length) {
    return null;
  }

  const ratios: number[] = [];
  for (let i = 0; i < inputs.length; i++) {
    const inp = inputs[i];
    const out = outputs[i];
    if (inp === 0 && out === 0) continue;
    if (inp === 0) return null;
    ratios.push(out / inp);
  }

  if (ratios.length === 0) return null;

  const first = ratios[0];
  const allMatch = ratios.every((r) => Math.abs(r - first) < 1e-4);
  if (!allMatch) {
    return null;
  }

  return {
    factor: roundPrecision(first, 4),
    confidence: 1.0,
  };
}
