/**
 * FlashFill-Style Typed DSL Program Synthesizer (Programming By Example - PBE)
 * Features:
 * - Depth-2 Occam shortest-program search (simplest AST complexity evaluated first)
 * - 80/20 train/test verification split to prevent overfitting
 * - Typed string, numeric, object, and combinator transforms
 * Zero external dependencies.
 */

export interface Example<TIn = unknown, TOut = unknown> {
  input: TIn;
  output: TOut;
}

export interface DSLProgram<TIn = unknown, TOut = unknown> {
  name: string;
  depth: number;
  complexity: number;
  execute: (input: TIn) => TOut;
  toCode: () => string;
}

export interface PBESynthesizerResult<TIn = unknown, TOut = unknown> {
  program: DSLProgram<TIn, TOut>;
  verified: boolean;
  trainAccuracy: number;
  testAccuracy: number;
  astDescription: string;
  code: string;
}

export interface PBEOptions {
  maxDepth?: number;
  trainSplit?: number; // e.g. 0.8
}

/**
 * Checks deep equivalence between expected and actual values,
 * supporting floating point tolerances and deep object comparisons.
 */
export function deepEquals(expected: unknown, actual: unknown): boolean {
  if (expected === actual) return true;
  if (expected === null || actual === null) return expected === actual;
  if (expected === undefined || actual === undefined) return expected === actual;

  if (typeof expected === 'number' && typeof actual === 'number') {
    if (Number.isNaN(expected) && Number.isNaN(actual)) return true;
    return Math.abs(expected - actual) < 1e-5;
  }

  if (typeof expected !== typeof actual) return false;

  if (Array.isArray(expected)) {
    if (!Array.isArray(actual) || expected.length !== actual.length) return false;
    for (let i = 0; i < expected.length; i++) {
      if (!deepEquals(expected[i], actual[i])) return false;
    }
    return true;
  }

  if (typeof expected === 'object' && typeof actual === 'object') {
    const expObj = expected as Record<string, unknown>;
    const actObj = actual as Record<string, unknown>;
    const expKeys = Object.keys(expObj);
    const actKeys = Object.keys(actObj);
    if (expKeys.length !== actKeys.length) return false;
    for (const key of expKeys) {
      if (!Object.prototype.hasOwnProperty.call(actObj, key)) return false;
      if (!deepEquals(expObj[key], actObj[key])) return false;
    }
    return true;
  }

  return false;
}

/**
 * FlashFill PBE Synthesizer searching programs ordered by Occam's Razor complexity.
 */
export class PBESynthesizer {
  private maxDepth: number;
  private trainSplitRatio: number;

  constructor(options?: PBEOptions) {
    this.maxDepth = options?.maxDepth ?? 2;
    this.trainSplitRatio = options?.trainSplit ?? 0.8;
  }

  /**
   * Synthesizes a program from input/output examples with 80/20 train/test verification.
   */
  public synthesize<TIn = unknown, TOut = unknown>(
    examples: Example<TIn, TOut>[]
  ): PBESynthesizerResult<TIn, TOut> | null {
    if (!examples || examples.length === 0) {
      return null;
    }

    // 80/20 train/test partition
    const { train, test } = this.splitExamples(examples);

    // Generate depth-1 candidate operators
    const depth1Candidates = this.generateDepth1Candidates(train);

    // Evaluate depth-0 / depth-1 candidates first (Occam shortest program)
    const sortedDepth1 = [...depth1Candidates].sort((a, b) => a.complexity - b.complexity);

    for (const prog of sortedDepth1) {
      if (this.evaluatesSuccessfully(prog, train)) {
        const testPass = this.evaluatesSuccessfully(prog, test);
        if (testPass) {
          return {
            program: prog as DSLProgram<TIn, TOut>,
            verified: true,
            trainAccuracy: 1.0,
            testAccuracy: 1.0,
            astDescription: prog.name,
            code: prog.toCode(),
          };
        }
      }
    }

    if (this.maxDepth >= 2) {
      // Generate depth-2 composition & combinator candidates
      const depth2Candidates = this.generateDepth2Candidates(depth1Candidates, train);
      depth2Candidates.sort((a, b) => a.complexity - b.complexity);

      for (const prog of depth2Candidates) {
        if (this.evaluatesSuccessfully(prog, train)) {
          const testPass = this.evaluatesSuccessfully(prog, test);
          if (testPass) {
            return {
              program: prog as DSLProgram<TIn, TOut>,
              verified: true,
              trainAccuracy: 1.0,
              testAccuracy: 1.0,
              astDescription: prog.name,
              code: prog.toCode(),
            };
          }
        }
      }
    }

    return null;
  }

