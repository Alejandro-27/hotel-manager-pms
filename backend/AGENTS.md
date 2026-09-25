# AGENTS.md — Backend

## Stack

- **Runtime**: Node.js v24
- **Framework**: Fastify 5 (TypeScript)
- **ORM**: Drizzle ORM (PostgreSQL via postgres-js)
- **Auth**: @fastify/jwt (decorators `authenticate` + `requireAdmin`)
- **Validación**: fastify-type-provider-zod@5 (schemas con `zod/v4`)
- **Build**: tsc → `dist/`, dev con tsx watch
- **DB**: PostgreSQL 16 (Docker, volumen persistente)

## Comandos

```bash
pnpm dev              # tsx watch (hot reload)
pnpm build            # tsc → dist/
pnpm start            # node dist/index.js
pnpm db:generate      # drizzle-kit generate (nueva migración)
pnpm db:migrate       # aplicar migraciones a PostgreSQL
pnpm seed             # datos de ejemplo (idempotente)
pnpm test             # Vitest (fastify.inject contra BD hotel_manager_test)
```

## Estructura

```
src/
├── app.ts              ← buildApp(): Fastify + CORS + plugins + rutas (exportado para Vercel)
├── index.ts            ← migrate on boot + listen (PORT 3001)
├── api.test.ts         ← Tests de API (fastify.inject, 20 tests)
├── config/env.ts       ← DATABASE_URL, JWT_SECRET, PORT, CORS_ORIGIN
├── db/
│   ├── index.ts        ← postgres client (pool max: 10) + drizzle instance
│   ├── schema.ts       ← 8 tablas: users, rooms, guests, reservations, products, sales, invoices, expenses
│   ├── migrate.ts      ← drizzle-orm/postgres-js/migrator
│   └── seed.ts         ← 20 rooms, 8 guests, 8 reservations, 14 products, 4 sales, 3 invoices, 12 expenses
├── plugins/
│   ├── auth.ts         ← @fastify/jwt register + decorators authenticate/requireAdmin
│   └── error-handler.ts ← AppError class + global error handler
└── modules/
    ├── auth/           ← register, login, me, profile (PATCH), password
    ├── rooms/          ← CRUD + PATCH status (admin only)
    ├── guests/         ← Búsqueda + CRUD
    ├── reservations/   ← CRUD + checkin/checkout/cancel (transactions)
    ├── pos/            ← CRUD products + POST sales (transactions) + stock (cargo a habitación crea/actualiza factura en curso)
    ├── billing/        ← GET invoices + GET invoice/:id + POST pay + syncInvoiceForReservation (upsert factura en estancia/check-out)
    ├── expenses/       ← CRUD gastos (list all roles, create/delete admin)
    └── reports/        ← GET dashboard, financial (?months=), occupancy
test/
└── global-setup.ts     ← Crea BD de test + migra + siembra admin
vitest.config.ts        ← Config de tests (NODE_ENV=test, BD hotel_manager_test)
```

## Convenciones de código

### Imports
```ts
// SIEMPRE extensión .js (moduleResolution nodenext)
import { db } from '../../db/index.js'
import { rooms } from '../../db/schema.js'
import { AppError } from '../../plugins/error-handler.js'
```

### Schemas zod (con fastify-type-provider-zod)
```ts
// SIEMPRE importar de 'zod/v4' (NO de 'zod')
import { z } from 'zod/v4'

// Registrar en app.ts ANTES de las rutas:
import { validatorCompiler, serializerCompiler } from 'fastify-type-provider-zod'
app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)
```

### Routes (con ZodTypeProvider)
```ts
import type { ZodTypeProvider } from 'fastify-type-provider-zod'

const typedApp = app.withTypeProvider<ZodTypeProvider>()

typedApp.get('/api/rooms', {
  preHandler: [app.authenticate],
  schema: { querystring: listQuerySchema },
}, async (req) => {
  const { status, floor } = req.query  // ← tipado correcto gracias a zod/v4
  return listRooms({ status, floor })
})

// POST/PUT: schema.body / schema.params
// GET con params: schema.params
```

