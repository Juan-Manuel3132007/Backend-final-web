import type { CreateUserData, User, UserWithPassword } from "../models/user";

export interface UserRepository {
  findByEmail(email: string): Promise<UserWithPassword | null>;
  findById(id: number): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
}
