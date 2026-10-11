import { describe, it, expect } from 'vitest';
import {
  centsToDollars,
  dollarsToCents,
  roundPrecision,
  convertUnit,
  detectScalingFactor,
} from './units.js';

describe('@intra/adapter Numerical Scaling & Unit Conversion', () => {
  describe('Floating-point Precision & Rounding', () => {
    it('corrects classic IEEE-754 floating-point drift (0.1 + 0.2)', () => {
      const sum = 0.1 + 0.2;
      expect(sum).not.toBe(0.3); // 0.30000000000000004
      expect(roundPrecision(sum, 2)).toBe(0.3);
      expect(roundPrecision(sum, 1)).toBe(0.3);
    });

    it('rounds micro-fractional currencies without precision loss', () => {
      expect(roundPrecision(4.999, 2)).toBe(5.0);
      expect(roundPrecision(4.994, 2)).toBe(4.99);
      expect(roundPrecision(12.34567, 4)).toBe(12.3457);
    });
  });

  describe('Currency Scaling (Cents <-> Dollars)', () => {
    it('converts integer cents to fractional dollars cleanly', () => {
      expect(centsToDollars(1)).toBe(0.01);
      expect(centsToDollars(99)).toBe(0.99);
      expect(centsToDollars(499)).toBe(4.99);
      expect(centsToDollars(1250)).toBe(12.5);
      expect(centsToDollars(100000)).toBe(1000.0);
    });

    it('converts dollars to integer cents safely with rounding guard', () => {
      expect(dollarsToCents(0.01)).toBe(1);
      expect(dollarsToCents(0.99)).toBe(99);
      expect(dollarsToCents(4.99)).toBe(499);
      expect(dollarsToCents(12.5)).toBe(1250);
      expect(dollarsToCents(19.999)).toBe(2000);
    });
  });

  describe('Predefined Unit Conversions', () => {
    it('converts basis points (bps) to fractional ratios', () => {
      expect(convertUnit(50, 'bps', 'ratio')).toBe(0.005);
      expect(convertUnit(10000, 'bps', 'ratio')).toBe(1.0);
    });

    it('converts milliseconds to seconds and bytes to kb', () => {
      expect(convertUnit(1500, 'ms', 'seconds')).toBe(1.5);
      expect(convertUnit(2048, 'bytes', 'kb')).toBe(2.0);
    });

    it('returns identical value when from and to units match', () => {
      expect(convertUnit(42, 'dollars', 'dollars')).toBe(42);
    });

    it('throws descriptive error on unsupported unit conversions', () => {
      expect(() => convertUnit(10, 'liters', 'gallons')).toThrow('Unsupported unit conversion');
    });
  });

  describe('Automatic Ratio Detection', () => {
    it('deduces 100x currency scaling from observations', () => {
      const inputs = [4.99, 12.5, 0.99, 25.0];
      const outputs = [499, 1250, 99, 2500];
      const result = detectScalingFactor(inputs, outputs);

      expect(result).not.toBeNull();
      expect(result?.factor).toBe(100);
      expect(result?.confidence).toBe(1.0);
    });

    it('returns null on inconsistent non-linear ratios', () => {
      const inputs = [10, 20, 30];
      const outputs = [100, 400, 900]; // quadratic, not constant scaling
      const result = detectScalingFactor(inputs, outputs);

      expect(result).toBeNull();
    });
  });
});
