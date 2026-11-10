import type { Prisma } from "@prisma/client";
import type { PageResult } from "../../domain/models/pagination";
import type { Product, ProductData, ProductFilters } from "../../domain/models/product";
import type { ProductRepository } from "../../domain/repository/product.repository";
import { prisma } from "../database/prisma";

const include = { category: { select: { id: true, name: true } } } as const;
type ProductRow = Prisma.ProductGetPayload<{ include: typeof include }>;

/** Prisma devuelve Decimal; la API responde el precio como número. */
function toProduct(row: ProductRow): Product {
  return { ...row, price: row.price.toNumber() };
}

function buildWhere(filters: ProductFilters): Prisma.ProductWhereInput {
  return {
    isActive: true,
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" } },
            { description: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.platform ? { platform: filters.platform } : {}),
    ...(filters.minPrice !== undefined || filters.maxPrice !== undefined
      ? { price: { gte: filters.minPrice, lte: filters.maxPrice } }
      : {}),
  };
}

export class PrismaProductRepository implements ProductRepository {
  async findMany(filters: ProductFilters): Promise<PageResult<Product>> {
    const where = buildWhere(filters);
    const [rows, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        include,
        orderBy: { createdAt: "desc" },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.product.count({ where }),
    ]);
    return { items: rows.map(toProduct), total };
  }

  async findById(id: number): Promise<Product | null> {
    const row = await prisma.product.findUnique({ where: { id }, include });
    return row ? toProduct(row) : null;
  }

  async findActiveByIds(ids: number[]): Promise<Product[]> {
    const rows = await prisma.product.findMany({ where: { id: { in: ids }, isActive: true }, include });
    return rows.map(toProduct);
  }

  async create(data: ProductData & { imageUrl: string | null }): Promise<Product> {
    return toProduct(await prisma.product.create({ data, include }));
  }

  async update(id: number, data: ProductData & { imageUrl?: string }): Promise<Product> {
    return toProduct(await prisma.product.update({ where: { id }, data, include }));
  }

  async softDelete(id: number): Promise<void> {
    await prisma.product.update({ where: { id }, data: { isActive: false } });
  }
}
