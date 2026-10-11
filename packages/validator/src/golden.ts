/**
 * Golden Vector Deterministic Replay Harness for Adapter Verification
 */

export interface GoldenVector<TIn = unknown, TOut = unknown> {
  id: string;
  description: string;
  input: TIn;
  expectedOutput: TOut;
}

export interface VectorExecutionResult {
  vectorId: string;
  pass: boolean;
  expected: unknown;
  actual: unknown;
  durationMs: number;
}

export interface GoldenReplayReport {
  totalVectors: number;
  passedVectors: number;
  failedVectors: number;
  passRate: number;
  failures: VectorExecutionResult[];
  totalDurationMs: number;
  timestamp: string;
}

export class GoldenReplayHarness {
  private vectors: GoldenVector[] = [];

  constructor(initialVectors?: GoldenVector[]) {
    if (initialVectors) {
      this.vectors.push(...initialVectors);
    }
  }

  public registerVector(vector: GoldenVector): void {
    this.vectors.push(vector);
  }

  public loadVectors(vectors: GoldenVector[]): void {
    this.vectors.push(...vectors);
  }

  public clear(): void {
    this.vectors = [];
  }

  public getVectorCount(): number {
    return this.vectors.length;
  }

  /**
   * Executes deterministic replay against a provided transformation adapter.
   */
  public executeReplay(adapterFn: (input: unknown) => unknown): GoldenReplayReport {
    const startTime = performance.now();
    const failures: VectorExecutionResult[] = [];
    let passedCount = 0;

    for (const vec of this.vectors) {
      const vecStart = performance.now();
      let actual: unknown;
      let pass = false;

      try {
        actual = adapterFn(vec.input);
        pass = JSON.stringify(actual) === JSON.stringify(vec.expectedOutput);
      } catch (err) {
        actual = { error: String(err) };
        pass = false;
      }

      const vecDuration = performance.now() - vecStart;

      if (pass) {
        passedCount++;
      } else {
        failures.push({
          vectorId: vec.id,
          pass: false,
          expected: vec.expectedOutput,
          actual,
          durationMs: vecDuration,
        });
      }
    }

    const totalDurationMs = performance.now() - startTime;
    const total = this.vectors.length;

    return {
      totalVectors: total,
      passedVectors: passedCount,
      failedVectors: failures.length,
      passRate: total > 0 ? passedCount / total : 1.0,
      failures,
      totalDurationMs,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Generates synthetic deterministic test vectors for mutated schema verification.
 */
export function generateDeterministicTestVectors(
  count: number,
  generatorFn: (index: number) => { input: unknown; expected: unknown }
): GoldenVector[] {
  const vectors: GoldenVector[] = [];
  for (let i = 0; i < count; i++) {
    const { input, expected } = generatorFn(i);
    vectors.push({
      id: `vec_${i + 1}`,
      description: `Synthetic golden test vector #${i + 1}`,
      input,
      expectedOutput: expected,
    });
  }
  return vectors;
}
