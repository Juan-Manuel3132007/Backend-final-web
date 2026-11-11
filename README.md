# Respawn — Backend (API REST de la tienda gamer)

API REST de **Respawn**, una tienda de videojuegos, consolas, accesorios y figuras coleccionables. Proyecto de Aula de Desarrollo Web Full-Stack (2026-2).

**Stack:** Node.js · Express 5 · TypeScript · Prisma · PostgreSQL (Supabase) · JWT · bcrypt · Supabase Storage (S3) · Zod

## Enlaces

| Recurso | Enlace |
| :-- | :-- |
| API desplegada (Render) | https://backend-final-web-xbbs.onrender.com |
| Verificación de la API | https://backend-final-web-xbbs.onrender.com/api/health |
| Frontend desplegado (Vercel) | https://PENDIENTE.vercel.app |
| Repositorio backend | https://github.com/Juan-Manuel3132007/Backend-final-web |
| Repositorio frontend | https://github.com/Miguel-Angel-Salazar/Frontend-final-web |

> El plan gratuito de Render se suspende por inactividad: la primera petición puede tardar unos 50 segundos.

## Credenciales de prueba (creadas por el seed)

| Rol | Correo | Contraseña |
| :-- | :-- | :-- |
| ADMIN | `admin@respawn.com` | `Admin123!` |
| USER | `user@respawn.com` | `User123!` |

El admin no se puede registrar desde el formulario: solo lo crea el seed. Todo registro público queda con rol `USER`.

## Instalación y ejecución local

```bash
git clone https://github.com/Juan-Manuel3132007/Backend-final-web.git
cd Backend-final-web
npm install
cp .env.example .env        # y llena los valores reales
npx prisma migrate dev      # crea las tablas
npm run db:seed             # crea admin, user, categorías y productos
npm run dev                 # http://localhost:4000
```

Otros scripts: `npm test` (pruebas automatizadas), `npm run lint`, `npm run format`, `npm run build` y `npm start`.

## Variables de entorno

| Variable | Descripción |
| :-- | :-- |
| `PORT` | Puerto local (Render lo asigna solo) |
| `DATABASE_URL` | Conexión a PostgreSQL de Supabase (Transaction pooler, puerto 6543, `?pgbouncer=true`) |
| `DIRECT_URL` | Conexión Session pooler (puerto 5432), la usan las migraciones |
| `JWT_SECRET` | Secreto para firmar los tokens. Obligatorio, sin valor por defecto |
| `JWT_EXPIRES_IN` | Duración del token, por ejemplo `2h` |
| `CORS_ORIGIN` | Orígenes permitidos separados por coma |
| `SUPABASE_URL` | URL del proyecto de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave secreta de Supabase (solo en el backend, nunca en el frontend) |
| `SUPABASE_BUCKET` | Bucket público donde se guardan las imágenes (`products`) |

## Modelo de datos

- **User**: `name`, `email` (@unique), `password` (hash bcrypt), `role` (`ADMIN` / `USER`), `isActive`.
- **Category**: `name` (@unique), `description`, `isActive` (borrado lógico).
- **Product**: `name`, `description`, `price` (Decimal), `stock`, `platform`, `imageUrl`, `isActive` (borrado lógico), `categoryId` → **Category**.
- **Order**: `userId` → **User**, `total` (Decimal), `status` (`PENDING`, `SHIPPED`, `DELIVERED`, `CANCELLED`), `shippingAddress`.
- **OrderItem**: `orderId` → **Order**, `productId` → **Product**, `quantity`, `unitPrice` (Decimal).

## Endpoints

