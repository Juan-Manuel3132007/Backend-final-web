import type { Request, Response } from "express";
import type { OrderUseCases } from "../../application/use-cases/order.use-cases";
import { idParamSchema } from "../../infrastructure/dtos/common.dto";
import { createOrderSchema, orderQuerySchema, updateOrderStatusSchema } from "../../infrastructure/dtos/order.dto";
import { getAuthUser } from "../middlewares/auth.middleware";

export class OrderController {
  constructor(private readonly orders: OrderUseCases) {}

  list = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json(await this.orders.list(getAuthUser(req), orderQuerySchema.parse(req.query)));
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { id } = idParamSchema.parse(req.params);
    res.status(200).json({ data: await this.orders.getById(getAuthUser(req), id) });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const order = await this.orders.create(getAuthUser(req), createOrderSchema.parse(req.body ?? {}));
    res.status(201).json({ data: order });
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    const { id } = idParamSchema.parse(req.params);
    const { status } = updateOrderStatusSchema.parse(req.body ?? {});
    res.status(200).json({ data: await this.orders.updateStatus(getAuthUser(req), id, status) });
  };

  cancel = async (req: Request, res: Response): Promise<void> => {
    const { id } = idParamSchema.parse(req.params);
    await this.orders.cancel(getAuthUser(req), id);
    res.status(204).send();
  };
}
