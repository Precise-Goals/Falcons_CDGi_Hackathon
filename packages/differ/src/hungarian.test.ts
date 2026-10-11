import { describe, it, expect } from 'vitest';
import {
  hungarianMatching,
  validateCostMatrix,
  buildCostMatrixFromStrings,
} from './hungarian.js';

describe('Hungarian Bipartite Matcher (@intra/differ)', () => {
  it('handles empty matrix gracefully', () => {
    const res = hungarianMatching([]);
    expect(res.assignments).toEqual([]);
    expect(res.totalCost).toBe(0);
    expect(res.rowToCol).toEqual([]);
  });

  it('matches single element matrix', () => {
    const res = hungarianMatching([[42]]);
    expect(res.assignments).toEqual([{ row: 0, col: 0 }]);
    expect(res.totalCost).toBe(42);
    expect(res.rowToCol).toEqual([0]);
    expect(res.colToRow).toEqual([0]);
  });

  it('finds optimal assignment for 2x2 matrix', () => {
    // Row 0: Col 0 costs 10, Col 1 costs 1
    // Row 1: Col 0 costs 2,  Col 1 costs 20
    // Optimal: (0 -> 1) cost 1, (1 -> 0) cost 2, Total = 3
    const matrix = [
      [10, 1],
      [2, 20],
    ];
    const res = hungarianMatching(matrix);
    expect(res.totalCost).toBe(3);
    expect(res.rowToCol[0]).toBe(1);
    expect(res.rowToCol[1]).toBe(0);
    expect(res.assignments).toEqual([
      { row: 0, col: 1 },
      { row: 1, col: 0 },
    ]);
  });

  it('solves textbook 3x3 assignment problem', () => {
    // Classic Kuhn-Munkres problem:
    // [ [1, 2, 3],
    //   [2, 4, 6],
    //   [3, 6, 9] ]
    // Min cost assignment:
    // (0->2) cost 3, (1->1) cost 4, (2->0) cost 3 -> sum = 10?
    // Wait: (0->0)=1, (1->1)=4, (2->2)=9 -> sum = 14
    // (0->2)=3, (1->0)=2, (2->1)=6 -> sum = 11
    // (0->1)=2, (1->0)=2, (2->2)=9 -> sum = 13
    // (0->2)=3, (1->1)=4, (2->0)=3 -> sum = 10
    const matrix = [
      [1, 2, 3],
      [2, 4, 6],
      [3, 6, 9],
    ];
    const res = hungarianMatching(matrix);
    expect(res.totalCost).toBe(10);
    // Distinct rows and distinct columns
    const matchedCols = new Set(res.assignments.map((a) => a.col));
    const matchedRows = new Set(res.assignments.map((a) => a.row));
    expect(matchedCols.size).toBe(3);
    expect(matchedRows.size).toBe(3);
  });

  it('solves another standard 3x3 assignment problem', () => {
    const matrix = [
      [250, 400, 350],
      [400, 600, 350],
      [200, 400, 250],
    ];
    // Candidate assignments:
    // 0->0 (250) + 1->2 (350) + 2->1 (400) = 1000
    // 0->1 (400) + 1->2 (350) + 2->0 (200) = 950
    // 0->0 (250) + 1->1 (600) + 2->2 (250) = 1100
    // 0->2 (350) + 1->0 (400) + 2->1 (400) = 1150
    const res = hungarianMatching(matrix);
    expect(res.totalCost).toBe(950);
    expect(res.rowToCol[0]).toBe(1);
    expect(res.rowToCol[1]).toBe(2);
    expect(res.rowToCol[2]).toBe(0);
  });

  it('supports rectangular matrix with more columns than rows (N < M)', () => {
    // 2 rows, 3 columns
    const matrix = [
      [10, 5, 20],
      [2, 8, 15],
    ];
    // Row 0 can pick Col 1 (cost 5), Row 1 picks Col 0 (cost 2) -> total = 7
    const res = hungarianMatching(matrix);
    expect(res.totalCost).toBe(7);
    expect(res.assignments.length).toBe(2);
    expect(res.rowToCol[0]).toBe(1);
    expect(res.rowToCol[1]).toBe(0);
  });

  it('supports rectangular matrix with more rows than columns (N > M)', () => {
    // 3 rows, 2 columns
    const matrix = [
      [10, 2],
      [5, 8],
      [20, 15],
    ];
    // Row 0 picks Col 1 (cost 2), Row 1 picks Col 0 (cost 5) -> total = 7
    const res = hungarianMatching(matrix);
    expect(res.totalCost).toBe(7);
    expect(res.assignments.length).toBe(2);
    expect(res.colToRow[0]).toBe(1);
    expect(res.colToRow[1]).toBe(0);
  });

  it('handles negative cost values correctly', () => {
    const matrix = [
      [-5, -10],
      [-2, -4],
    ];
    // Min cost: Row 0 picks Col 1 (-10), Row 1 picks Col 0 (-2) -> total = -12
    const res = hungarianMatching(matrix);
    expect(res.totalCost).toBe(-12);
    expect(res.rowToCol[0]).toBe(1);
    expect(res.rowToCol[1]).toBe(0);
  });

  it('ensures strict 1-to-1 matching property on larger matrices', () => {
    const size = 6;
    const matrix = Array.from({ length: size }, (_, i) =>
      Array.from({ length: size }, (_, j) => (i + 1) * (j + 2) + ((i * 7 + j * 3) % 11))
    );
    const res = hungarianMatching(matrix);
    expect(res.assignments.length).toBe(size);

    const cols = res.assignments.map((a) => a.col);
    const rows = res.assignments.map((a) => a.row);
    expect(new Set(cols).size).toBe(size);
    expect(new Set(rows).size).toBe(size);

    // Verify total cost equals sum of assigned elements
    let manualSum = 0;
    for (const { row, col } of res.assignments) {
      manualSum += matrix[row][col];
    }
    expect(res.totalCost).toBe(manualSum);
  });

  describe('Cost Matrix Validation & 20-Field Mutated Schema Matching', () => {
    it('validates regular cost matrices and catches malformed matrices', () => {
      const validMatrix = [
        [1, 2, 3],
        [4, 5, 6],
      ];
      expect(validateCostMatrix(validMatrix).valid).toBe(true);

      const nonRectangular = [[1, 2], [3, 4, 5]];
      const resNonRect = validateCostMatrix(nonRectangular);
      expect(resNonRect.valid).toBe(false);
      expect(resNonRect.issues[0]).toContain('mismatches');

      const withNaN = [[1, NaN], [3, 4]];
      const resNaN = validateCostMatrix(withNaN);
      expect(resNaN.valid).toBe(false);
      expect(resNaN.issues[0]).toContain('non-finite');
    });

    it('optimally matches 20 mutated fields with 1-to-1 bijection', () => {
      const sourceFields = [
        'id', 'user_id', 'created_at', 'updated_at', 'status',
        'email_address', 'phone_number', 'first_name', 'last_name', 'billing_street',
        'billing_city', 'billing_country', 'billing_zip', 'shipping_street', 'shipping_city',
        'shipping_country', 'shipping_zip', 'total_amount', 'discount_code', 'currency'
      ];

      const targetFields = [
        'id', 'userId', 'createdAt', 'updatedAt', 'state',
        'emailAddress', 'phoneNumber', 'firstName', 'lastName', 'billingStreet',
        'billingCity', 'billingCountry', 'billingZip', 'shippingStreet', 'shippingCity',
        'shippingCountry', 'shippingZip', 'totalAmount', 'discountCode', 'curr'
      ];

      expect(sourceFields.length).toBe(20);
      expect(targetFields.length).toBe(20);

      const costMatrix = buildCostMatrixFromStrings(sourceFields, targetFields);
      const validation = validateCostMatrix(costMatrix);
      expect(validation.valid).toBe(true);
      expect(validation.rowCount).toBe(20);
      expect(validation.colCount).toBe(20);

      const matchResult = hungarianMatching(costMatrix);
      expect(matchResult.assignments).toHaveLength(20);

      // Verify bijection (all rows and columns matched exactly once)
      const assignedRows = new Set(matchResult.assignments.map((a) => a.row));
      const assignedCols = new Set(matchResult.assignments.map((a) => a.col));
      expect(assignedRows.size).toBe(20);
      expect(assignedCols.size).toBe(20);

      // Key specific matches should be exact or near-identical
      // 'id' (index 0) must match 'id' (index 0) with cost 0
      expect(matchResult.rowToCol[0]).toBe(0);
      expect(costMatrix[0][0]).toBe(0);

      // 'user_id' (index 1) should match 'userId' (index 1)
      expect(matchResult.rowToCol[1]).toBe(1);

      // 'total_amount' (index 17) should match 'totalAmount' (index 17)
      expect(matchResult.rowToCol[17]).toBe(17);
    });
  });
});

