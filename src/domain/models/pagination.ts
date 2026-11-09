export interface PageQuery {
  page: number;
  limit: number;
}

export interface Pagination {
  total: number;
  currentPage: number;
  limit: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  pagination: Pagination;
}

export interface PageResult<T> {
  items: T[];
  total: number;
}