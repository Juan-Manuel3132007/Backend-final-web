import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { after, before, describe, it } from "node:test";
import { createApp } from "../src/app";
import { AuthUseCases } from "../src/application/use-cases/auth.use-cases";
import { CategoryUseCases } from "../src/application/use-cases/category.use-cases";
import { OrderUseCases } from "../src/application/use-cases/order.use-cases";
import { ProductUseCases } from "../src/application/use-cases/product.use-cases";
import type { Container } from "../src/container";
import { JwtTokenService } from "../src/infrastructure/services/jwt-token.service";
import { AuthController } from "../src/interface/controllers/auth.controller";
import { CategoryController } from "../src/interface/controllers/category.controller";
import { OrderController } from "../src/interface/controllers/order.controller";
import { ProductController } from "../src/interface/controllers/product.controller";
import {
  FakeHasher,
  FakeStorage,
  InMemoryCategoryRepository,
  InMemoryOrderRepository,
  InMemoryProductRepository,
  InMemoryUserRepository,
} from "./fakes";

/** Prueba la API completa (rutas, middlewares, validaciones y errores) con repositorios en memoria. */
describe("API HTTP", () => {
  const tokenService = new JwtTokenService("secreto-de-prueba", "1h");
  const storage = new FakeStorage();
  let server: Server;
  let baseUrl: string;
  let adminToken: string;
  let userToken: string;

  before(async () => {
    const users = new InMemoryUserRepository();
    const products = new InMemoryProductRepository();
    const categories = new InMemoryCategoryRepository(products);
    const hasher = new FakeHasher();
    const container: Container = {
      tokenService,
      authController: new AuthController(new AuthUseCases(users, hasher, tokenService)),
      categoryController: new CategoryController(new CategoryUseCases(categories)),
      productController: new ProductController(new ProductUseCases(products, categories, storage)),
      orderController: new OrderController(new OrderUseCases(new InMemoryOrderRepository(products), products)),
    };
    await users.create({ name: "Admin", email: "admin@test.com", passwordHash: "hashed:Admin123!", role: "ADMIN" });
    await categories.create({ name: "Videojuegos", description: null });
    adminToken = tokenService.sign({ id: 1, role: "ADMIN" });

    server = createApp(container, ["http://localhost:3000"]).listen(0);
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  after(() => {
    server.close();
  });

  async function call(method: string, path: string, options: { token?: string; body?: unknown } = {}) {
    const headers: Record<string, string> = {};
    if (options.token) headers.Authorization = `Bearer ${options.token}`;
    let body: BodyInit | undefined;
    if (options.body instanceof FormData) {
      body = options.body;
    } else if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(options.body);
    }
    const response = await fetch(`${baseUrl}${path}`, { method, headers, body });
    const text = await response.text();
    return { status: response.status, json: text ? JSON.parse(text) : undefined };
  }

  it("POST /api/auth/register → 201 con user y token, sin contraseña", async () => {
    const { status, json } = await call("POST", "/api/auth/register", {
      body: { name: "Camila", email: "camila@test.com", password: "User1234!" },
    });
    assert.equal(status, 201);
    assert.ok(json.data.token);
    assert.equal(json.data.user.password, undefined);
    userToken = json.data.token;
  });

  it("valida el body del registro → 400 con la lista de errores", async () => {
    const { status, json } = await call("POST", "/api/auth/register", { body: { email: "malo" } });
    assert.equal(status, 400);
    assert.ok(json.errors.length >= 2);
  });

  it("rutas protegidas: sin token 401, token inválido 401, rol sin permiso 403", async () => {
    assert.equal((await call("GET", "/api/orders")).status, 401);
    assert.equal((await call("GET", "/api/orders", { token: "token-falso" })).status, 401);
    const forbidden = await call("POST", "/api/categories", { token: userToken, body: { name: "Nueva" } });
    assert.equal(forbidden.status, 403);
  });

  it("crea un producto con imagen (multipart) y lo lista paginado", async () => {
    const form = new FormData();
    form.append("name", "Aventura Estelar");
    form.append("description", "Juego de acción y exploración espacial.");
    form.append("price", "249900");
    form.append("stock", "10");
    form.append("platform", "PS5");
    form.append("categoryId", "1");
    form.append("image", new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" }), "portada.png");

    const created = await call("POST", "/api/products", { token: adminToken, body: form });
    assert.equal(created.status, 201);
    assert.equal(created.json.data.imageUrl, "https://storage.test/portada.png");

    const list = await call("GET", "/api/products?page=1&limit=9&search=");
    assert.equal(list.status, 200);
    assert.deepEqual(list.json.pagination, { total: 1, currentPage: 1, limit: 9, totalPages: 1 });
  });

  it("rechaza archivos que no son imagen → 400", async () => {
    const form = new FormData();
    form.append("image", new Blob(["hola"], { type: "text/plain" }), "nota.txt");
    const { status } = await call("PUT", "/api/products/1", { token: adminToken, body: form });
    assert.equal(status, 400);
  });

  it("valida params y query → 400; recurso inexistente → 404", async () => {
    assert.equal((await call("GET", "/api/products/abc")).status, 400);
    assert.equal((await call("GET", "/api/products?page=-1")).status, 400);
    assert.equal((await call("GET", "/api/products/999")).status, 404);
    assert.equal((await call("GET", "/api/no-existe")).status, 404);
  });

  it("no deja borrar una categoría con productos activos → 409", async () => {
    const { status } = await call("DELETE", "/api/categories/1", { token: adminToken });
    assert.equal(status, 409);
  });

  it("flujo de pedido: crear (201), cancelar (204) y el admin ve el pedido", async () => {
    const created = await call("POST", "/api/orders", {
      token: userToken,
      body: { productId: 1, quantity: 2, shippingAddress: "Calle 10 # 20-30" },
    });
    assert.equal(created.status, 201);
    assert.equal(created.json.data.total, 499800);

    const cancelled = await call("DELETE", `/api/orders/${created.json.data.id}`, { token: userToken });
    assert.equal(cancelled.status, 204);

    const adminList = await call("GET", "/api/orders", { token: adminToken });
    assert.equal(adminList.json.data[0].status, "CANCELLED");
  });

  it("JSON mal formado → 400 sin stack trace", async () => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ esto no es json",
    });
    const json = await response.json();
    assert.equal(response.status, 400);
    assert.equal(json.stack, undefined);
  });
});
