import { describe, it, expect } from 'vitest';
import { detectUnitShift } from './unitShift.js';

describe('Quantile-Ratio Constancy Test (@intra/differ)', () => {
  it('returns not detected for empty or insufficient inputs', () => {
    expect(detectUnitShift([], []).detected).toBe(false);
    expect(detectUnitShift([10], [100]).detected).toBe(false);
    expect(detectUnitShift([10, 20], []).detected).toBe(false);
  });

  it('detects x100 multiplier shift (dollars to cents)', () => {
    // Typical price distribution in dollars
    const oldPrices = [4.99, 9.99, 14.50, 19.99, 29.00, 49.99, 79.95, 99.00, 150.00, 299.99];
    // Mutated prices in cents
    const newPrices = oldPrices.map((p) => p * 100);

    const result = detectUnitShift(oldPrices, newPrices);
    expect(result.detected).toBe(true);
    expect(result.multiplier).toBe(100);
    expect(result.ratioCV).toBeLessThan(0.01);
    expect(result.meanRatio).toBeCloseTo(100, 2);
    expect(result.confidence).toBeGreaterThan(0.95);
    expect(result.decilesOld.length).toBe(9);
    expect(result.decilesNew.length).toBe(9);
  });

  it('detects 0.01 multiplier shift (cents to dollars)', () => {
    const oldCents = [500, 1200, 2500, 4999, 7500, 10000, 25000];
    const newDollars = oldCents.map((c) => c * 0.01);

    const result = detectUnitShift(oldCents, newDollars);
    expect(result.detected).toBe(true);
    expect(result.multiplier).toBe(0.01);
    expect(result.ratioCV).toBeLessThan(0.01);
    expect(result.meanRatio).toBeCloseTo(0.01, 4);
    expect(result.confidence).toBeGreaterThan(0.95);
  });

  it('detects x10 multiplier shift', () => {
    const oldValues = [1.2, 3.4, 5.6, 7.8, 9.0, 11.2, 13.5, 15.8];
    const newValues = oldValues.map((v) => v * 10);

    const result = detectUnitShift(oldValues, newValues);
    expect(result.detected).toBe(true);
    expect(result.multiplier).toBe(10);
    expect(result.ratioCV).toBeLessThan(0.01);
  });

  it('detects x1000 multiplier shift (seconds to milliseconds)', () => {
    const oldLatencySec = [0.05, 0.12, 0.25, 0.50, 0.85, 1.20, 2.50, 5.00];
    const newLatencyMs = oldLatencySec.map((s) => s * 1000);

    const result = detectUnitShift(oldLatencySec, newLatencyMs);
    expect(result.detected).toBe(true);
    expect(result.multiplier).toBe(1000);
    expect(result.ratioCV).toBeLessThan(0.01);
    expect(result.confidence).toBeGreaterThan(0.95);
  });

  it('handles datasets of unequal lengths drawn from scaled distributions', () => {
    // 50 old samples and 100 new samples
    const oldValues = Array.from({ length: 50 }, (_, i) => 10 + i * 2);
    const newValues = Array.from({ length: 100 }, (_, i) => (10 + i) * 100);

    const result = detectUnitShift(oldValues, newValues);
    expect(result.detected).toBe(true);
    expect(result.multiplier).toBe(100);
    expect(result.ratioCV).toBeLessThan(0.05);
  });

  it('rejects non-linear shifts (e.g. quadratic drift x^2)', () => {
    const oldValues = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20];
    const newValues = oldValues.map((x) => x * x); // ratios are 2, 4, 6, 8... CV is very high

    const result = detectUnitShift(oldValues, newValues);
    expect(result.detected).toBe(false);
    expect(result.ratioCV).toBeGreaterThan(0.05);
  });

  it('rejects additive offsets (e.g. x + 50 without multiplier scaling)', () => {
    const oldValues = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const newValues = oldValues.map((x) => x + 50); // ratios vary from 60/10=6 to 150/100=1.5

    const result = detectUnitShift(oldValues, newValues);
    expect(result.detected).toBe(false);
    expect(result.ratioCV).toBeGreaterThan(0.05);
  });

  it('rejects uncoordinated random noise', () => {
    const oldValues = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const newValues = [95, 12, 400, 3, 77, 120, 10, 500, 4, 80];

    const result = detectUnitShift(oldValues, newValues);
    expect(result.detected).toBe(false);
    expect(result.ratioCV).toBeGreaterThan(0.05);
  });
});
