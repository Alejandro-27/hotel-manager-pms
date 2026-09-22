# AGENTS.md — HotelManager PMS & POS

## Propósito

Sistema de gestión hotelera (PMS) y punto de venta (POS) para catering. Monorepo con frontend Next.js (mock data) y backend Fastify con PostgreSQL real.

## Stack

- **Monorepo**: pnpm workspaces (`frontend/`, `backend/`, `packages/*`)
- **Frontend**: Next.js 16.1.6 (App Router), React 19.2.4, Tailwind CSS 4.2 + shadcn/ui, Recharts 2.15, React Hook Form + Zod
- **Backend**: Fastify 5 + TypeScript, Drizzle ORM, PostgreSQL 16 (Docker)
- **Base de datos**: PostgreSQL 16 via Docker (`docker-compose.yml`), driver `postgres` (postgres-js)
- **Tipos compartidos**: `@hotel/types` en `packages/types/`
- **Package manager**: pnpm (NO npm)
- **Testing**: Vitest + React Testing Library (frontend)
- **API testing**: Bruno collection en `backend/bruno/` (34 requests)

## Inicio rápido

```bash
pnpm install
docker compose up -d                          # PostgreSQL en localhost:5432
pnpm --filter @hotel/backend db:migrate       # crear tablas
pnpm --filter @hotel/backend seed             # datos de ejemplo (20 hab, 8 huéspedes, 14 productos)
pnpm dev                                      # Frontend en http://localhost:3000
pnpm dev:api                                  # Backend en http://localhost:3001
```

## Comandos

| Comando | Descripción |
|---|---|
| `pnpm dev` | Frontend (Next.js dev server) |
| `pnpm dev:api` | Backend (tsx watch) |
| `pnpm build` | Build frontend |
| `pnpm build:api` | Build backend (tsc → `dist/`) |
| `pnpm lint` | ESLint frontend |
| `pnpm test` | Vitest frontend (49 tests) |
| `docker compose up -d` | Levantar PostgreSQL |
| `pnpm --filter @hotel/backend db:migrate` | Aplicar migraciones |
| `pnpm --filter @hotel/backend db:generate` | Generar migración desde schema |
| `pnpm --filter @hotel/backend seed` | Cargar datos de ejemplo |
| `pnpm --filter @hotel/backend start` | Ejecutar backend (producción) |

## Estructura del monorepo

```
packages/
└── types/                  ← @hotel/types — tipos de dominio compartidos
frontend/                   ← @hotel/frontend — Next.js (mock data)
├── app/
│   ├── page.tsx            ← Página principal, controla auth + routing
│   ├── layout.tsx          ← Root layout
│   ├── globals.css         ← Theme variables light/dark
│   └── designs/page.tsx    ← Página de mockups
├── components/
│   ├── app-sidebar.tsx     ← Navegación lateral
│   ├── auth-screen.tsx     ← Login/registro (ficticio, validado con zod)
│   ├── ui/                 ← ~50 shadcn/ui components
│   └── views/              ← 8 vistas principales del sistema
│       ├── dashboard-view.tsx
│       ├── calendar-view.tsx
│       ├── guests-view.tsx
│       ├── pos-view.tsx
│       ├── billing-view.tsx
│       ├── rooms-view.tsx
│       ├── settings-view.tsx
│       └── reports-view.tsx
└── lib/
    ├── store.ts            ← Mock data + funciones helper
    ├── types.ts            ← Re-export de @hotel/types (backward compat)
    ├── validations.ts      ← Schemas zod
    ├── constants.tsx       ← Configuraciones compartidas
    └── utils.ts            ← cn(), formatCurrency()
backend/                    ← @hotel/backend — Fastify API (PostgreSQL)
├── src/
│   ├── app.ts              ← Instancia Fastify (exportada para Vercel)
│   ├── index.ts            ← Entry point (migrate + listen)
│   ├── config/env.ts       ← Variables de entorno
│   ├── db/
│   │   ├── index.ts        ← Conexión PostgreSQL (postgres-js)
│   │   ├── schema.ts       ← Schema Drizzle (7 tablas)
│   │   ├── migrate.ts      ← Runner de migraciones
│   │   └── seed.ts         ← Datos de ejemplo
│   ├── plugins/
│   │   ├── auth.ts         ← JWT plugin (authenticate + requireAdmin)
│   │   └── error-handler.ts
│   └── modules/
│       ├── auth/           ← Login, registro, /me
│       ├── rooms/          ← CRUD + status management
│       ├── guests/         ← Búsqueda + CRUD
│       ├── reservations/   ← Create, checkin, checkout, cancel
│       ├── pos/            ← Ventas, stock, cargo a habitación
│       ├── billing/        ← Facturas automáticas + pagos
│       └── reports/        ← Dashboard, financiero, ocupación
├── bruno/                  ← Colección Bruno (32 requests para testing)
├── drizzle/                ← Migraciones generadas
├── docker-compose.yml      ← PostgreSQL 16
├── .env                    ← Variables de entorno (NO commitear)
└── .env.example            ← Ejemplo de variables de entorno
```

