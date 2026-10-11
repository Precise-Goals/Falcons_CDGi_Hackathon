/**
 * Source Location & Markdown Link Formatter for Blast Radius Reports
 */

export interface SourceLocation {
  filePath: string;
  startLine: number;
  endLine?: number;
  startCol?: number;
  endCol?: number;
}

/**
 * Formats a file and line range into standard GitHub/IDE fragment URL notation.
 * e.g. apps/demo-app/src/workflows/checkout.ts#L42-L50
 */
export function formatSourceLocation(
  filePath: string,
  startLine: number,
  endLine?: number
): string {
  if (!endLine || endLine === startLine) {
    return `${filePath}#L${startLine}`;
  }
  return `${filePath}#L${startLine}-L${endLine}`;
}

/**
 * Formats a source location into compiler diagnostics style: file:line:col
 */
export function formatDiagnosticPosition(loc: SourceLocation): string {
  const lineCol = loc.startCol ? `:${loc.startLine}:${loc.startCol}` : `:${loc.startLine}`;
  return `${loc.filePath}${lineCol}`;
}

/**
 * Parses a formatted source location string back into structured range components.
 */
export function parseSourceLocation(locationStr: string): {
  filePath: string;
  startLine: number;
  endLine: number;
} {
  const [filePath, hash] = locationStr.split('#');
  if (!hash) {
    return { filePath, startLine: 1, endLine: 1 };
  }

  const rangeMatch = hash.match(/^L(\d+)(?:-L(\d+))?$/);
  if (!rangeMatch) {
    return { filePath, startLine: 1, endLine: 1 };
  }

  const startLine = parseInt(rangeMatch[1], 10);
  const endLine = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : startLine;

  return { filePath, startLine, endLine };
}
