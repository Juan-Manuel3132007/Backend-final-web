import type { PageQuery } from "./pagination";

export interface Category {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryData {
  name: string;
  description: string | null;
}

export interface CategoryFilters extends PageQuery {
  search?: string;
}