| Método | Ruta | Acceso | Descripción |
| :-- | :-- | :-- | :-- |
| GET | `/api/health` | Público | Estado de la API |
| POST | `/api/auth/register` | Público | Registro → `201 { data: { user, token } }` · 409 si el correo existe |
| POST | `/api/auth/login` | Público | Login → `200 { data: { user, token } }` · 401 credenciales inválidas |
| GET | `/api/auth/me` | Autenticado | Usuario de la sesión |
| GET | `/api/categories` | Público | Listado paginado (`page`, `limit`, `search`) |
| GET | `/api/categories/:id` | Público | Detalle |
| POST / PUT / DELETE | `/api/categories[/:id]` | ADMIN | Crear, editar, borrado lógico (409 si tiene productos activos) |
| GET | `/api/products` | Público | Listado paginado con filtros `search`, `categoryId`, `platform`, `minPrice`, `maxPrice` |
| GET | `/api/products/:id` | Público | Detalle |
| POST / PUT | `/api/products[/:id]` | ADMIN | `multipart/form-data` con la imagen en el campo `image` (JPG, PNG, WebP o GIF, máx. 5 MB) que se sube a Supabase Storage |
| DELETE | `/api/products/:id` | ADMIN | Borrado lógico (`isActive = false`) |
| GET | `/api/orders` | Autenticado | El admin ve todos; el usuario solo los suyos (`page`, `limit`, `status`) |
| GET | `/api/orders/:id` | Dueño o ADMIN | Detalle |
| POST | `/api/orders` | Autenticado | `{ shippingAddress, items: [{ productId, quantity }] }` · descuenta stock en una transacción |
| PUT | `/api/orders/:id` | ADMIN | `{ status }` |
| DELETE | `/api/orders/:id` | Dueño (si está pendiente) o ADMIN | Borrado lógico: pasa a `CANCELLED` y devuelve el stock |

Formato de los listados:

```json
{ "data": [], "pagination": { "total": 42, "currentPage": 2, "limit": 10, "totalPages": 5 } }
```

Formato de los errores (nunca se envía el stack trace):

```json
{ "message": "Datos inválidos.", "errors": [{ "field": "price", "message": "El precio debe ser mayor que cero." }] }
```

Códigos: 400 validación · 401 sin token o token inválido/expirado · 403 rol sin permiso · 404 no existe · 409 conflicto (correo repetido, sin stock, categoría con productos).

## Arquitectura (cuatro capas)

```text
src/
├── domain/            models/ (entidades) y repository/ (interfaces de los repositorios)
├── application/       use-cases/ (reglas de negocio), ports/ (interfaces de servicios), errors/
├── infrastructure/    repository/ (Prisma), services/ (bcrypt, JWT, Supabase), dtos/ (Zod), config/
├── interface/         controllers/, routers/, middlewares/ (auth, rol, subida, errores)
├── container.ts       conecta las implementaciones con los casos de uso
├── app.ts             configuración de Express
└── server.ts          punto de entrada
prisma/                schema.prisma, migraciones y seed
tests/                 pruebas de casos de uso y de la API con repositorios en memoria
```

Los casos de uso dependen de interfaces (`UserRepository`, `PasswordHasher`, `TokenService`, `ImageStorage`), no de Prisma ni de Supabase.

## Pruebas automatizadas

```bash
npm test
```

20 pruebas con `node:test` y repositorios en memoria: registro y login (409, 401, sin contraseña en la respuesta), reglas de pedidos (stock, totales, permisos, cancelación) y la API completa (401/403, validaciones 400, 404, subida de imagen multipart y paginación).

## Reparto del trabajo

| Integrante | Aporte |
| :-- | :-- |
| **Juan Manuel Moreno Muñoz** | Estructura del proyecto y configuración, capa de dominio, modelo de datos con Prisma y migración, conexión con Supabase (PostgreSQL y Storage), despliegue en Render y documentación del backend. |
| **Andrés Ortega** | Casos de uso (capa de aplicación), repositorios Prisma, servicios de JWT, bcrypt y Supabase, controladores, routers y middlewares, seed y pruebas automatizadas. |
| **Miguel Ángel Guarnizo Salazar** | Frontend completo en Next.js (ver su repositorio). |
