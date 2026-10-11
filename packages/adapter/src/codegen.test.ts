import { describe, it, expect } from 'vitest';
import { generateAdapterSourceCode } from './codegen.js';

describe('@intra/adapter TypeScript Codegen', () => {
  it('generates fully formed TypeScript adapter module and unit test suite', () => {
    const res = generateAdapterSourceCode({
      changeId: 'chg_ren_101',
      service: 'users',
      endpoint: '/users/profile',
      transformationBody: "item.name = item.display_name ?? item.name;",
      testInput: { id: 'usr_1', display_name: 'Dr. Jane' },
      expectedOutput: { id: 'usr_1', display_name: 'Dr. Jane', name: 'Dr. Jane' },
      rollbackHandle: 'rb_chg_ren_101',
    });

    expect(res.fileName).toBe('adapt_users_chg_ren_101.ts');
    expect(res.testFileName).toBe('adapt_users_chg_ren_101.test.ts');
    expect(res.sourceCode).toContain('export function adaptResponse<T = unknown, R = unknown>(payload: T): R');
    expect(res.sourceCode).toContain('Drift ID: chg_ren_101');
    expect(res.sourceCode).toContain('Rollback Handle: rb_chg_ren_101');
    expect(res.testCode).toContain("describe('Autonomous Adapter [chg_ren_101]'");
  });
});
