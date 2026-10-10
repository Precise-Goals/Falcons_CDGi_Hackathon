import {
  Adapter,
  ValidationResult,
  ValidationResultSchema,
} from '@intra/shared';

export interface WorkflowReplayTest {
  workflowName: string;
  goldenInput: unknown;
  expectedOutput: unknown;
  actualAdaptedOutput: unknown;
}

export class WorkflowValidator {
  public validate(adapter: Adapter, tests: WorkflowReplayTest[]): ValidationResult {
    const goldenResults: Record<string, boolean> = {};
    let allPass = true;
    let semanticEquivalence = true;

    for (const test of tests) {
      const match = this.deepEquivalence(test.expectedOutput, test.actualAdaptedOutput);
      goldenResults[test.workflowName] = match;
      if (!match) {
        allPass = false;
        semanticEquivalence = false;
      }
    }

    const result: ValidationResult = {
      adapterId: adapter.id,
      pass: allPass,
      semanticEquivalence,
      goldenTestResults: goldenResults,
      evidence: allPass
        ? `Validated ${tests.length} workflows successfully. Semantic equivalence preserved.`
        : `Validation failure detected across ${Object.values(goldenResults).filter((v) => !v).length} workflow(s). Triggering rollback handle ${adapter.rollbackHandle}.`,
    };

    ValidationResultSchema.parse(result);
    return result;
  }

  private deepEquivalence(expected: unknown, actual: unknown): boolean {
    if (expected === actual) return true;
    if (expected === null || actual === null) return false;
    if (typeof expected !== 'object' || typeof actual !== 'object') return false;

    if (Array.isArray(expected)) {
      if (!Array.isArray(actual) || expected.length !== actual.length) return false;
      return expected.every((val, idx) => this.deepEquivalence(val, actual[idx]));
    }

    const expObj = expected as Record<string, unknown>;
    const actObj = actual as Record<string, unknown>;

    for (const key of Object.keys(expObj)) {
      if (!this.deepEquivalence(expObj[key], actObj[key])) {
        return false;
      }
    }
    return true;
  }
}