### Transactions (PostgreSQL = async)
```ts
// SIEMPRE async en transactions (pg driver es async)
return db.transaction(async (tx) => {
  const reservation = await tx.select().from(reservations).where(eq(reservations.id, id)).get()
  // ...
  await tx.update(reservations).set({ status: 'checkin' }).where(eq(reservations.id, id))
  // ...
})

// NO usar .get() → usar (await ...)[0]
// NO usar .run() → pg retorna directamente
```

### Queries
```ts
// Select single → (await query)[0]
const room = (await db.select().from(rooms).where(eq(rooms.id, id)).limit(1))[0]

// Select all → retorna array directamente
const allRooms = await db.select().from(rooms).where(eq(rooms.status, 'libre'))

// Insert
await db.insert(rooms).values({ id, number, ... })

// Update (sin .run())
await db.update(rooms).set({ status: 'ocupada' }).where(eq(rooms.id, id))

// Delete
await db.delete(rooms).where(eq(rooms.id, id))
```

## Auth

- **Login**: `POST /api/auth/login` → retorna `{ user, token }`
- **Register**: `POST /api/auth/register` → primer usuario es admin, resto recepcion
- **Me**: `GET /api/auth/me` → requiere `Authorization: Bearer <token>`
- **Roles**: `admin` (write rooms/status), `recepcion` (lectura + guest CRUD + reservations)
- **Decorators**: `app.authenticate` (requiere token), `app.requireAdmin` (requiere rol admin)

## Endpoints

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | /health | No | Health check |
| POST | /api/auth/register | No | Registro (primero = admin) |
| POST | /api/auth/login | No | Login → token JWT + cookies (access + refresh) |
| POST | /api/auth/refresh | No | Renueva access token vía cookie refresh (7d) |
| POST | /api/auth/logout | No | Limpia cookies de sesión |
| GET | /api/auth/me | Sí | Datos del usuario actual |
| PATCH | /api/auth/profile | Sí | Actualiza name / hotelName |
| POST | /api/auth/password | Sí | Cambia contraseña (valida la actual) |
| GET | /api/rooms | Sí | Lista habitaciones (filtros: status, floor, type) |
| POST | /api/rooms | Admin | Crear habitación |
| GET | /api/rooms/:id | Sí | Detalle habitación |
| PATCH | /api/rooms/:id | Admin | Actualizar habitación |
| PATCH | /api/rooms/:id/status | Sí | Cambiar estado (libre/ocupada/mantenimiento/limpieza) |
| GET | /api/guests | Sí | Lista huéspedes (filtro: q = búsqueda) |
| POST | /api/guests | Sí | Crear huésped |
| GET | /api/guests/:id | Sí | Detalle huésped |
| PATCH | /api/guests/:id | Sí | Actualizar huésped |
| GET | /api/reservations | Sí | Lista reservas (filtros: status, roomId, guestId) |
| POST | /api/reservations | Sí | Crear reserva (verifica disponibilidad) |
| GET | /api/reservations/:id | Sí | Detalle reserva |
| PATCH | /api/reservations/:id/checkin | Sí | Check-in → room ocupada |
| PATCH | /api/reservations/:id/checkout | Sí | Check-out → room libre + factura (crea o finaliza la factura en curso) |
| PATCH | /api/reservations/:id/cancel | Sí | Cancelar reserva (borra la factura en curso si está pendiente) |
| GET | /api/products | Sí | Lista productos (filtro: category, campo active) |
| POST | /api/products | Admin | Crear producto (activo por defecto) |
| PATCH | /api/products/:id | Admin | Editar producto (cualquier campo, incluido active) |
| DELETE | /api/products/:id | Admin | Eliminar producto. 409 si tiene historial de ventas (desactivar en su lugar) |
| PATCH | /api/products/:id/stock | Sí | Actualizar stock |
| POST | /api/sales | Sí | Registrar venta (decrementa stock, transaction; cargo a habitación refleja el cargo en la factura al instante) |
| GET | /api/sales | Sí | Lista ventas (filtro: date) |
| GET | /api/invoices | Sí | Lista facturas (filtros: status, guestId) |
| GET | /api/invoices/:id | Sí | Detalle factura |
| POST | /api/invoices/:id/pay | Sí | Pagar factura (parcial o total) |
| GET | /api/expenses | Sí | Lista gastos (desc por fecha) |
| POST | /api/expenses | Admin | Crear gasto |
| DELETE | /api/expenses/:id | Admin | Eliminar gasto |
| GET | /api/reports/dashboard | Sí | KPIs: occupancy, dailyRevenue, pendingCheckins/Checkouts |
| GET | /api/reports/financial | Admin | Resumen financiero (query: months 1–24, default 6) |
| GET | /api/reports/occupancy | Sí | Ocupación por tipo (filtro: month YYYY-MM) |

