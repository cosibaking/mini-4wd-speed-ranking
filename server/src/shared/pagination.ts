import type { PaginationQuery, PaginationResult } from './types.js';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

export function parsePagination(query: Record<string, unknown>): PaginationQuery {
  const rawPage = Number(query.page ?? DEFAULT_PAGE);
  const rawPageSize = Number(query.pageSize ?? DEFAULT_PAGE_SIZE);

  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : DEFAULT_PAGE;
  const pageSize =
    Number.isFinite(rawPageSize) && rawPageSize >= 1
      ? Math.min(Math.floor(rawPageSize), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;

  return { page, pageSize };
}

export function buildPaginationResult<T>(
  list: T[],
  total: number,
  query: PaginationQuery,
): PaginationResult<T> {
  const { page, pageSize } = query;
  return {
    list,
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  };
}

export function getSkip(query: PaginationQuery): number {
  return (query.page - 1) * query.pageSize;
}
