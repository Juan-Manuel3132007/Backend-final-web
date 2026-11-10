import type { Order, OrderFilters, OrderItemData, OrderStatus } from "../../domain/models/order";
import type { Paginated } from "../../domain/models/pagination";
import type { AuthUser } from "../../domain/models/user";
import type { OrderRepository } from "../../domain/repository/order.repository";
import type { ProductRepository } from "../../domain/repository/product.repository";
import { ConflictError, ForbiddenError, NotFoundError } from "../errors/app-error";
import { toPaginated } from "../utils/paginate";

export interface CreateOrderInput {
  shippingAddress: string;
  items: Array<{ productId: number; quantity: number }>;
}

/** Une líneas repetidas del mismo producto: [{1,2},{1,1}] → [{1,3}]. */
function mergeItems(items: CreateOrderInput["items"]): Map<number, number> {
  const quantities = new Map<number, number>();
  for (const item of items) {
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  }
  return quantities;
}

export class OrderUseCases {
  constructor(
    private readonly orders: OrderRepository,
    private readonly products: ProductRepository,
  ) {}

  /** El admin ve todos los pedidos; un usuario normal solo los suyos. */
  async list(requester: AuthUser, filters: OrderFilters): Promise<Paginated<Order>> {
    const scoped = requester.role === "ADMIN" ? filters : { ...filters, userId: requester.id };
    return toPaginated(await this.orders.findMany(scoped), filters);
  }

  async getById(requester: AuthUser, id: number): Promise<Order> {
    const order = await this.orders.findById(id);
    if (!order) {
      throw new NotFoundError(`El pedido ${id} no existe.`);
    }
    if (requester.role !== "ADMIN" && order.userId !== requester.id) {
      throw new ForbiddenError("Este pedido pertenece a otro usuario.");
    }
    return order;
  }

  async create(requester: AuthUser, input: CreateOrderInput): Promise<Order> {
    const quantities = mergeItems(input.items);
    const productIds = [...quantities.keys()];
    const found = await this.products.findActiveByIds(productIds);

    const missing = productIds.filter((id) => !found.some((product) => product.id === id));
    if (missing.length > 0) {
      throw new NotFoundError(`Producto(s) no disponible(s): ${missing.join(", ")}.`);
    }

    const items: OrderItemData[] = found.map((product) => {
      const quantity = quantities.get(product.id) ?? 0;
      if (quantity > product.stock) {
        throw new ConflictError(
          `Stock insuficiente para "${product.name}": quedan ${product.stock} unidad(es).`,
        );
      }
      return { productId: product.id, quantity, unitPrice: product.price };
    });

    const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    return this.orders.createAndReserveStock({
      userId: requester.id,
      shippingAddress: input.shippingAddress,
      total: Math.round(total * 100) / 100,
      items,
    });
  }

  /** Solo el admin cambia el estado. Pasar a CANCELLED equivale a cancelar (devuelve el stock). */
  async updateStatus(requester: AuthUser, id: number, status: OrderStatus): Promise<Order> {
    const order = await this.getById(requester, id);
    if (order.status === "CANCELLED") {
      throw new ConflictError("El pedido está cancelado y ya no se puede modificar.");
    }
    if (status === "CANCELLED") {
      return this.cancel(requester, id);
    }
    return this.orders.updateStatus(id, status);
  }

  /** Borrado lógico: el pedido queda CANCELLED y se devuelve el stock. */
  async cancel(requester: AuthUser, id: number): Promise<Order> {
    const order = await this.getById(requester, id);
    if (order.status === "CANCELLED") {
      throw new ConflictError("El pedido ya estaba cancelado.");
    }
    if (order.status === "DELIVERED") {
      throw new ConflictError("Un pedido entregado no se puede cancelar.");
    }
    if (requester.role !== "ADMIN" && order.status !== "PENDING") {
      throw new ConflictError("Solo puedes cancelar pedidos que siguen pendientes.");
    }
    return this.orders.cancelAndRestoreStock(id);
  }
}
