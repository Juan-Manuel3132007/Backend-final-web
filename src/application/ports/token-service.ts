import type { AuthUser } from "../../domain/models/user";

export interface TokenService {
  sign(user: AuthUser): string;
  /** Devuelve el usuario del token o lanza UnauthorizedError si es inválido o expiró. */
  verify(token: string): AuthUser;
}
