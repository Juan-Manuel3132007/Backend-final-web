import type { Request, Response } from "express";
import type { AuthUseCases } from "../../application/use-cases/auth.use-cases";
import { loginSchema, registerSchema } from "../../infrastructure/dtos/auth.dto";
import { getAuthUser } from "../middlewares/auth.middleware";

export class AuthController {
  constructor(private readonly auth: AuthUseCases) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const result = await this.auth.register(registerSchema.parse(req.body ?? {}));
    res.status(201).json({ data: result });
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const result = await this.auth.login(loginSchema.parse(req.body ?? {}));
    res.status(200).json({ data: result });
  };

  me = async (req: Request, res: Response): Promise<void> => {
    const user = await this.auth.me(getAuthUser(req).id);
    res.status(200).json({ data: user });
  };
}
