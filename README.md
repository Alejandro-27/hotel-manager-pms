# HotelManager PMS & POS

Sistema de gestión hotelera (PMS) y punto de venta (POS) para catering. Monorepo con frontend Next.js y backend Fastify.

## Stack

- **Frontend**: Next.js 16.1.6 (App Router), React 19.2.4, Tailwind CSS 4.2, shadcn/ui, Recharts, pnpm
- **Backend**: Fastify 5, TypeScript, tsx, Drizzle ORM
- **Base de datos**: PostgreSQL 16 (Docker)
- **Tipos compartidos**: `@hotel/types` (pnpm workspaces)

## Inicio rápido

```bash
pnpm install
docker compose up -d          # PostgreSQL en localhost:5432
pnpm --filter @hotel/backend db:migrate   # crear tablas
pnpm --filter @hotel/backend seed         # datos de ejemplo
pnpm dev        # Frontend en http://localhost:3000
pnpm dev:api    # Backend en http://localhost:3001
```

## Comandos

| Comando | Descripción |
|---|---|
| `pnpm dev` | Frontend (servidor de desarrollo) |
| `pnpm dev:api` | Backend (tsx watch) |
| `pnpm build` | Build frontend |
| `pnpm build:api` | Build backend (tsc → `dist/`) |
| `pnpm lint` | ESLint frontend |
| `pnpm test` | Vitest frontend |
| `pnpm test:api` | Vitest backend (requiere PostgreSQL) |
| `docker compose up -d` | Levantar PostgreSQL |
| `pnpm --filter @hotel/backend db:migrate` | Aplicar migraciones |
| `pnpm --filter @hotel/backend db:generate` | Generar migración desde el schema |
| `pnpm --filter @hotel/backend seed` | Cargar datos de ejemplo |

## Estructura

```
frontend/         → Next.js (consume la API real)
  app/            → Páginas y layouts (App Router)
  components/
    ui/           → Componentes shadcn/ui
    views/        → 8 vistas principales del sistema
  lib/
    api.ts        → Cliente de la API real (fetch + endpoints)
    types.ts      → Re-export de @hotel/types
    validations.ts→ Schemas zod
    utils.ts      → Utilidades (cn, formatCurrency, exportToCsv)
backend/          → Fastify API (auth JWT + PostgreSQL/Drizzle)
  src/modules/    → auth, rooms, guests, reservations, pos, billing, expenses, reports
  src/db/         → Schema Drizzle, migraciones y seed
  test/           → Tests e2e de API (Vitest) contra BD dedicada
  bruno/          → Colección Bruno (39 requests) para probar la API
docker-compose.yml → PostgreSQL 16 local
packages/
  types/          → @hotel/types — tipos de dominio compartidos
```

## API

Servidor en `http://localhost:3001`. Login: `admin@hotel.com` / `Admin123!` (admin) y `recepcion@hotel.com` / `Admin123!` (recepcion). Colección de pruebas en `backend/bruno/` (importar en Bruno, entorno `dev`). Autenticación: header `Authorization: Bearer <token>`; los endpoints de escritura de habitaciones, productos, gastos e informes financieros requieren rol admin.

## Vistas principales

- **Dashboard** — Panel de control con KPIs y check-in rápido
- **Calendario** — Vista Gantt de reservas
- **Huéspedes** — Gestión de huéspedes y reservas
- **TPV** — Punto de venta de catering e inventario
- **Facturación** — Facturas y pagos
- **Habitaciones** — Gestión de habitaciones
- **Configuración** — Perfil, contraseña y tema
- **Informes** — KPIs, informe financiero por periodo, gastos y export CSV

## Estado actual

- Frontend completo conectado a la API real (auth JWT, sin datos mock excepto `/designs`)
- Backend completo: auth JWT con refresh, habitaciones, huéspedes, reservas (checkin/checkout/cancel), POS, facturación, gastos e informes sobre PostgreSQL (Drizzle), con migraciones, seed y tests
