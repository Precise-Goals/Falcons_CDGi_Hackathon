import { describe, it, expect } from 'vitest';
import { WaldSPRT } from './sprt.js';

describe("Wald's Sequential Probability Ratio Test (@intra/validator)", () => {
  it('initializes with default parameters and computes symmetric boundaries', () => {
    const sprt = new WaldSPRT();
    expect(sprt.alpha).toBe(0.05);
    expect(sprt.beta).toBe(0.05);
    expect(sprt.p0).toBe(0.01);
    expect(sprt.p1).toBe(0.05);

    // a = ln(0.95 / 0.05) = ln(19) ~ 2.9444
    expect(sprt.upperThreshold).toBeCloseTo(Math.log(19), 4);
    // b = ln(0.05 / 0.95) = ln(1 / 19) ~ -2.9444
    expect(sprt.lowerThreshold).toBeCloseTo(-Math.log(19), 4);
    expect(sprt.decision).toBe('continue');
    expect(sprt.logLikelihoodRatio).toBe(0);
    expect(sprt.sampleCount).toBe(0);
  });

  it('validates configuration constraints', () => {
    expect(() => new WaldSPRT({ alpha: 0 })).toThrowError(/alpha/);
    expect(() => new WaldSPRT({ beta: 1.5 })).toThrowError(/beta/);
    expect(() => new WaldSPRT({ p0: 0.1, p1: 0.05 })).toThrowError(/p0 must be strictly less than p1/);
  });

  it('triggers rollback quickly when consecutive errors occur', () => {
    const sprt = new WaldSPRT({ p0: 0.01, p1: 0.05, alpha: 0.05, beta: 0.05 });
    // ln(0.05 / 0.01) = ln(5) ~ 1.6094 per error
    // Upper threshold is ~2.9444. 2 consecutive errors = 2 * 1.6094 = 3.2188 >= 2.9444
    const d1 = sprt.step(true);
    expect(d1).toBe('continue');
    expect(sprt.errorCount).toBe(1);

    const d2 = sprt.step(true);
    expect(d2).toBe('rollback');
    expect(sprt.decision).toBe('rollback');
    expect(sprt.logLikelihoodRatio).toBeGreaterThan(sprt.upperThreshold);
  });

  it('triggers promote when stream of successes arrives', () => {
    const sprt = new WaldSPRT({ p0: 0.01, p1: 0.05, alpha: 0.05, beta: 0.05 });
    // ln((1 - 0.05) / (1 - 0.01)) = ln(0.95 / 0.99) ~ -0.04124 per success
    // Need ~ 2.9444 / 0.04124 ~ 72 successes to reach lower boundary
    let decision = sprt.decision;
    for (let i = 0; i < 80; i++) {
      decision = sprt.step(false);
      if (decision === 'promote') break;
    }

    expect(decision).toBe('promote');
    expect(sprt.decision).toBe('promote');
    expect(sprt.errorCount).toBe(0);
    expect(sprt.logLikelihoodRatio).toBeLessThanOrEqual(sprt.lowerThreshold);
  });

  it('stays in continue state during indeterminate observation streams', () => {
    const sprt = new WaldSPRT();
    // 5 successes, 0 errors
    for (let i = 0; i < 5; i++) {
      expect(sprt.step(false)).toBe('continue');
    }
    expect(sprt.logLikelihoodRatio).toBeLessThan(0);
    expect(sprt.logLikelihoodRatio).toBeGreaterThan(sprt.lowerThreshold);
  });

  it('supports stepBatch for aggregated canary metrics', () => {
    const sprt = new WaldSPRT();
    // 0 errors, 100 successes in batch
    const decision = sprt.stepBatch(0, 100);
    expect(decision).toBe('promote');
    expect(sprt.sampleCount).toBe(100);
  });

  it('supports direct LLR increments via addLLR', () => {
    const sprt = new WaldSPRT();
    expect(sprt.addLLR(1.0)).toBe('continue');
    expect(sprt.addLLR(2.5)).toBe('rollback');
  });

  it('enforces maxSamples truncation horizon', () => {
    const sprt = new WaldSPRT({ maxSamples: 10 });
    for (let i = 0; i < 9; i++) {
      expect(sprt.step(false)).toBe('continue');
    }
    // 10th sample reaches horizon
    const finalDecision = sprt.step(false);
    expect(finalDecision).toBe('promote'); // LLR < 0
  });

  it('resets state correctly for subsequent tests', () => {
    const sprt = new WaldSPRT();
    sprt.step(true);
    sprt.step(true);
    expect(sprt.decision).toBe('rollback');

    sprt.reset();
    expect(sprt.decision).toBe('continue');
    expect(sprt.logLikelihoodRatio).toBe(0);
    expect(sprt.sampleCount).toBe(0);
    expect(sprt.errorCount).toBe(0);
  });

  it('reliably distinguishes healthy canary from regressed canary in Monte Carlo trial', () => {
    // Healthy canary: 0.2% error rate (well below p0=1%)
    const healthySPRT = new WaldSPRT({ p0: 0.01, p1: 0.05 });
    while (healthySPRT.decision === 'continue' && healthySPRT.sampleCount < 200) {
      const isError = Math.random() < 0.002;
      healthySPRT.step(isError);
    }
    expect(healthySPRT.decision).toBe('promote');

    // Regressed canary: 15% error rate (well above p1=5%)
    const badSPRT = new WaldSPRT({ p0: 0.01, p1: 0.05 });
    while (badSPRT.decision === 'continue' && badSPRT.sampleCount < 200) {
      const isError = Math.random() < 0.15;
      badSPRT.step(isError);
    }
    expect(badSPRT.decision).toBe('rollback');
  });
});
