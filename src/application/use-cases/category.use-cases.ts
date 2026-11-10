import type { Category, CategoryData, CategoryFilters } from "../../domain/models/category";
import type { Paginated } from "../../domain/models/pagination";
import type { CategoryRepository } from "../../domain/repository/category.repository";
import { ConflictError, NotFoundError } from "../errors/app-error";
import { toPaginated } from "../utils/paginate";

export class CategoryUseCases {
  constructor(private readonly categories: CategoryRepository) {}

  async list(filters: CategoryFilters): Promise<Paginated<Category>> {
    return toPaginated(await this.categories.findMany(filters), filters);
  }

  async getById(id: number): Promise<Category> {
    const category = await this.categories.findById(id);
    if (!category || !category.isActive) {
      throw new NotFoundError(`La categoría ${id} no existe.`);
    }
    return category;
  }

  async create(data: CategoryData): Promise<Category> {
    await this.ensureNameIsFree(data.name);
    return this.categories.create(data);
  }

  async update(id: number, data: CategoryData): Promise<Category> {
    await this.getById(id);
    await this.ensureNameIsFree(data.name, id);
    return this.categories.update(id, data);
  }

  async remove(id: number): Promise<void> {
    await this.getById(id);
    const activeProducts = await this.categories.countActiveProducts(id);
    if (activeProducts > 0) {
      throw new ConflictError(
        `No se puede eliminar: la categoría tiene ${activeProducts} producto(s) activo(s). Muévelos o elimínalos primero.`,
      );
    }
    await this.categories.softDelete(id);
  }

  private async ensureNameIsFree(name: string, currentId?: number): Promise<void> {
    const sameName = await this.categories.findByName(name);
    if (sameName && sameName.id !== currentId) {
      throw new ConflictError(`Ya existe una categoría llamada "${name}".`);
    }
  }
}
