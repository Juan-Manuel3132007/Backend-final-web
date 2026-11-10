import type { Request, Response } from "express";
import type { CategoryUseCases } from "../../application/use-cases/category.use-cases";
import { categoryBodySchema, categoryQuerySchema } from "../../infrastructure/dtos/category.dto";
import { idParamSchema } from "../../infrastructure/dtos/common.dto";

export class CategoryController {
  constructor(private readonly categories: CategoryUseCases) {}

  list = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json(await this.categories.list(categoryQuerySchema.parse(req.query)));
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { id } = idParamSchema.parse(req.params);
    res.status(200).json({ data: await this.categories.getById(id) });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const category = await this.categories.create(categoryBodySchema.parse(req.body ?? {}));
    res.status(201).json({ data: category });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { id } = idParamSchema.parse(req.params);
    const category = await this.categories.update(id, categoryBodySchema.parse(req.body ?? {}));
    res.status(200).json({ data: category });
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const { id } = idParamSchema.parse(req.params);
    await this.categories.remove(id);
    res.status(204).send();
  };
}
