import { Router, type RequestHandler } from "express";
import type { ProductController } from "../controllers/product.controller";
import { authorize } from "../middlewares/auth.middleware";
import { uploadImage } from "../middlewares/upload.middleware";

export function createProductRouter(controller: ProductController, authenticate: RequestHandler): Router {
  const router = Router();
  const adminOnly = [authenticate, authorize("ADMIN")];

  router.get("/", controller.list);
  router.get("/:id", controller.getById);
  router.post("/", ...adminOnly, uploadImage, controller.create);
  router.put("/:id", ...adminOnly, uploadImage, controller.update);
  router.delete("/:id", ...adminOnly, controller.remove);
  return router;
}
