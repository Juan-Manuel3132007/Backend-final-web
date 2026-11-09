import type { PageQuery } from "./pagination";

export const PLATFORMS = ["PS5", "XBOX", "SWITCH", "PC", "MULTI"] as const;
export type Platform = (typeof PLATFORMS)[number];

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  platform: Platform;
  imageUrl: string | null;
  isActive: boolean;
  categoryId: number;
  category?: { id: number; name: string };
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductData {
  name: string;
  description: string;
  price: number;
  stock: number;
  platform: Platform;
  categoryId: number;
}

export interface ProductFilters extends PageQuery {
  search?: string;
  categoryId?: number;
  platform?: Platform;
  minPrice?: number;
  maxPrice?: number;
}