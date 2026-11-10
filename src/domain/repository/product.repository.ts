import type { PageResult } from "../models/pagination";
import type { Product, ProductData, ProductFilters } from "../models/product";

export interface ProductRepository {
  findMany(filters: ProductFilters): Promise<PageResult<Product>>;
  findById(id: number): Promise<Product | null>;
  findActiveByIds(ids: number[]): Promise<Product[]>;
  create(data: ProductData & { imageUrl: string | null }): Promise<Product>;
  update(id: number, data: ProductData & { imageUrl?: string }): Promise<Product>;
  softDelete(id: number): Promise<void>;
}