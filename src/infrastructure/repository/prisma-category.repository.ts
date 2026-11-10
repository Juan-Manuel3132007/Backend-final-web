import type { Prisma } from "@prisma/client";
import type { Category, CategoryData, CategoryFilters } from "../../domain/models/category";
import type { PageResult } from "../../domain/models/pagination";
import type { CategoryRepository } from "../../domain/repository/category.repository";
import { prisma } from "../database/prisma";

export class PrismaCategoryRepository implements CategoryRepository {
  async findMany(filters: CategoryFilters): Promise<PageResult<Category>> {
    const where: Prisma.CategoryWhereInput = {
      isActive: true,
      ...(filters.search ? { name: { contains: filters.search, mode: "insensitive" } } : {}),
    };
    const [items, total] = await prisma.$transaction([
      prisma.category.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.category.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: number): Promise<Category | null> {
    return prisma.category.findUnique({ where: { id } });
  }

  async findByName(name: string): Promise<Category | null> {
    return prisma.category.findFirst({ where: { name: { equals: name, mode: "insensitive" } } });
  }

  async countActiveProducts(id: number): Promise<number> {
    return prisma.product.count({ where: { categoryId: id, isActive: true } });
  }

  async create(data: CategoryData): Promise<Category> {
    return prisma.category.create({ data });
  }

  async update(id: number, data: CategoryData): Promise<Category> {
    return prisma.category.update({ where: { id }, data });
  }

  async softDelete(id: number): Promise<void> {
    await prisma.category.update({ where: { id }, data: { isActive: false } });
  }
}
