import { Router, type RequestHandler } from "express";
import type { OrderController } from "../controllers/order.controller";
import { authorize } from "../middlewares/auth.middleware";

export function createOrderRouter(controller: OrderController, authenticate: RequestHandler): Router {
  const router = Router();
  router.use(authenticate); // todas las rutas de pedidos requieren sesión

  router.get("/", controller.list);
  router.get("/:id", controller.getById);
  router.post("/", controller.create);
  router.put("/:id", authorize("ADMIN"), controller.updateStatus);
  router.delete("/:id", controller.cancel);
  return router;
}
