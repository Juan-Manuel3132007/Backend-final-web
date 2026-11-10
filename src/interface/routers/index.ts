import { Router } from "express";
import type { Container } from "../../container";
import { createAuthenticate } from "../middlewares/auth.middleware";
import { createAuthRouter } from "./auth.router";
import { createCategoryRouter } from "./category.router";
import { createOrderRouter } from "./order.router";
import { createProductRouter } from "./product.router";

export function createApiRouter(container: Container): Router {
  const authenticate = createAuthenticate(container.tokenService);
  const router = Router();

  router.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });
  router.use("/auth", createAuthRouter(container.authController, authenticate));
  router.use("/categories", createCategoryRouter(container.categoryController, authenticate));
  router.use("/products", createProductRouter(container.productController, authenticate));
  router.use("/orders", createOrderRouter(container.orderController, authenticate));
  return router;
}
