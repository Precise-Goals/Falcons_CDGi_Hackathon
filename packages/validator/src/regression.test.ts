import { describe, it, expect } from 'vitest';
import { WorkflowValidator, WorkflowReplayTest } from './validator.js';
import { Adapter, ValidationResult, ValidationResultSchema } from '@intra/shared';

describe('@intra/validator Regression & Deep Semantic Equivalence', () => {
  const validator = new WorkflowValidator();

  const createAdapter = (overrides?: Partial<Adapter>): Adapter => ({
    id: 'adp_regression_001',
    changeId: 'chg_regression_001',
    strategy: 'rename',
    code: 'return { ...response };',
    tests: 'describe("adapter test", () => {})',
    rollbackHandle: 'rollback_handle_reg_alpha_99',
    ...overrides,
  });

  describe('1. Deep Equivalence Edge Cases', () => {
    it('handles nested object structures: objects inside objects, arrays inside objects, objects inside arrays', () => {
      const adapter = createAdapter();
      const complexExpected = {
        organization: {
          id: 'org_123',
          metadata: {
            tags: ['production', 'pci-dss'],
            region: 'us-east-1',
          },
          members: [
            { id: 'usr_1', roles: ['admin', 'billing'], profile: { active: true } },
            { id: 'usr_2', roles: ['viewer'], profile: { active: false } },
          ],
        },
      };

      // Case 1: Identical deep structure passes
      const passingTest: WorkflowReplayTest = {
        workflowName: 'deepEqualWorkflow',
        goldenInput: {},
        expectedOutput: complexExpected,
        actualAdaptedOutput: JSON.parse(JSON.stringify(complexExpected)),
      };
      const passResult = validator.validate(adapter, [passingTest]);
      expect(passResult.pass).toBe(true);
      expect(passResult.semanticEquivalence).toBe(true);
      expect(passResult.goldenTestResults.deepEqualWorkflow).toBe(true);

      // Case 2: Divergence in nested object inside array fails
      const divergedInObjectInArray = JSON.parse(JSON.stringify(complexExpected));
      divergedInObjectInArray.organization.members[0].profile.active = false;

      const failingTest1: WorkflowReplayTest = {
        workflowName: 'divergedNestedObjInArray',
        goldenInput: {},
        expectedOutput: complexExpected,
        actualAdaptedOutput: divergedInObjectInArray,
      };
      const failResult1 = validator.validate(adapter, [failingTest1]);
      expect(failResult1.pass).toBe(false);
      expect(failResult1.goldenTestResults.divergedNestedObjInArray).toBe(false);

      // Case 3: Divergence in array inside object fails
      const divergedInArrayInObj = JSON.parse(JSON.stringify(complexExpected));
      divergedInArrayInObj.organization.metadata.tags = ['production', 'hipaa'];

      const failingTest2: WorkflowReplayTest = {
        workflowName: 'divergedArrayInObj',
        goldenInput: {},
        expectedOutput: complexExpected,
        actualAdaptedOutput: divergedInArrayInObj,
      };
      const failResult2 = validator.validate(adapter, [failingTest2]);
      expect(failResult2.pass).toBe(false);
      expect(failResult2.goldenTestResults.divergedArrayInObj).toBe(false);

      // Case 4: Divergence in object inside object fails
      const divergedInObjInObj = JSON.parse(JSON.stringify(complexExpected));
      divergedInObjInObj.organization.metadata.region = 'eu-central-1';

      const failingTest3: WorkflowReplayTest = {
        workflowName: 'divergedObjInObj',
        goldenInput: {},
        expectedOutput: complexExpected,
        actualAdaptedOutput: divergedInObjInObj,
      };
      const failResult3 = validator.validate(adapter, [failingTest3]);
      expect(failResult3.pass).toBe(false);
      expect(failResult3.goldenTestResults.divergedObjInObj).toBe(false);
    });

    it('fails on array length mismatch: expected [1, 2, 3] vs actual [1, 2]', () => {
      const adapter = createAdapter();
      const test: WorkflowReplayTest = {
        workflowName: 'arrayLengthMismatch',
        goldenInput: {},
        expectedOutput: [1, 2, 3],
        actualAdaptedOutput: [1, 2],
      };

      const result = validator.validate(adapter, [test]);
      expect(result.pass).toBe(false);
      expect(result.semanticEquivalence).toBe(false);
      expect(result.goldenTestResults.arrayLengthMismatch).toBe(false);

      // Also reverse length mismatch (expected shorter than actual)
      const reverseTest: WorkflowReplayTest = {
        workflowName: 'arrayLengthMismatchReverse',
        goldenInput: {},
        expectedOutput: [1, 2],
        actualAdaptedOutput: [1, 2, 3],
      };
      const reverseResult = validator.validate(adapter, [reverseTest]);
      expect(reverseResult.pass).toBe(false);
      expect(reverseResult.goldenTestResults.arrayLengthMismatchReverse).toBe(false);
    });

    it('fails on array item difference: expected [1, 2] vs actual [1, 3]', () => {
      const adapter = createAdapter();
      const test: WorkflowReplayTest = {
        workflowName: 'arrayItemDifference',
        goldenInput: {},
        expectedOutput: [1, 2],
        actualAdaptedOutput: [1, 3],
      };

      const result = validator.validate(adapter, [test]);
      expect(result.pass).toBe(false);
      expect(result.semanticEquivalence).toBe(false);
      expect(result.goldenTestResults.arrayItemDifference).toBe(false);
    });

    it('fails on object missing key: expected { a: 1, b: 2 } vs actual { a: 1 }', () => {
      const adapter = createAdapter();
      const test: WorkflowReplayTest = {
        workflowName: 'objectMissingKey',
        goldenInput: {},
        expectedOutput: { a: 1, b: 2 },
        actualAdaptedOutput: { a: 1 },
      };

      const result = validator.validate(adapter, [test]);
      expect(result.pass).toBe(false);
      expect(result.semanticEquivalence).toBe(false);
      expect(result.goldenTestResults.objectMissingKey).toBe(false);
    });

    it('fails on primitive type mismatch: expected 42 vs actual "42", boolean true vs "true"', () => {
      const adapter = createAdapter();

      const numberVsStringTest: WorkflowReplayTest = {
        workflowName: 'numberVsString',
        goldenInput: {},
        expectedOutput: 42,
        actualAdaptedOutput: '42',
      };
      const res1 = validator.validate(adapter, [numberVsStringTest]);
      expect(res1.pass).toBe(false);
      expect(res1.semanticEquivalence).toBe(false);
      expect(res1.goldenTestResults.numberVsString).toBe(false);

      const booleanVsStringTest: WorkflowReplayTest = {
        workflowName: 'booleanVsString',
        goldenInput: {},
        expectedOutput: true,
        actualAdaptedOutput: 'true',
      };
      const res2 = validator.validate(adapter, [booleanVsStringTest]);
      expect(res2.pass).toBe(false);
      expect(res2.semanticEquivalence).toBe(false);
      expect(res2.goldenTestResults.booleanVsString).toBe(false);

      const numberVsBooleanTest: WorkflowReplayTest = {
        workflowName: 'numberVsBoolean',
        goldenInput: {},
        expectedOutput: 1,
        actualAdaptedOutput: true,
      };
      const res3 = validator.validate(adapter, [numberVsBooleanTest]);
      expect(res3.pass).toBe(false);
      expect(res3.goldenTestResults.numberVsBoolean).toBe(false);

      const zeroVsFalseTest: WorkflowReplayTest = {
        workflowName: 'zeroVsFalse',
        goldenInput: {},
        expectedOutput: 0,
        actualAdaptedOutput: false,
      };
      const res4 = validator.validate(adapter, [zeroVsFalseTest]);
      expect(res4.pass).toBe(false);
      expect(res4.goldenTestResults.zeroVsFalse).toBe(false);
    });

    it('fails on null vs undefined vs object differences without crashing', () => {
      const adapter = createAdapter();

      const scenarios: Array<{ name: string; expected: unknown; actual: unknown }> = [
        { name: 'nullVsUndefined', expected: null, actual: undefined },
        { name: 'undefinedVsNull', expected: undefined, actual: null },
        { name: 'nullVsEmptyObject', expected: null, actual: {} },
        { name: 'emptyObjectVsNull', expected: {}, actual: null },
        { name: 'undefinedVsEmptyObject', expected: undefined, actual: {} },
        { name: 'emptyObjectVsUndefined', expected: {}, actual: undefined },
        { name: 'nestedNullVsUndefined', expected: { key: null }, actual: { key: undefined } },
        { name: 'nestedUndefinedVsNull', expected: { key: undefined }, actual: { key: null } },
        { name: 'nestedNullVsObject', expected: { key: null }, actual: { key: {} } },
        { name: 'nestedObjectVsNull', expected: { key: {} }, actual: { key: null } },
      ];

      for (const scenario of scenarios) {
        expect(() => {
          const result = validator.validate(adapter, [
            {
              workflowName: scenario.name,
              goldenInput: {},
              expectedOutput: scenario.expected,
              actualAdaptedOutput: scenario.actual,
            },
          ]);
          expect(result.pass).toBe(false);
          expect(result.semanticEquivalence).toBe(false);
          expect(result.goldenTestResults[scenario.name]).toBe(false);
        }).not.toThrow();
      }
    });

    it('passes on identical primitives, strings, numbers, booleans', () => {
      const adapter = createAdapter();

      const passingPrimitives: Array<{ name: string; value: unknown }> = [
        { name: 'stringPrimitive', value: 'hello intra' },
        { name: 'emptyString', value: '' },
        { name: 'numberInteger', value: 42 },
        { name: 'numberFloat', value: 3.14159 },
        { name: 'numberZero', value: 0 },
        { name: 'numberNegative', value: -100 },
        { name: 'booleanTrue', value: true },
        { name: 'booleanFalse', value: false },
        { name: 'nullValue', value: null },
        { name: 'undefinedValue', value: undefined },
      ];

      for (const prim of passingPrimitives) {
        const test: WorkflowReplayTest = {
          workflowName: prim.name,
          goldenInput: {},
          expectedOutput: prim.value,
          actualAdaptedOutput: prim.value,
        };
        const result = validator.validate(adapter, [test]);
        expect(result.pass).toBe(true);
        expect(result.semanticEquivalence).toBe(true);
        expect(result.goldenTestResults[prim.name]).toBe(true);
      }
    });
  });

  describe('2. Multi-workflow Batch Execution', () => {
    it('handles batch of 5 workflows where all pass', () => {
      const adapter = createAdapter();
      const tests: WorkflowReplayTest[] = [
        { workflowName: 'wf_auth', goldenInput: {}, expectedOutput: { token: 'jwt_1' }, actualAdaptedOutput: { token: 'jwt_1' } },
        { workflowName: 'wf_billing', goldenInput: {}, expectedOutput: { balance: 100 }, actualAdaptedOutput: { balance: 100 } },
        { workflowName: 'wf_catalog', goldenInput: {}, expectedOutput: ['item1', 'item2'], actualAdaptedOutput: ['item1', 'item2'] },
        { workflowName: 'wf_orders', goldenInput: {}, expectedOutput: { count: 3 }, actualAdaptedOutput: { count: 3 } },
        { workflowName: 'wf_users', goldenInput: {}, expectedOutput: { active: true }, actualAdaptedOutput: { active: true } },
      ];

      const result = validator.validate(adapter, tests);

      expect(result.pass).toBe(true);
      expect(result.semanticEquivalence).toBe(true);
      expect(Object.keys(result.goldenTestResults)).toHaveLength(5);
      expect(result.goldenTestResults).toEqual({
        wf_auth: true,
        wf_billing: true,
        wf_catalog: true,
        wf_orders: true,
        wf_users: true,
      });
    });

    it('handles batch of 5 workflows where 2 fail', () => {
      const adapter = createAdapter();
      const tests: WorkflowReplayTest[] = [
        { workflowName: 'wf_auth', goldenInput: {}, expectedOutput: { token: 'jwt_1' }, actualAdaptedOutput: { token: 'jwt_1' } }, // pass
        { workflowName: 'wf_billing', goldenInput: {}, expectedOutput: { balance: 100 }, actualAdaptedOutput: { balance: 99 } }, // FAIL
        { workflowName: 'wf_catalog', goldenInput: {}, expectedOutput: ['item1', 'item2'], actualAdaptedOutput: ['item1', 'item2'] }, // pass
        { workflowName: 'wf_orders', goldenInput: {}, expectedOutput: { count: 3 }, actualAdaptedOutput: { count: 0 } }, // FAIL
        { workflowName: 'wf_users', goldenInput: {}, expectedOutput: { active: true }, actualAdaptedOutput: { active: true } }, // pass
      ];

      const result = validator.validate(adapter, tests);

      expect(result.pass).toBe(false);
      expect(result.semanticEquivalence).toBe(false);
      expect(result.goldenTestResults).toEqual({
        wf_auth: true,
        wf_billing: false,
        wf_catalog: true,
        wf_orders: false,
        wf_users: true,
      });
      expect(result.goldenTestResults.wf_billing).toBe(false);
      expect(result.goldenTestResults.wf_orders).toBe(false);
      expect(result.goldenTestResults.wf_auth).toBe(true);
      expect(result.goldenTestResults.wf_catalog).toBe(true);
      expect(result.goldenTestResults.wf_users).toBe(true);
    });

    it('handles empty workflow list', () => {
      const adapter = createAdapter();
      const tests: WorkflowReplayTest[] = [];

      const result = validator.validate(adapter, tests);

      expect(result.pass).toBe(true);
      expect(result.semanticEquivalence).toBe(true);
      expect(result.goldenTestResults).toEqual({});
      expect(Object.keys(result.goldenTestResults)).toHaveLength(0);
    });
  });

  describe('3. Rollback Handle Evidence', () => {
    it('includes adapter.rollbackHandle and the count of failed workflows in failed validation evidence', () => {
      const rollbackHandleId = 'rollback_handle_order_svc_rev42';
      const adapter = createAdapter({ rollbackHandle: rollbackHandleId });

      const tests: WorkflowReplayTest[] = [
        { workflowName: 'wf_1', goldenInput: {}, expectedOutput: 10, actualAdaptedOutput: 10 },
        { workflowName: 'wf_2', goldenInput: {}, expectedOutput: 20, actualAdaptedOutput: 99 }, // FAIL
        { workflowName: 'wf_3', goldenInput: {}, expectedOutput: 30, actualAdaptedOutput: 88 }, // FAIL
      ];

      const result = validator.validate(adapter, tests);

      expect(result.pass).toBe(false);
      expect(result.evidence).toContain(rollbackHandleId);
      expect(result.evidence).toContain('2 workflow(s)');
      expect(result.evidence).toBe(
        `Validation failure detected across 2 workflow(s). Triggering rollback handle ${rollbackHandleId}.`
      );
    });

    it('summarizes successfully validated count in passing validation evidence', () => {
      const adapter = createAdapter();
      const tests: WorkflowReplayTest[] = [
        { workflowName: 'wf_1', goldenInput: {}, expectedOutput: 'a', actualAdaptedOutput: 'a' },
        { workflowName: 'wf_2', goldenInput: {}, expectedOutput: 'b', actualAdaptedOutput: 'b' },
        { workflowName: 'wf_3', goldenInput: {}, expectedOutput: 'c', actualAdaptedOutput: 'c' },
        { workflowName: 'wf_4', goldenInput: {}, expectedOutput: 'd', actualAdaptedOutput: 'd' },
      ];

      const result = validator.validate(adapter, tests);

      expect(result.pass).toBe(true);
      expect(result.evidence).toContain('4 workflows');
      expect(result.evidence).toBe('Validated 4 workflows successfully. Semantic equivalence preserved.');
    });
  });

  describe('4. Schema Conformance', () => {
    it('validates every generated ValidationResult against ValidationResultSchema.parse()', () => {
      const adapter = createAdapter();

      // Test case 1: Successful multi-workflow result
      const passTests: WorkflowReplayTest[] = [
        { workflowName: 'wf_pass_1', goldenInput: { q: 1 }, expectedOutput: { res: 'ok' }, actualAdaptedOutput: { res: 'ok' } },
        { workflowName: 'wf_pass_2', goldenInput: { q: 2 }, expectedOutput: [1, 2], actualAdaptedOutput: [1, 2] },
      ];
      const passResult = validator.validate(adapter, passTests);
      const parsedPass: ValidationResult = ValidationResultSchema.parse(passResult);
      expect(parsedPass).toEqual(passResult);

      // Test case 2: Failed multi-workflow result
      const failTests: WorkflowReplayTest[] = [
        { workflowName: 'wf_fail_1', goldenInput: { q: 1 }, expectedOutput: { res: 'ok' }, actualAdaptedOutput: { res: 'error' } },
        { workflowName: 'wf_fail_2', goldenInput: { q: 2 }, expectedOutput: [1, 2], actualAdaptedOutput: [1, 3] },
      ];
      const failResult = validator.validate(adapter, failTests);
      const parsedFail: ValidationResult = ValidationResultSchema.parse(failResult);
      expect(parsedFail).toEqual(failResult);

      // Test case 3: Empty workflows result
      const emptyResult = validator.validate(adapter, []);
      const parsedEmpty: ValidationResult = ValidationResultSchema.parse(emptyResult);
      expect(parsedEmpty).toEqual(emptyResult);

      // Verify schema attributes directly
      expect(typeof parsedPass.adapterId).toBe('string');
      expect(typeof parsedPass.pass).toBe('boolean');
      expect(typeof parsedPass.semanticEquivalence).toBe('boolean');
      expect(typeof parsedPass.goldenTestResults).toBe('object');
      expect(typeof parsedPass.evidence).toBe('string');
    });
  });
});
