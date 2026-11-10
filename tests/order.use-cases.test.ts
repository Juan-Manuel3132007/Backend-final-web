import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { OrderUseCases } from "../src/application/use-cases/order.use-cases";
import type { AuthUser } from "../src/domain/models/user";
import { InMemoryOrderRepository, InMemoryProductRepository, makeProduct } from "./fakes";

const customer: AuthUser = { id: 10, role: "USER" };
const otherCustomer: AuthUser = { id: 11, role: "USER" };
const admin: AuthUser = { id: 1, role: "ADMIN" };

describe("OrderUseCases", () => {
  let products: InMemoryProductRepository;
  let orders: OrderUseCases;

  beforeEach(() => {
    products = new InMemoryProductRepository();
    products.rows.push(makeProduct({ id: 1, price: 100000, stock: 5 }), makeProduct({ id: 2, price: 25000.5, stock: 2 }));
    orders = new OrderUseCases(new InMemoryOrderRepository(products), products);
  });

  it("calcula el total, une productos repetidos y descuenta el stock", async () => {
    const order = await orders.create(customer, {
      shippingAddress: "Calle 10 # 20-30",
      items: [
        { productId: 1, quantity: 1 },
        { productId: 2, quantity: 2 },
        { productId: 1, quantity: 1 },
      ],
    });

    assert.equal(order.total, 250001);
    assert.equal(order.items.length, 2);
    assert.equal(products.rows[0]?.stock, 3);
    assert.equal(products.rows[1]?.stock, 0);
  });

  it("responde 409 si no hay stock suficiente", async () => {
    await assert.rejects(
      orders.create(customer, { shippingAddress: "Calle 10", items: [{ productId: 2, quantity: 3 }] }),
      { statusCode: 409 },
    );
  });

  it("responde 404 si el producto no existe o está inactivo", async () => {
    products.rows[0]!.isActive = false;
    await assert.rejects(
      orders.create(customer, { shippingAddress: "Calle 10", items: [{ productId: 1, quantity: 1 }] }),
      { statusCode: 404 },
    );
  });

  it("un usuario solo ve sus pedidos; el admin ve todos", async () => {
    await orders.create(customer, { shippingAddress: "Calle 1", items: [{ productId: 1, quantity: 1 }] });
    await orders.create(otherCustomer, { shippingAddress: "Calle 2", items: [{ productId: 1, quantity: 1 }] });

    const mine = await orders.list(customer, { page: 1, limit: 10 });
    const all = await orders.list(admin, { page: 1, limit: 10 });

    assert.equal(mine.pagination.total, 1);
    assert.equal(all.pagination.total, 2);
  });

  it("no deja ver ni cancelar el pedido de otro usuario (403)", async () => {
    const order = await orders.create(customer, { shippingAddress: "Calle 1", items: [{ productId: 1, quantity: 1 }] });
    await assert.rejects(orders.cancel(otherCustomer, order.id), { statusCode: 403 });
  });

  it("cancelar es un borrado lógico que devuelve el stock", async () => {
    const order = await orders.create(customer, { shippingAddress: "Calle 1", items: [{ productId: 1, quantity: 2 }] });
    const cancelled = await orders.cancel(customer, order.id);

    assert.equal(cancelled.status, "CANCELLED");
    assert.equal(products.rows[0]?.stock, 5);
    await assert.rejects(orders.cancel(customer, order.id), { statusCode: 409 });
  });

  it("el usuario no puede cancelar un pedido que ya fue enviado", async () => {
    const order = await orders.create(customer, { shippingAddress: "Calle 1", items: [{ productId: 1, quantity: 1 }] });
    await orders.updateStatus(admin, order.id, "SHIPPED");
    await assert.rejects(orders.cancel(customer, order.id), { statusCode: 409 });
  });
});