  private splitExamples<TIn, TOut>(
    examples: Example<TIn, TOut>[]
  ): { train: Example<TIn, TOut>[]; test: Example<TIn, TOut>[] } {
    if (examples.length === 1) {
      return { train: examples, test: examples };
    }
    if (examples.length < 5) {
      return {
        train: examples.slice(0, examples.length - 1),
        test: [examples[examples.length - 1]],
      };
    }
    const trainCount = Math.max(1, Math.floor(examples.length * this.trainSplitRatio));
    return {
      train: examples.slice(0, trainCount),
      test: examples.slice(trainCount),
    };
  }

  private evaluatesSuccessfully(prog: DSLProgram, dataset: Example[]): boolean {
    for (const { input, output } of dataset) {
      try {
        const result = prog.execute(input);
        if (!deepEquals(output, result)) {
          return false;
        }
      } catch {
        return false;
      }
    }
    return true;
  }

  private generateDepth1Candidates(train: Example[]): DSLProgram[] {
    const candidates: DSLProgram[] = [];

    // Identity (complexity 0)
    candidates.push({
      name: 'identity',
      depth: 0,
      complexity: 0,
      execute: (x) => x,
      toCode: () => '(x) => x',
    });

    // Extract constant values seen in outputs
    const firstOutput = train[0]?.output;
    if (firstOutput !== undefined) {
      candidates.push({
        name: `constant(${JSON.stringify(firstOutput)})`,
        depth: 0,
        complexity: 1,
        execute: () => firstOutput,
        toCode: () => `() => ${JSON.stringify(firstOutput)}`,
      });
    }

    // Inspect inputs and outputs to deduce parameters
    const delimiters = [' ', '-', '_', '.', '/', ',', ':', ';', '|', '@'];
    const scaleFactors = [1000, 100, 10, 0.1, 0.01, 0.001, 2, 0.5];

    // String primitives
    candidates.push(
      {
        name: 'trim',
        depth: 1,
        complexity: 2,
        execute: (x) => (typeof x === 'string' ? x.trim() : String(x).trim()),
        toCode: () => '(x) => String(x).trim()',
      },
      {
        name: 'toLowerCase',
        depth: 1,
        complexity: 2,
        execute: (x) => (typeof x === 'string' ? x.toLowerCase() : String(x).toLowerCase()),
        toCode: () => '(x) => String(x).toLowerCase()',
      },
      {
        name: 'toUpperCase',
        depth: 1,
        complexity: 2,
        execute: (x) => (typeof x === 'string' ? x.toUpperCase() : String(x).toUpperCase()),
        toCode: () => '(x) => String(x).toUpperCase()',
      },
      {
        name: 'capitalize',
        depth: 1,
        complexity: 3,
        execute: (x) => {
          const s = String(x);
          return s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
        },
        toCode: () => '(x) => String(x).charAt(0).toUpperCase() + String(x).slice(1).toLowerCase()',
      }
    );

    // Number primitives
    candidates.push(
      {
        name: 'toNumber',
        depth: 1,
        complexity: 2,
        execute: (x) => Number(x),
        toCode: () => '(x) => Number(x)',
      },
      {
        name: 'toString',
        depth: 1,
        complexity: 2,
        execute: (x) => String(x),
        toCode: () => '(x) => String(x)',
      },
      {
        name: 'toBoolean',
        depth: 1,
        complexity: 2,
        execute: (x) => Boolean(x),
        toCode: () => '(x) => Boolean(x)',
      }
    );

    // Parameterized numeric scale
    for (const factor of scaleFactors) {
      candidates.push({
        name: `scale(${factor})`,
        depth: 1,
        complexity: 3,
        execute: (x) => {
          const num = Number(x);
          return Number((num * factor).toFixed(6));
        },
        toCode: () => `(x) => Number((Number(x) * ${factor}).toFixed(6))`,
      });
    }

    // Split & Get index
    for (const d of delimiters) {
      for (const idx of [0, 1, 2, 3]) {
        candidates.push({
          name: `splitGet(${JSON.stringify(d)}, ${idx})`,
          depth: 1,
          complexity: 4,
          execute: (x) => {
            const parts = String(x).split(d);
            return parts[idx] ?? '';
          },
          toCode: () => `(x) => String(x).split(${JSON.stringify(d)})[${idx}] ?? ''`,
        });
      }
    }

    // Object field extractions
    const firstInput = train[0]?.input;
    if (firstInput && typeof firstInput === 'object' && !Array.isArray(firstInput)) {
      const keys = Object.keys(firstInput as Record<string, unknown>);
      for (const k of keys) {
        candidates.push({
          name: `getField(${JSON.stringify(k)})`,
          depth: 1,
          complexity: 2,
          execute: (x) => (x as Record<string, unknown>)?.[k],
          toCode: () => `(x) => (x as any)?.[${JSON.stringify(k)}]`,
        });
      }
    }

    // If output is object, wrapField candidate
    if (firstOutput && typeof firstOutput === 'object' && !Array.isArray(firstOutput)) {
      const outKeys = Object.keys(firstOutput as Record<string, unknown>);
      for (const k of outKeys) {
        candidates.push({
          name: `wrapField(${JSON.stringify(k)})`,
          depth: 1,
          complexity: 3,
          execute: (x) => ({ [k]: x }),
          toCode: () => `(x) => ({ [${JSON.stringify(k)}]: x })`,
        });
      }
    }

    // Prefix / Suffix derived from training pairs
    for (const { input, output } of train) {
      if (typeof input === 'string' && typeof output === 'string') {
        if (output.startsWith(input) && output.length > input.length) {
          const suff = output.slice(input.length);
          candidates.push({
            name: `suffix(${JSON.stringify(suff)})`,
            depth: 1,
            complexity: 3,
            execute: (x) => String(x) + suff,
            toCode: () => `(x) => String(x) + ${JSON.stringify(suff)}`,
          });
        }
        if (output.endsWith(input) && output.length > input.length) {
          const pref = output.slice(0, output.length - input.length);
          candidates.push({
            name: `prefix(${JSON.stringify(pref)})`,
            depth: 1,
            complexity: 3,
            execute: (x) => pref + String(x),
            toCode: () => `(x) => ${JSON.stringify(pref)} + String(x)`,
          });
        }
      }
    }

    return candidates;
  }

