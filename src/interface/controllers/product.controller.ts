import type { Request, Response } from "express";
import type { ProductUseCases } from "../../application/use-cases/product.use-cases";
import { idParamSchema } from "../../infrastructure/dtos/common.dto";
import { productBodySchema, productQuerySchema } from "../../infrastructure/dtos/product.dto";
import { getImageFile } from "../middlewares/upload.middleware";

export class ProductController {
  constructor(private readonly products: ProductUseCases) {}

  list = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json(await this.products.list(productQuerySchema.parse(req.query)));
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { id } = idParamSchema.parse(req.params);
    res.status(200).json({ data: await this.products.getById(id) });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const product = await this.products.create(productBodySchema.parse(req.body ?? {}), getImageFile(req));
    res.status(201).json({ data: product });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { id } = idParamSchema.parse(req.params);
    const product = await this.products.update(id, productBodySchema.parse(req.body ?? {}), getImageFile(req));
    res.status(200).json({ data: product });
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const { id } = idParamSchema.parse(req.params);
    await this.products.remove(id);
    res.status(204).send();
  };
}
