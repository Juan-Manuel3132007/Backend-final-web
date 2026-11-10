import type { User } from "../../domain/models/user";
import type { UserRepository } from "../../domain/repository/user.repository";
import { ConflictError, NotFoundError, UnauthorizedError } from "../errors/app-error";
import type { PasswordHasher } from "../ports/password-hasher";
import type { TokenService } from "../ports/token-service";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  user: User;
  token: string;
}

const INVALID_CREDENTIALS = "Correo o contraseña incorrectos.";

export class AuthUseCases {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
  ) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    const email = input.email.toLowerCase();
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new ConflictError("Este correo electrónico ya está registrado.");
    }

    const passwordHash = await this.hasher.hash(input.password);
    // El registro público siempre crea usuarios normales; el admin sale del seed.
    const user = await this.users.create({ name: input.name, email, passwordHash, role: "USER" });
    return { user, token: this.tokens.sign({ id: user.id, role: user.role }) };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const found = await this.users.findByEmail(input.email.toLowerCase());
    // Mismo mensaje si falla el correo o la contraseña: no revelamos cuál de los dos.
    if (!found || !found.isActive) {
      throw new UnauthorizedError(INVALID_CREDENTIALS);
    }
    const isValid = await this.hasher.compare(input.password, found.password);
    if (!isValid) {
      throw new UnauthorizedError(INVALID_CREDENTIALS);
    }

    const { password: _password, ...user } = found;
    return { user, token: this.tokens.sign({ id: user.id, role: user.role }) };
  }

  async me(userId: number): Promise<User> {
    const user = await this.users.findById(userId);
    if (!user || !user.isActive) {
      throw new NotFoundError("El usuario no existe.");
    }
    return user;
  }
}
