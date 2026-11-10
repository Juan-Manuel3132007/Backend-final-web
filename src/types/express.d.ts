import type { AuthUser } from "../domain/models/user";

declare global {
  namespace Express {
    interface Request {
      /** Lo llena el middleware authenticate a partir del JWT. */
      user?: AuthUser;
    }
  }
}

export {};
