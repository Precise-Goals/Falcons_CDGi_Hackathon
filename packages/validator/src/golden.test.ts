import { describe, it, expect } from 'vitest';
import { GoldenReplayHarness, generateDeterministicTestVectors } from './golden.js';

describe('@intra/validator Golden Vector Replay Harness', () => {
  it('executes 100 deterministic test vectors with 100% pass rate on verified adapter', () => {
    // Generate 100 vectors simulating mutated schema payload: { id, display_name } -> { id, name }
    const vectors = generateDeterministicTestVectors(100, (i) => ({
      input: { id: `usr_${i}`, display_name: `User ${i}` },
      expected: { id: `usr_${i}`, name: `User ${i}` },
    }));

    const harness = new GoldenReplayHarness(vectors);
    expect(harness.getVectorCount()).toBe(100);

    // Adapter function mapping display_name to name
    const adapterFn = (data: unknown) => {
      const item = data as { id: string; display_name: string };
      return { id: item.id, name: item.display_name };
    };

    const report = harness.executeReplay(adapterFn);
    expect(report.totalVectors).toBe(100);
    expect(report.passedVectors).toBe(100);
    expect(report.failedVectors).toBe(0);
    expect(report.passRate).toBe(1.0);
    expect(report.failures).toHaveLength(0);
    expect(report.totalDurationMs).toBeGreaterThanOrEqual(0);
  });

  it('detects and pinpoints regression when adapter fails on subset of vectors', () => {
    const vectors = generateDeterministicTestVectors(20, (i) => ({
      input: { count: i },
      expected: { total: i * 2 },
    }));

    const harness = new GoldenReplayHarness(vectors);

    // Faulty adapter that fails for index >= 15
    const faultyAdapter = (data: unknown) => {
      const item = data as { count: number };
      if (item.count >= 15) {
        return { total: item.count }; // bug: fails to multiply
      }
      return { total: item.count * 2 };
    };

    const report = harness.executeReplay(faultyAdapter);
    expect(report.totalVectors).toBe(20);
    expect(report.passedVectors).toBe(15);
    expect(report.failedVectors).toBe(5);
    expect(report.passRate).toBe(0.75);
    expect(report.failures[0].vectorId).toBe('vec_16');
  });

  it('supports clearing and re-registering golden vectors', () => {
    const harness = new GoldenReplayHarness();
    expect(harness.getVectorCount()).toBe(0);

    harness.registerVector({
      id: 'v1',
      description: 'Single check',
      input: 1,
      expectedOutput: 2,
    });
    expect(harness.getVectorCount()).toBe(1);

    harness.clear();
    expect(harness.getVectorCount()).toBe(0);
  });
});