## Convenciones del proyecto

### Generales
- Package manager: pnpm (NO npm)
- Tipos de dominio SIEMPRE en `packages/types/src/index.ts` (nunca duplicar)
- Git commits: mensajes descriptivos en español

### Frontend
- Componentes UI en `frontend/components/ui/` siguen el patrón shadcn/ui
- Vistas principales en `frontend/components/views/` — una por módulo
- `"use client"` solo en componentes interactivos
- Tema claro/oscuro con CSS variables en `globals.css`
- Datos mock en `lib/store.ts` (sin persistencia real)
- Testing: archivos `*.test.ts` junto al fuente

### Backend
- Módulos en `backend/src/modules/{nombre}/` con `routes.ts`, `service.ts`, `schemas.ts`
- Imports con extensión `.js` (moduleResolution nodenext)
- Transactions **async** (PostgreSQL driver es async)
- Queries: `(await db.select()...)[0]` en vez de `.get()` (pg no tiene .get())
- Updates sin `.run()` (pg retorna directamente)
- Schemas zod importados de `zod/v4` (para fastify-type-provider-zod)
- `validatorCompiler` y `serializerCompiler` registrados en `app.ts`
- Auth: JWT con roles `admin`/`recepcion`, decorator pattern
- Migraciones: `drizzle-kit generate`, auto-apply en server start
- Seed: idempotente (skip si users existen)

## Datos del dominio (tipos clave en @hotel/types)

- `Room` — Habitación con número, planta, tipo, capacidad, precio, estado
- `Guest` — Huésped con documento, país, email, teléfono
- `Reservation` — Reserva con fechas, estado, monto, anticipo
- `Product` — Producto de catering con categoría, precio, stock
- `Sale` — Venta con items, total, método de pago
- `Invoice` — Factura con desglose de habitación + catering

## Estados de habitación

- `libre` — Disponible
- `ocupada` — Con huésped activo
- `mantenimiento` — En mantenimiento
- `limpieza` — Pendiente de limpieza

## Estados de reserva

- `confirmada` — Reserva confirmada, sin check-in
- `checkin` — Huésped alojado
- `checkout` — Huésped ha salido
- `cancelada` — Reserva cancelada

## Cosas que NO deben modificarse sin razón clara

- `frontend/components/ui/` — Componentes shadcn. Solo modificar si es necesario para el diseño.
- `frontend/app/globals.css` variables de tema — Cambiar solo con cuidado para mantener consistencia visual.
- Tipos de dominio en `packages/types/` — Cambios aquí afectan frontend Y backend.
- Estructura de `frontend/components/views/` — Mantener una vista por archivo.
- `backend/src/db/schema.ts` — Cambios aquí requieren regenerar migración + re-seed.
- `backend/src/plugins/auth.ts` — Lógica JWT. Modificar con cuidado.
- `backend/bruno/` — Collection de testing. Mantener sincronizada con los endpoints.

## Reglas para añadir nuevas funcionalidades

1. **Nueva vista** → Crear archivo en `frontend/components/views/` y agregar enrutamiento
2. **Nuevo componente UI** → Usar shadcn/ui existente o crear en `frontend/components/ui/`
3. **Nuevo tipo de dominio** → Agregar en `packages/types/src/index.ts` (nunca en frontend)
4. **Nueva función helper** → Agregar en `frontend/lib/utils.ts`
5. **Validación de formularios** → Usar schemas de zod con react-hook-form
6. **Nuevo endpoint API** → Crear módulo en `backend/src/modules/` con routes+service+schemas
7. **Nueva tabla DB** → Agregar en schema.ts, generar migración, actualizar seed si aplica
8. **Nuevo endpoint Bruno** → Agregar archivo `.bru` en `backend/bruno/` correspondiente

## Reglas para testing

- **Frontend**: Vitest + React Testing Library, tests unitarios en `*.test.ts`
- **Backend**: Testing manual via Bruno collection (32 requests)
- Cobertura mínima: helpers de utilidad, lógica de negocio, componentes críticos

## Reglas para dependencias

- Usar pnpm como gestor de paquetes (NO npm)
- Dependencias shadcn se instalan con `pnpm dlx shadcn@latest add [component]`
- No instalar librerías de estado global sin evaluar necesidad real
- Backend: preferir librerías nativas de Node.js cuando sea posible

## Credenciales de desarrollo

- **Admin**: admin@hotel.com / Admin123! (rol: admin)
- **Recepcion**: recepcion@hotel.com / Admin123! (rol: recepcion)
- **PostgreSQL**: hotel / hotel123 / hotel_manager (localhost:5432)
- **JWT_SECRET**: dev-secret-change-me (solo desarrollo, NUNCA en producción)

## Problemas conocidos

- Frontend usa datos mock solo en páginas de diseño (`/designs`); las 8 vistas usan la API real
- Backend: auth JWT con refresh tokens (cookie de 7d), pero sin revocación server-side de refresh
- Rate limiting solo en `/api/auth/login`, `/api/auth/register` y `/api/auth/refresh`
- Logging: pino con redacción de credenciales, sin correlación entre microservicios
