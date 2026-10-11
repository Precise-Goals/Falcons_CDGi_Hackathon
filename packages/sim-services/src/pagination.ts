/**
 * Pagination Boundary & Cursor Drift Mutator for Simulated Services
 */

import { Buffer } from 'node:buffer';

export interface PaginationOptions {
  offset?: number;
  limit?: number;
  cursor?: string;
  useCursor?: boolean;
  maxPageCap?: number;
}

export interface StandardPaginationResponse<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
}

export interface CursorPaginationResponse<T> {
  results: T[];
  next_cursor: string | null;
  has_more: boolean;
}

/**
 * Paginates an in-memory collection with support for standard offset or mutated cursor drift.
 */
export function paginateCollection<T>(
  allData: T[],
  options: PaginationOptions = {}
): StandardPaginationResponse<T> | CursorPaginationResponse<T> {
  const rawLimit = options.limit ?? 20;
  const limit = options.maxPageCap ? Math.min(rawLimit, options.maxPageCap) : rawLimit;

  // Drift Mode: Opaque cursor pagination (M5)
  if (options.useCursor) {
    let startIndex = 0;
    if (options.cursor) {
      try {
        const decoded = Buffer.from(options.cursor, 'base64').toString('utf8');
        startIndex = parseInt(decoded, 10);
        if (Number.isNaN(startIndex)) startIndex = 0;
      } catch {
        startIndex = 0;
      }
    }

    const sliced = allData.slice(startIndex, startIndex + limit);
    const nextIndex = startIndex + limit;
    const hasMore = nextIndex < allData.length;
    const nextCursor = hasMore ? Buffer.from(String(nextIndex)).toString('base64') : null;

    return {
      results: sliced,
      next_cursor: nextCursor,
      has_more: hasMore,
    };
  }

  // Baseline Mode: Standard offset pagination
  const offset = options.offset ?? 0;
  const sliced = allData.slice(offset, offset + limit);

  return {
    items: sliced,
    total: allData.length,
    offset,
    limit,
  };
}
