/**
 * Hungarian Algorithm (Kuhn-Munkres) for optimal bipartite matching.
 * Solves the linear assignment problem in O(V^3) time using dual potentials.
 * Zero external dependencies.
 */

import { normalizedLevenshteinDistance } from './differ.js';

export interface HungarianAssignment {
  row: number;
  col: number;
}

export interface CostMatrixValidationResult {
  valid: boolean;
  rowCount: number;
  colCount: number;
  issues: string[];
}

/**
 * Validates that a bipartite cost matrix is rectangular, finite, and well-conditioned.
 */
export function validateCostMatrix(costMatrix: number[][]): CostMatrixValidationResult {
  const issues: string[] = [];
  if (!Array.isArray(costMatrix)) {
    return { valid: false, rowCount: 0, colCount: 0, issues: ['Cost matrix must be an array'] };
  }
  const rowCount = costMatrix.length;
  if (rowCount === 0) {
    return { valid: true, rowCount: 0, colCount: 0, issues: [] };
  }
  const colCount = Array.isArray(costMatrix[0]) ? costMatrix[0].length : 0;
  for (let i = 0; i < rowCount; i++) {
    const row = costMatrix[i];
    if (!Array.isArray(row)) {
      issues.push(`Row ${i} is not an array`);
      continue;
    }
    if (row.length !== colCount) {
      issues.push(`Row ${i} length ${row.length} mismatches expected colCount ${colCount}`);
    }
    for (let j = 0; j < row.length; j++) {
      const val = row[j];
      if (typeof val !== 'number' || !Number.isFinite(val)) {
        issues.push(`Cell [${i}][${j}] is non-finite or not a number (${val})`);
      }
    }
  }
  return {
    valid: issues.length === 0,
    rowCount,
    colCount,
    issues,
  };
}

/**
 * Builds a bipartite cost matrix between two sets of string tokens using normalized Levenshtein distance.
 */
export function buildCostMatrixFromStrings(sourceKeys: string[], targetKeys: string[]): number[][] {
  const matrix: number[][] = [];
  for (let i = 0; i < sourceKeys.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < targetKeys.length; j++) {
      matrix[i][j] = normalizedLevenshteinDistance(sourceKeys[i], targetKeys[j]);
    }
  }
  return matrix;
}


export interface HungarianResult {
  /** Array of 1-to-1 matched row/column pairs */
  assignments: HungarianAssignment[];
  /** Sum of costs of all chosen assignments */
  totalCost: number;
  /** Mapping from row index to assigned col index (-1 if unassigned) */
  rowToCol: number[];
  /** Mapping from col index to assigned row index (-1 if unassigned) */
  colToRow: number[];
}

/**
 * Computes the minimum-cost bipartite 1-to-1 matching for a cost matrix.
 * Supports square matrices (N x N) and rectangular matrices (N x M).
 *
 * @param costMatrix Matrix of weights where costMatrix[i][j] is the cost of assigning row i to col j.
 * @returns HungarianResult containing optimal assignments, total cost, and index maps.
 */
export function hungarianMatching(costMatrix: number[][]): HungarianResult {
  if (!costMatrix || costMatrix.length === 0 || costMatrix[0].length === 0) {
    return {
      assignments: [],
      totalCost: 0,
      rowToCol: [],
      colToRow: [],
    };
  }

  const n = costMatrix.length;
  const m = costMatrix[0].length;

  // If there are more rows than columns, transpose the matrix and invert assignments
  if (n > m) {
    const transposed: number[][] = [];
    for (let j = 0; j < m; j++) {
      transposed[j] = [];
      for (let i = 0; i < n; i++) {
        transposed[j][i] = costMatrix[i][j];
      }
    }

    const sub = hungarianMatching(transposed);
    const rowToCol = new Array<number>(n).fill(-1);
    const colToRow = new Array<number>(m).fill(-1);
    const assignments: HungarianAssignment[] = [];

    for (const match of sub.assignments) {
      const origRow = match.col;
      const origCol = match.row;
      rowToCol[origRow] = origCol;
      colToRow[origCol] = origRow;
      assignments.push({ row: origRow, col: origCol });
    }

    assignments.sort((a, b) => a.row - b.row);
    return {
      assignments,
      totalCost: sub.totalCost,
      rowToCol,
      colToRow,
    };
  }

  // 1-indexed Jonker-Volgenant / Kuhn-Munkres algorithm with potentials
  const u = new Array<number>(n + 1).fill(0);
  const v = new Array<number>(m + 1).fill(0);
  const p = new Array<number>(m + 1).fill(0);
  const way = new Array<number>(m + 1).fill(0);

  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array<number>(m + 1).fill(Infinity);
    const used = new Array<boolean>(m + 1).fill(false);

    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = Infinity;
      let j1 = 0;

      for (let j = 1; j <= m; j++) {
        if (!used[j]) {
          const cur = costMatrix[i0 - 1][j - 1] - u[i0] - v[j];
          if (cur < minv[j]) {
            minv[j] = cur;
            way[j] = j0;
          }
          if (minv[j] < delta) {
            delta = minv[j];
            j1 = j;
          }
        }
      }

      for (let j = 0; j <= m; j++) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }

      j0 = j1;
    } while (p[j0] !== 0);

    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0 !== 0);
  }

  const rowToCol = new Array<number>(n).fill(-1);
  const colToRow = new Array<number>(m).fill(-1);
  const assignments: HungarianAssignment[] = [];
  let totalCost = 0;

  for (let j = 1; j <= m; j++) {
    if (p[j] > 0) {
      const row = p[j] - 1;
      const col = j - 1;
      rowToCol[row] = col;
      colToRow[col] = row;
      const cost = costMatrix[row][col];
      totalCost += cost;
      assignments.push({ row, col });
    }
  }

  assignments.sort((a, b) => a.row - b.row);

  return {
    assignments,
    totalCost,
    rowToCol,
    colToRow,
  };
}