  private generateDepth2Candidates(depth1: DSLProgram[], train: Example[]): DSLProgram[] {
    const depth2: DSLProgram[] = [];
    const validD1 = depth1.filter((p) => p.name !== 'identity');

    // 1. Sequential composition: g(f(x))
    for (const f of validD1) {
      // Evaluate if f produces valid output on training inputs
      let canFRun = true;
      const intermediateOutputs: unknown[] = [];
      for (const { input } of train) {
        try {
          intermediateOutputs.push(f.execute(input));
        } catch {
          canFRun = false;
          break;
        }
      }
      if (!canFRun) continue;

      for (const g of validD1) {
        if (f.name === g.name) continue;

        depth2.push({
          name: `compose(${f.name}, ${g.name})`,
          depth: 2,
          complexity: f.complexity + g.complexity + 2,
          execute: (x) => g.execute(f.execute(x)),
          toCode: () => `(x) => (${g.toCode()})((${f.toCode()})(x))`,
        });
      }
    }

    // 2. Binary Concat combinator: concat(f, g, delimiter)
    const delimiters = [' ', ', ', '-', ': ', '/'];
    const splitOps = validD1.filter((p) => p.name.startsWith('splitGet'));

    for (let i = 0; i < splitOps.length; i++) {
      for (let j = 0; j < splitOps.length; j++) {
        if (i === j) continue;
        const op1 = splitOps[i];
        const op2 = splitOps[j];

        for (const delim of delimiters) {
          depth2.push({
            name: `concat(${op1.name}, ${op2.name}, ${JSON.stringify(delim)})`,
            depth: 2,
            complexity: op1.complexity + op2.complexity + 3,
            execute: (x) => `${String(op1.execute(x))}${delim}${String(op2.execute(x))}`,
            toCode: () =>
              `(x) => \`\${(${op1.toCode()})(x)}${delim}\${(${op2.toCode()})(x)}\``,
          });
        }
      }
    }

    return depth2;
  }
}

/**
 * Convenient helper to synthesize a PBE program from examples.
 */
export function synthesizeProgram<TIn = unknown, TOut = unknown>(
  examples: Example<TIn, TOut>[],
  options?: PBEOptions
): PBESynthesizerResult<TIn, TOut> | null {
  const synthesizer = new PBESynthesizer(options);
  return synthesizer.synthesize(examples);
}
