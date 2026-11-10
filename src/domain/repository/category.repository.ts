import type { Category, CategoryData, CategoryFilters } from "../models/category";
import type { PageResult } from "../models/pagination";

export interface CategoryRepository {
  findMany(filters: CategoryFilters): Promise<PageResult<Category>>;
  findById(id: number): Promise<Category | null>;
  findByName(name: string): Promise<Category | null>;
  countActiveProducts(id: number): Promise<number>;
  create(data: CategoryData): Promise<Category>;
  update(id: number, data: CategoryData): Promise<Category>;
  softDelete(id: number): Promise<void>;
}