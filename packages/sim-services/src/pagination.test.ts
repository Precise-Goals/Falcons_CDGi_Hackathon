import { describe, it, expect } from 'vitest';
import {
  paginateCollection,
  StandardPaginationResponse,
  CursorPaginationResponse,
} from './pagination.js';

describe('@intra/sim-services Pagination & Cursor Drift Mutator', () => {
  const dataset = Array.from({ length: 50 }, (_, i) => ({ id: `item_${i + 1}`, score: i * 10 }));

  it('serves standard offset pagination in baseline mode', () => {
    const res = paginateCollection(dataset, { offset: 10, limit: 5 }) as StandardPaginationResponse<(typeof dataset)[0]>;

    expect(res.offset).toBe(10);
    expect(res.limit).toBe(5);
    expect(res.total).toBe(50);
    expect(res.items).toHaveLength(5);
    expect(res.items[0].id).toBe('item_11');
  });

  it('switches to opaque cursor pagination when useCursor drift is enabled (M5)', () => {
    // Initial page
    const page1 = paginateCollection(dataset, { limit: 10, useCursor: true }) as CursorPaginationResponse<(typeof dataset)[0]>;

    expect(page1.results).toHaveLength(10);
    expect(page1.has_more).toBe(true);
    expect(page1.next_cursor).not.toBeNull();

    // Next page with cursor
    const page2 = paginateCollection(dataset, {
      cursor: page1.next_cursor!,
      limit: 10,
      useCursor: true,
    }) as CursorPaginationResponse<(typeof dataset)[0]>;

    expect(page2.results).toHaveLength(10);
    expect(page2.results[0].id).toBe('item_11');
    expect(page2.has_more).toBe(true);
  });

  it('enforces silent page size truncation cap (M6)', () => {
    // Requesting 50 items but maxPageCap is 20
    const res = paginateCollection(dataset, { limit: 50, maxPageCap: 20 }) as StandardPaginationResponse<(typeof dataset)[0]>;
    expect(res.limit).toBe(20);
    expect(res.items).toHaveLength(20);
  });
});
