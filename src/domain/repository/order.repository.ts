import type { CreateOrderData, Order, OrderFilters, OrderStatus } from "../models/order";
import type { PageResult } from "../models/pagination";

export interface OrderRepository {
  findMany(filters: OrderFilters): Promise<PageResult<Order>>;
  findById(id: number): Promise<Order | null>;
  /** Crea el pedido y descuenta el stock en una sola transacción. */
  createAndReserveStock(data: CreateOrderData): Promise<Order>;
  updateStatus(id: number, status: Exclude<OrderStatus, "CANCELLED">): Promise<Order>;
  /** Marca el pedido como CANCELLED (borrado lógico) y devuelve el stock. */
  cancelAndRestoreStock(id: number): Promise<Order>;
}