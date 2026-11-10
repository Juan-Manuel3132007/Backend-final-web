import type { ImageStorage } from "./application/ports/image-storage";
import type { TokenService } from "./application/ports/token-service";
import { AuthUseCases } from "./application/use-cases/auth.use-cases";
import { CategoryUseCases } from "./application/use-cases/category.use-cases";
import { OrderUseCases } from "./application/use-cases/order.use-cases";
import { ProductUseCases } from "./application/use-cases/product.use-cases";
import { env } from "./infrastructure/config/env";
import { PrismaCategoryRepository } from "./infrastructure/repository/prisma-category.repository";
import { PrismaOrderRepository } from "./infrastructure/repository/prisma-order.repository";
import { PrismaProductRepository } from "./infrastructure/repository/prisma-product.repository";
import { PrismaUserRepository } from "./infrastructure/repository/prisma-user.repository";
import { BcryptPasswordHasher } from "./infrastructure/services/bcrypt-password-hasher";
import { JwtTokenService } from "./infrastructure/services/jwt-token.service";
import { SupabaseImageStorage } from "./infrastructure/services/supabase-image-storage";
import { AuthController } from "./interface/controllers/auth.controller";
import { CategoryController } from "./interface/controllers/category.controller";
import { OrderController } from "./interface/controllers/order.controller";
import { ProductController } from "./interface/controllers/product.controller";

/** Raíz de composición: aquí se conectan las implementaciones concretas con los casos de uso. */
export function createContainer() {
  const users = new PrismaUserRepository();
  const categories = new PrismaCategoryRepository();
  const products = new PrismaProductRepository();
  const orders = new PrismaOrderRepository();

  const tokenService: TokenService = new JwtTokenService(env.jwtSecret, env.jwtExpiresIn);
  const imageStorage: ImageStorage = new SupabaseImageStorage(
    env.supabaseUrl,
    env.supabaseServiceRoleKey,
    env.supabaseBucket,
  );

  return {
    tokenService,
    authController: new AuthController(new AuthUseCases(users, new BcryptPasswordHasher(), tokenService)),
    categoryController: new CategoryController(new CategoryUseCases(categories)),
    productController: new ProductController(new ProductUseCases(products, categories, imageStorage)),
    orderController: new OrderController(new OrderUseCases(orders, products)),
  };
}

export type Container = ReturnType<typeof createContainer>;
