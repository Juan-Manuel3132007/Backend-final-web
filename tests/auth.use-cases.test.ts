import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { AuthUseCases } from "../src/application/use-cases/auth.use-cases";
import { JwtTokenService } from "../src/infrastructure/services/jwt-token.service";
import { FakeHasher, InMemoryUserRepository } from "./fakes";

describe("AuthUseCases", () => {
  let users: InMemoryUserRepository;
  let tokens: JwtTokenService;
  let auth: AuthUseCases;

  beforeEach(() => {
    users = new InMemoryUserRepository();
    tokens = new JwtTokenService("secreto-de-prueba", "1h");
    auth = new AuthUseCases(users, new FakeHasher(), tokens);
  });

  it("registra un usuario con rol USER, guarda el hash y devuelve un token válido", async () => {
    const result = await auth.register({ name: "Ana", email: "ANA@test.com", password: "Secreta123" });

    assert.equal(result.user.role, "USER");
    assert.equal(result.user.email, "ana@test.com");
    assert.equal("password" in result.user, false);
    assert.equal(users.rows[0]?.password, "hashed:Secreta123");
    assert.deepEqual(tokens.verify(result.token), { id: result.user.id, role: "USER" });
  });

  it("responde 409 si el correo ya está registrado", async () => {
    await auth.register({ name: "Ana", email: "ana@test.com", password: "Secreta123" });
    await assert.rejects(auth.register({ name: "Otra", email: "ana@test.com", password: "Secreta123" }), {
      statusCode: 409,
    });
  });

  it("inicia sesión con credenciales correctas sin devolver la contraseña", async () => {
    await auth.register({ name: "Ana", email: "ana@test.com", password: "Secreta123" });
    const result = await auth.login({ email: "ana@test.com", password: "Secreta123" });

    assert.equal(result.user.email, "ana@test.com");
    assert.equal("password" in result.user, false);
  });

  it("responde 401 con el mismo mensaje si falla el correo o la contraseña", async () => {
    await auth.register({ name: "Ana", email: "ana@test.com", password: "Secreta123" });

    const wrongPassword = await auth.login({ email: "ana@test.com", password: "mala" }).catch((error) => error);
    const wrongEmail = await auth.login({ email: "nadie@test.com", password: "Secreta123" }).catch((error) => error);

    assert.equal(wrongPassword.statusCode, 401);
    assert.equal(wrongEmail.statusCode, 401);
    assert.equal(wrongPassword.message, wrongEmail.message);
  });
});
