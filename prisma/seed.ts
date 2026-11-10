import { Platform, PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const users = [
  { name: "Admin Respawn", email: "admin@respawn.com", password: "Admin123!", role: Role.ADMIN },
  { name: "Camila Gómez", email: "user@respawn.com", password: "User123!", role: Role.USER },
];

const categories = [
  { name: "Videojuegos", description: "Juegos físicos y digitales para todas las plataformas." },
  { name: "Consolas", description: "Consolas de última generación y ediciones especiales." },
  { name: "Accesorios", description: "Controles, audífonos, cargadores y más para tu setup." },
  { name: "Figuras coleccionables", description: "Figuras de tus personajes favoritos para la repisa." },
];

const products = [
  {
    name: "Aventura Estelar",
    category: "Videojuegos",
    platform: Platform.PS5,
    price: 249900,
    stock: 15,
    description: "Juego de acción y exploración espacial con campaña de más de 40 horas.",
  },
  {
    name: "Liga de Carreras Turbo",
    category: "Videojuegos",
    platform: Platform.MULTI,
    price: 189900,
    stock: 20,
    description: "Carreras arcade con modo local para cuatro jugadores y pistas personalizables.",
  },
  {
    name: "Reino de Píxeles",
    category: "Videojuegos",
    platform: Platform.SWITCH,
    price: 219900,
    stock: 12,
    description: "Plataformas en 2D con estética retro, jefes desafiantes y secretos por descubrir.",
  },
  {
    name: "Táctica Final",
    category: "Videojuegos",
    platform: Platform.PC,
    price: 129900,
    stock: 30,
    description: "Estrategia por turnos con escuadrones, mapas procedurales y modo en línea.",
  },
  {
    name: "Consola PlayStation 5 Slim",
    category: "Consolas",
    platform: Platform.PS5,
    price: 2899900,
    stock: 5,
    description: "Consola PS5 edición Slim con lector de discos y 1 TB de almacenamiento.",
  },
  {
    name: "Consola Nintendo Switch OLED",
    category: "Consolas",
    platform: Platform.SWITCH,
    price: 1699900,
    stock: 7,
    description: "Pantalla OLED de 7 pulgadas, base con puerto LAN y 64 GB de memoria interna.",
  },
  {
    name: "Control inalámbrico Pro",
    category: "Accesorios",
    platform: Platform.XBOX,
    price: 289900,
    stock: 25,
    description: "Control inalámbrico con gatillos de precisión y batería de larga duración.",
  },
  {
    name: "Audífonos Gamer 7.1",
    category: "Accesorios",
    platform: Platform.MULTI,
    price: 349900,
    stock: 18,
    description: "Sonido envolvente 7.1, micrófono con cancelación de ruido y almohadillas suaves.",
  },
  {
    name: "Figura Guerrero Pixel 20 cm",
    category: "Figuras coleccionables",
    platform: Platform.MULTI,
    price: 159900,
    stock: 10,
    description: "Figura articulada de 20 cm con accesorios intercambiables y base.",
  },
];

async function main(): Promise<void> {
  for (const user of users) {
    const password = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, role: user.role, password, isActive: true },
      create: { name: user.name, email: user.email, role: user.role, password },
    });
  }

  const categoryIds = new Map<string, number>();
  for (const category of categories) {
    const saved = await prisma.category.upsert({
      where: { name: category.name },
      update: { description: category.description, isActive: true },
      create: category,
    });
    categoryIds.set(saved.name, saved.id);
  }

  for (const { category, ...product } of products) {
    const categoryId = categoryIds.get(category);
    if (!categoryId) continue;
    const existing = await prisma.product.findFirst({ where: { name: product.name } });
    if (!existing) {
      await prisma.product.create({ data: { ...product, categoryId } });
    }
  }

  console.info("Seed listo: admin@respawn.com / Admin123!  ·  user@respawn.com / User123!");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
