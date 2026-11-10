import { Router, type RequestHandler } from "express";
import type { CategoryController } from "../controllers/category.controller";
import { authorize } from "../middlewares/auth.middleware";

export function createCategoryRouter(controller: CategoryController, authenticate: RequestHandler): Router {
  const router = Router();
  const adminOnly = [authenticate, authorize("ADMIN")];

  router.get("/", controller.list);
  router.get("/:id", controller.getById);
  router.post("/", ...adminOnly, controller.create);
  router.put("/:id", ...adminOnly, controller.update);
  router.delete("/:id", ...adminOnly, controller.remove);
  return router;
}
