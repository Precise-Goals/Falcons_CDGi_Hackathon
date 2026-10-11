import { describe, it, expect } from 'vitest';
import {
  formatSourceLocation,
  formatDiagnosticPosition,
  parseSourceLocation,
} from './formatter.js';

describe('@intra/impact Source Location Formatter', () => {
  it('formats single line references without range suffix', () => {
    const loc = formatSourceLocation('apps/demo-app/src/workflows/checkout.ts', 42);
    expect(loc).toBe('apps/demo-app/src/workflows/checkout.ts#L42');
  });

  it('formats multi-line range references in L42-L50 notation', () => {
    const loc = formatSourceLocation('apps/demo-app/src/workflows/checkout.ts', 42, 50);
    expect(loc).toBe('apps/demo-app/src/workflows/checkout.ts#L42-L50');
  });

  it('formats diagnostic positions with line and column numbers', () => {
    const diag = formatDiagnosticPosition({
      filePath: 'packages/differ/src/differ.ts',
      startLine: 18,
      startCol: 5,
    });
    expect(diag).toBe('packages/differ/src/differ.ts:18:5');
  });

  it('parses formatted L42-L50 string back into structured location', () => {
    const parsed = parseSourceLocation('apps/demo-app/src/workflows/checkout.ts#L42-L50');
    expect(parsed.filePath).toBe('apps/demo-app/src/workflows/checkout.ts');
    expect(parsed.startLine).toBe(42);
    expect(parsed.endLine).toBe(50);
  });

  it('parses single line reference with identical start and end lines', () => {
    const parsed = parseSourceLocation('apps/demo-app/src/workflows/checkout.ts#L88');
    expect(parsed.filePath).toBe('apps/demo-app/src/workflows/checkout.ts');
    expect(parsed.startLine).toBe(88);
    expect(parsed.endLine).toBe(88);
  });
});
