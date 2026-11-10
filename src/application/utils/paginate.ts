import type { PageResult, Paginated, PageQuery } from "../../domain/models/pagination";

export function toPaginated<T>(result: PageResult<T>, query: PageQuery): Paginated<T> {
  return {
    data: result.items,
    pagination: {
      total: result.total,
      currentPage: query.page,
      limit: query.limit,
      totalPages: Math.ceil(result.total / query.limit),
    },
  };
}
