import type { User as PrismaUser } from "@prisma/client";
import type { CreateUserData, User, UserWithPassword } from "../../domain/models/user";
import type { UserRepository } from "../../domain/repository/user.repository";
import { prisma } from "../database/prisma";

/** Columnas públicas: la contraseña nunca sale de aquí salvo en findByEmail (login). */
const publicSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

function toUserWithPassword(row: PrismaUser): UserWithPassword {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    isActive: row.isActive,
    createdAt: row.createdAt,
    password: row.password,
  };
}

export class PrismaUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<UserWithPassword | null> {
    const row = await prisma.user.findUnique({ where: { email } });
    return row ? toUserWithPassword(row) : null;
  }

  async findById(id: number): Promise<User | null> {
    return prisma.user.findUnique({ where: { id }, select: publicSelect });
  }

  async create(data: CreateUserData): Promise<User> {
    return prisma.user.create({
      data: { name: data.name, email: data.email, password: data.passwordHash, role: data.role },
      select: publicSelect,
    });
  }
}
