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
| `docker compose up -d` | Levantar PostgreSQL |
| `pnpm --filter @hotel/backend db:migrate` | Aplicar migraciones |
| `pnpm --filter @hotel/backend db:generate` | Generar migración desde el schema |
| `pnpm --filter @hotel/backend seed` | Cargar datos de ejemplo |

## Estructura

```
frontend/         → Next.js (datos mock de momento)
  app/            → Páginas y layouts (App Router)
  components/
    ui/           → Componentes shadcn/ui
    views/        → Vistas principales del sistema
  lib/
    store.ts      → Datos mock y funciones helper
    validations.ts→ Schemas zod
    utils.ts      → Utilidades (cn, formatCurrency)
backend/          → Fastify API (auth JWT + PostgreSQL/Drizzle)
  src/modules/    → auth, rooms, guests, reservations, pos, billing, reports
  src/db/         → Schema Drizzle, migraciones y seed
  bruno/          → Colección Bruno para probar la API
docker-compose.yml → PostgreSQL 16 local
packages/
  types/          → @hotel/types — tipos de dominio compartidos
```

## API

Servidor en `http://localhost:3001`. Login: `admin@hotel.com` / `Admin123!` (admin) y `recepcion@hotel.com` / `Admin123!` (recepcion). Colección de pruebas en `backend/bruno/` (importar en Bruno, entorno `dev`). Autenticación: header `Authorization: Bearer <token>`; los endpoints de escritura de habitaciones y estado requieren rol admin.

## Vistas principales

- **Dashboard** — Panel de control con KPIs y gráficos
- **Calendario** — Vista Gantt de reservas
- **Huéspedes** — Gestión de huéspedes y reservas
- **TPV** — Punto de venta de catering e inventario
- **Facturación** — Facturas y pagos
- **Habitaciones** — Gestión de habitaciones
- **Configuración** — Ajustes del sistema
- **Informes** — KPIs y métricas avanzadas

## Estado actual

- Frontend completo con datos mock (sin persistencia, auth ficticia)
- Backend completo: auth JWT, habitaciones, huéspedes, reservas (checkin/checkout/cancel), POS, facturación e informes sobre PostgreSQL (Drizzle), con migraciones y seed
