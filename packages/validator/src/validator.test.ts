import { describe, it, expect } from 'vitest';
import { WorkflowValidator, WorkflowReplayTest } from './validator.js';
import { Adapter } from '@intra/shared';

describe('@intra/validator Workflow Replay & Semantic Equivalence', () => {
  const validator = new WorkflowValidator();
  const sampleAdapter: Adapter = {
    id: 'adp_test_1',
    changeId: 'chg_1',
    strategy: 'rename',
    code: 'return res;',
    tests: 'test',
    rollbackHandle: 'rollback_handle_xyz',
  };

  it('passes validation when adapted output matches expected golden data', () => {
    const replayTests: WorkflowReplayTest[] = [
      {
        workflowName: 'userProfile',
        goldenInput: {},
        expectedOutput: { id: 'usr_1', name: 'Alice Walker', status: 'active' },
        actualAdaptedOutput: { id: 'usr_1', name: 'Alice Walker', status: 'active' },
      },
    ];

    const result = validator.validate(sampleAdapter, replayTests);
    expect(result.pass).toBe(true);
    expect(result.semanticEquivalence).toBe(true);
    expect(result.goldenTestResults.userProfile).toBe(true);
  });

  it('fails validation and triggers rollback on semantic divergence', () => {
    const replayTests: WorkflowReplayTest[] = [
      {
        workflowName: 'checkout',
        goldenInput: {},
        expectedOutput: { amount: 25.0, currency: 'USD' },
        actualAdaptedOutput: { amount: 2500, currency: 'USD' }, // Divergence!
      },
    ];

    const result = validator.validate(sampleAdapter, replayTests);
    expect(result.pass).toBe(false);
    expect(result.semanticEquivalence).toBe(false);
    expect(result.evidence).toContain(sampleAdapter.rollbackHandle);
  });
});
