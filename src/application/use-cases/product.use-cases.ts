import type { Paginated } from "../../domain/models/pagination";
import type { Product, ProductData, ProductFilters } from "../../domain/models/product";
import type { CategoryRepository } from "../../domain/repository/category.repository";
import type { ProductRepository } from "../../domain/repository/product.repository";
import { BadRequestError, NotFoundError } from "../errors/app-error";
import type { ImageFile, ImageStorage } from "../ports/image-storage";
import { toPaginated } from "../utils/paginate";

export class ProductUseCases {
  constructor(
    private readonly products: ProductRepository,
    private readonly categories: CategoryRepository,
    private readonly storage: ImageStorage,
  ) {}

  async list(filters: ProductFilters): Promise<Paginated<Product>> {
    if (
      filters.minPrice !== undefined &&
      filters.maxPrice !== undefined &&
      filters.minPrice > filters.maxPrice
    ) {
      throw new BadRequestError("El precio mínimo no puede ser mayor que el precio máximo.");
    }
    return toPaginated(await this.products.findMany(filters), filters);
  }

  async getById(id: number): Promise<Product> {
    const product = await this.products.findById(id);
    if (!product || !product.isActive) {
      throw new NotFoundError(`El producto ${id} no existe.`);
    }
    return product;
  }

  async create(data: ProductData, image?: ImageFile): Promise<Product> {
    await this.ensureCategoryExists(data.categoryId);
    const imageUrl = image ? await this.storage.upload(image) : null;
    return this.products.create({ ...data, imageUrl });
  }

  async update(id: number, data: ProductData, image?: ImageFile): Promise<Product> {
    await this.getById(id);
    await this.ensureCategoryExists(data.categoryId);
    // Si no llega una imagen nueva se conserva la actual.
    const imageUrl = image ? await this.storage.upload(image) : undefined;
    return this.products.update(id, { ...data, ...(imageUrl ? { imageUrl } : {}) });
  }

  async remove(id: number): Promise<void> {
    await this.getById(id);
    await this.products.softDelete(id);
  }

  private async ensureCategoryExists(categoryId: number): Promise<void> {
    const category = await this.categories.findById(categoryId);
    if (!category || !category.isActive) {
      throw new NotFoundError(`La categoría ${categoryId} no existe.`);
    }
  }
}
