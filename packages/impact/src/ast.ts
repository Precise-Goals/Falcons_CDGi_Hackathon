/**
 * TypeScript AST Visitor for nested property access extraction.
 * Enables static blast-radius inspection from repository workflow sources.
 * Zero external dependencies.
 */

export interface AstPropertyAccess {
  rootIdentifier: string;
  fieldPath: string;
  line: number;
  column: number;
  rawExpression: string;
}

/**
 * Scans source code and extracts nested property access expressions
 * rooted at given variable identifiers (e.g. res.data.amount -> "data.amount").
 */
export function extractPropertyAccesses(
  sourceCode: string,
  targetRootIdentifiers: string[] = ['res', 'response', 'payload', 'body', 'data']
): AstPropertyAccess[] {
  const results: AstPropertyAccess[] = [];
  const lines = sourceCode.split(/\r?\n/);

  const rootGroup = targetRootIdentifiers.join('|');
  const dotPattern = new RegExp(`\\b(${rootGroup})((?:\\.[a-zA-Z_$][a-zA-Z0-9_$]*)+)\\b`, 'g');
  const destructurePattern = new RegExp(
    `const\\s+\\{([^}]+)\\}\\s*=\\s*\\b(${rootGroup})((?:\\.[a-zA-Z_$][a-zA-Z0-9_$]*)*)`,
    'g'
  );

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const lineText = lines[lineIdx];

    // Check dot access chains
    let match: RegExpExecArray | null;
    dotPattern.lastIndex = 0;
    while ((match = dotPattern.exec(lineText)) !== null) {
      const rootId = match[1];
      const fieldPath = match[2].slice(1);
      results.push({
        rootIdentifier: rootId,
        fieldPath,
        line: lineIdx + 1,
        column: match.index + 1,
        rawExpression: match[0],
      });
    }

    // Check destructuring
    destructurePattern.lastIndex = 0;
    while ((match = destructurePattern.exec(lineText)) !== null) {
      const destructuredVars = match[1]
        .split(',')
        .map((v) => v.trim().split(':')[0].trim())
        .filter(Boolean);
      const rootId = match[2];
      const subPath = match[3] ? match[3].slice(1) + '.' : '';
      for (const varName of destructuredVars) {
        if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(varName)) {
          results.push({
            rootIdentifier: rootId,
            fieldPath: `${subPath}${varName}`,
            line: lineIdx + 1,
            column: match.index + 1,
            rawExpression: match[0],
          });
        }
      }
    }
  }

  return results;
}
