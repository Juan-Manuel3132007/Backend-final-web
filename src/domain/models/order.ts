import type { PageQuery } from "./pagination";
import type { Platform } from "./product";

export const ORDER_STATUSES = ["PENDING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  product?: { id: number; name: string; imageUrl: string | null; platform: Platform };
}

export interface Order {
  id: number;
  userId: number;
  total: number;
  status: OrderStatus;
  shippingAddress: string;
  createdAt: Date;
  updatedAt: Date;
  user?: { id: number; name: string; email: string };
  items: OrderItem[];
}

export interface OrderItemData {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface CreateOrderData {
  userId: number;
  shippingAddress: string;
  total: number;
  items: OrderItemData[];
}

export interface OrderFilters extends PageQuery {
  userId?: number;
  status?: OrderStatus;
}