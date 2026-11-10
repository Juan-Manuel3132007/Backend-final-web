import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import type { Container } from "./container";
import { errorHandler, notFoundHandler } from "./interface/middlewares/error.middleware";
import { createApiRouter } from "./interface/routers";

export function createApp(container: Container, corsOrigins: string[]): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: corsOrigins }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/", (_req, res) => {
    res.status(200).json({ name: "Respawn API", status: "ok", health: "/api/health" });
  });
  app.use("/api", createApiRouter(container));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
