import type { Prisma } from "@prisma/client";
import { ConflictError } from "../../application/errors/app-error";
import type { CreateOrderData, Order, OrderFilters, OrderStatus } from "../../domain/models/order";
import type { PageResult } from "../../domain/models/pagination";
import type { OrderRepository } from "../../domain/repository/order.repository";
import { prisma } from "../database/prisma";

const include = {
  user: { select: { id: true, name: true, email: true } },
  items: {
    include: { product: { select: { id: true, name: true, imageUrl: true, platform: true } } },
    orderBy: { id: "asc" },
  },
} as const;
type OrderRow = Prisma.OrderGetPayload<{ include: typeof include }>;

function toOrder(row: OrderRow): Order {
  return {
    ...row,
    total: row.total.toNumber(),
    items: row.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toNumber(),
      product: item.product,
    })),
  };
}

export class PrismaOrderRepository implements OrderRepository {
  async findMany(filters: OrderFilters): Promise<PageResult<Order>> {
    const where: Prisma.OrderWhereInput = {
      ...(filters.userId ? { userId: filters.userId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    };
    const [rows, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        include,
        orderBy: { createdAt: "desc" },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.order.count({ where }),
    ]);
    return { items: rows.map(toOrder), total };
  }

  async findById(id: number): Promise<Order | null> {
    const row = await prisma.order.findUnique({ where: { id }, include });
    return row ? toOrder(row) : null;
  }

  async createAndReserveStock(data: CreateOrderData): Promise<Order> {
    const row = await prisma.$transaction(async (tx) => {
      for (const item of data.items) {
        // Descuenta solo si todavía hay stock: evita vender de más con dos compras simultáneas.
        const { count } = await tx.product.updateMany({
          where: { id: item.productId, isActive: true, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (count === 0) {
          throw new ConflictError(`Stock insuficiente para el producto ${item.productId}.`);
        }
      }
      return tx.order.create({
        data: {
          userId: data.userId,
          shippingAddress: data.shippingAddress,
          total: data.total,
          items: { create: data.items },
        },
        include,
      });
    });
    return toOrder(row);
  }

  async updateStatus(id: number, status: Exclude<OrderStatus, "CANCELLED">): Promise<Order> {
    return toOrder(await prisma.order.update({ where: { id }, data: { status }, include }));
  }

  async cancelAndRestoreStock(id: number): Promise<Order> {
    const row = await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({ where: { id }, data: { status: "CANCELLED" }, include });
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
      return order;
    });
    return toOrder(row);
  }
}
