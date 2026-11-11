import type { ImageFile, ImageStorage } from "../src/application/ports/image-storage";
import type { PasswordHasher } from "../src/application/ports/password-hasher";
import type { Category, CategoryData, CategoryFilters } from "../src/domain/models/category";
import type { CreateOrderData, Order, OrderFilters, OrderStatus } from "../src/domain/models/order";
import type { PageResult } from "../src/domain/models/pagination";
import type { Product, ProductData, ProductFilters } from "../src/domain/models/product";
import type { CreateUserData, User, UserWithPassword } from "../src/domain/models/user";
import type { CategoryRepository } from "../src/domain/repository/category.repository";
import type { OrderRepository } from "../src/domain/repository/order.repository";
import type { ProductRepository } from "../src/domain/repository/product.repository";
import type { UserRepository } from "../src/domain/repository/user.repository";

/** Repositorios en memoria: permiten probar los casos de uso sin base de datos. */

function page<T>(items: T[], query: { page: number; limit: number }): PageResult<T> {
  const start = (query.page - 1) * query.limit;
  return { items: items.slice(start, start + query.limit), total: items.length };
}

export class FakeHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    return `hashed:${plain}`;
  }
  async compare(plain: string, hash: string): Promise<boolean> {
    return hash === `hashed:${plain}`;
  }
}

export class FakeStorage implements ImageStorage {
  uploaded: ImageFile[] = [];
  async upload(file: ImageFile): Promise<string> {
    this.uploaded.push(file);
    return `https://storage.test/${file.originalName}`;
  }
}

export class InMemoryUserRepository implements UserRepository {
  rows: UserWithPassword[] = [];

  async findByEmail(email: string): Promise<UserWithPassword | null> {
    return this.rows.find((row) => row.email === email) ?? null;
  }
  async findById(id: number): Promise<User | null> {
    const found = this.rows.find((row) => row.id === id);
    if (!found) return null;
    const { password: _password, ...user } = found;
    return user;
  }
  async create(data: CreateUserData): Promise<User> {
    const row: UserWithPassword = {
      id: this.rows.length + 1,
      name: data.name,
      email: data.email,
      role: data.role,
      isActive: true,
      createdAt: new Date(),
      password: data.passwordHash,
    };
    this.rows.push(row);
    const { password: _password, ...user } = row;
    return user;
  }
}

export class InMemoryCategoryRepository implements CategoryRepository {
  rows: Category[] = [];
  constructor(private readonly products?: InMemoryProductRepository) {}

  async findMany(filters: CategoryFilters): Promise<PageResult<Category>> {
    return page(
      this.rows.filter((row) => row.isActive),
      filters,
    );
  }
  async findById(id: number): Promise<Category | null> {
    return this.rows.find((row) => row.id === id) ?? null;
  }
  async findByName(name: string): Promise<Category | null> {
    return this.rows.find((row) => row.name.toLowerCase() === name.toLowerCase()) ?? null;
  }
  async countActiveProducts(id: number): Promise<number> {
    return this.products?.rows.filter((row) => row.categoryId === id && row.isActive).length ?? 0;
  }
  async create(data: CategoryData): Promise<Category> {
    const now = new Date();
    const row = { id: this.rows.length + 1, ...data, isActive: true, createdAt: now, updatedAt: now };
    this.rows.push(row);
    return row;
  }
  async update(id: number, data: CategoryData): Promise<Category> {
    const row = this.rows.find((item) => item.id === id);
    if (!row) throw new Error("not found");
    Object.assign(row, data);
    return row;
  }
  async softDelete(id: number): Promise<void> {
    const row = this.rows.find((item) => item.id === id);
    if (row) row.isActive = false;
  }
}

export class InMemoryProductRepository implements ProductRepository {
  rows: Product[] = [];

  async findMany(filters: ProductFilters): Promise<PageResult<Product>> {
    return page(
      this.rows.filter((row) => row.isActive),
      filters,
    );
  }
  async findById(id: number): Promise<Product | null> {
    return this.rows.find((row) => row.id === id) ?? null;
  }
  async findActiveByIds(ids: number[]): Promise<Product[]> {
    return this.rows.filter((row) => ids.includes(row.id) && row.isActive);
  }
  async create(data: ProductData & { imageUrl: string | null }): Promise<Product> {
    const now = new Date();
    const row: Product = {
      id: this.rows.length + 1,
      ...data,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    this.rows.push(row);
    return row;
  }
  async update(id: number, data: ProductData & { imageUrl?: string }): Promise<Product> {
    const row = this.rows.find((item) => item.id === id);
    if (!row) throw new Error("not found");
    Object.assign(row, data);
    return row;
  }
  async softDelete(id: number): Promise<void> {
    const row = this.rows.find((item) => item.id === id);
    if (row) row.isActive = false;
  }
}

export class InMemoryOrderRepository implements OrderRepository {
  rows: Order[] = [];
  constructor(private readonly products: InMemoryProductRepository) {}

  async findMany(filters: OrderFilters): Promise<PageResult<Order>> {
    return page(
      this.rows.filter((row) => !filters.userId || row.userId === filters.userId),
      filters,
    );
  }
  async findById(id: number): Promise<Order | null> {
    return this.rows.find((row) => row.id === id) ?? null;
  }
  async createAndReserveStock(data: CreateOrderData): Promise<Order> {
    for (const item of data.items) {
      const product = this.products.rows.find((row) => row.id === item.productId);
      if (product) product.stock -= item.quantity;
    }
    const now = new Date();
    const order: Order = {
      id: this.rows.length + 1,
      userId: data.userId,
      total: data.total,
      status: "PENDING",
      shippingAddress: data.shippingAddress,
      createdAt: now,
      updatedAt: now,
      items: data.items.map((item, index) => ({ id: index + 1, ...item })),
    };
    this.rows.push(order);
    return order;
  }
  async updateStatus(id: number, status: Exclude<OrderStatus, "CANCELLED">): Promise<Order> {
    const order = this.rows.find((row) => row.id === id);
    if (!order) throw new Error("not found");
    order.status = status;
    return order;
  }
  async cancelAndRestoreStock(id: number): Promise<Order> {
    const order = this.rows.find((row) => row.id === id);
    if (!order) throw new Error("not found");
    order.status = "CANCELLED";
    for (const item of order.items) {
      const product = this.products.rows.find((row) => row.id === item.productId);
      if (product) product.stock += item.quantity;
    }
    return order;
  }
}

export function makeProduct(overrides: Partial<Product> = {}): Product {
  const now = new Date();
  return {
    id: 1,
    name: "Juego de prueba",
    description: "Descripción de prueba",
    price: 100000,
    stock: 5,
    platform: "PS5",
    imageUrl: null,
    isActive: true,
    categoryId: 1,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