## Database

- **Driver**: postgres (postgres-js v3.4.9)
- **Pooling**: max 10 conexiones
- **Migraciones**: `drizzle-kit generate` genera SQL, auto-apply en server start
- **Seed**: idempotente (skip si users existen), cierra conexión al terminar
- **Tablas**: users, rooms, guests, reservations, products, sales, invoices, expenses
- **Foreign keys**: reservations→guests+rooms, sales→rooms, invoices→reservations+guests, expenses→users (createdBy)

## Testing (Vitest)

- `pnpm test` ejecuta `vitest run` contra la BD **`hotel_manager_test`** (se crea y migra sola).
- `test/global-setup.ts` crea la BD si falta (`CREATE DATABASE`), aplica migraciones, trunca tablas y siembra un admin (`admin@test.com` / `Password123!`).
- Los tests usan `app.inject()` (fastify) sin puerto; auth vía `Authorization: Bearer`.
- Variables: `DB_ADMIN_URL` (BD de mantenimiento) y `TEST_DATABASE_URL` (BD de test). En CI se inyectan via service de PostgreSQL.
- El rate limiting se desactiva cuando `NODE_ENV=test`.

## Docker

```yaml
# docker-compose.yml (raíz del repo)
services:
  db:
    image: postgres:16-alpine
    container_name: hotel-pg
    environment:
      POSTGRES_USER: hotel
      POSTGRES_PASSWORD: hotel123
      POSTGRES_DB: hotel_manager
    ports: ['5432:5432']
    volumes: [hotel-pg-data:/var/lib/postgresql/data]
```

## Bruno Collection

Colección de 41 requests en `backend/bruno/` para testing de API:
- Importar en Bruno → seleccionar entorno `dev` (baseUrl: localhost:3001)
- Login automático: register/login scripts guardan `{{token}}`
- Organizado por módulo: health/, auth/, rooms/, guests/, reservations/, pos/, billing/, reports/ (incluye gastos: list/create/delete)

## Credenciales de desarrollo

- Admin: admin@hotel.com / Admin123!
- Recepcion: recepcion@hotel.com / Admin123!
- PostgreSQL: hotel / hotel123 / hotel_manager (localhost:5432)
- JWT_SECRET: dev-secret-change-me

## Cosas que NO deben modificarse sin razón clara

- `src/db/schema.ts` — Cambios aquí requieren regenerar migración + re-seed
- `src/plugins/auth.ts` — Lógica JWT. Modificar con cuidado
- `src/app.ts` — Registros de plugins y rutas. Agregar al final
- `src/config/env.ts` — Variables de entorno. Mantener compatible con .env.example
- `bruno/` — Collection de testing. Mantener sincronizada con los endpoints

## Problemas conocidos

- Access token 15m + refresh token 7d (cookie HttpOnly), refresh sin revocación server-side
- Rate limiting solo en `/api/auth/login`, `/api/auth/register` y `/api/auth/refresh` (global 300/min), desactivado bajo `NODE_ENV=test`
- Logging estructurado con pino + redacción de credenciales, sin correlación entre microservicios
- Seed hardcodea datos relativos a la fecha actual (no reproducible en tests)
- `reports/financial` no retorna `occupancyRate` (solo `totalRevenue`)
