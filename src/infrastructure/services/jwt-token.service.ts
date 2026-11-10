import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { UnauthorizedError } from "../../application/errors/app-error";
import type { TokenService } from "../../application/ports/token-service";
import { ROLES, type AuthUser, type Role } from "../../domain/models/user";

function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export class JwtTokenService implements TokenService {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string,
  ) {}

  sign(user: AuthUser): string {
    const options: SignOptions = { expiresIn: this.expiresIn as SignOptions["expiresIn"] };
    return jwt.sign({ sub: String(user.id), role: user.role }, this.secret, options);
  }

  verify(token: string): AuthUser {
    let payload: string | JwtPayload;
    try {
      payload = jwt.verify(token, this.secret);
    } catch {
      throw new UnauthorizedError("Token inválido o expirado. Inicia sesión otra vez.");
    }
    const id = typeof payload === "object" ? Number(payload.sub) : NaN;
    const role = typeof payload === "object" ? payload.role : undefined;
    if (!Number.isInteger(id) || !isRole(role)) {
      throw new UnauthorizedError("Token inválido o expirado. Inicia sesión otra vez.");
    }
    return { id, role };
  }
}
