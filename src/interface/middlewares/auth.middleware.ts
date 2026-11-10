import type { NextFunction, Request, Response } from "express";
import { ForbiddenError, UnauthorizedError } from "../../application/errors/app-error";
import type { TokenService } from "../../application/ports/token-service";
import type { AuthUser, Role } from "../../domain/models/user";

/** Verifica el header Authorization: Bearer <token> y deja el usuario en req.user. */
export function createAuthenticate(tokens: TokenService) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedError("Debes iniciar sesión: falta el token de autenticación.");
    }
    req.user = tokens.verify(header.slice("Bearer ".length).trim());
    next();
  };
}

/** Restringe la ruta a los roles indicados. Va siempre después de authenticate. */
export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError("No tienes permiso para realizar esta acción.");
    }
    next();
  };
}

/** Para controladores de rutas protegidas: devuelve el usuario autenticado. */
export function getAuthUser(req: Request): AuthUser {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  return req.user;
}
