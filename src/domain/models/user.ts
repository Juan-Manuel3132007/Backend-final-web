export const ROLES = ["ADMIN", "USER"] as const;
export type Role = (typeof ROLES)[number];

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
}

/** Solo se usa dentro del backend (login). Nunca se envía en una respuesta. */
export interface UserWithPassword extends User {
  password: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
}

export interface AuthUser {
  id: number;
  role: Role;
}
