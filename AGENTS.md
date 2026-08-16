# AGENTS.md — HotelManager PMS & POS

## Propósito

Sistema de gestión hotelera (PMS) y punto de venta (POS) para catering. Monorepo con frontend Next.js (datos mock de momento) y backend Fastify en desarrollo.

## Stack

- **Monorepo**: pnpm workspaces (`frontend/`, `backend/`, `packages/*`)
- **Frontend**: Next.js 16.1.6 (App Router), React 19.2.4, Tailwind CSS 4.2 + shadcn/ui, Recharts 2.15, React Hook Form + Zod
- **Backend**: Fastify 5 + TypeScript (`tsx` para dev, `tsc` para build)
- **Tipos compartidos**: `@hotel/types` en `packages/types/`
- **Package manager**: pnpm (NO npm)
- **Testing**: Vitest + React Testing Library (frontend)

## Estructura del monorepo

```
packages/
└── types/                  ← @hotel/types — tipos de dominio compartidos
frontend/                   ← @hotel/frontend — Next.js (datos mock)
├── app/
│   ├── page.tsx            ← Página principal, controla auth + routing por useState
│   ├── layout.tsx          ← Root layout
│   ├── globals.css         ← Theme variables light/dark
│   └── designs/page.tsx    ← Página de mockups (solo imágenes)
├── components/
│   ├── app-sidebar.tsx     ← Navegación lateral
│   ├── auth-screen.tsx     ← Login/registro (ficticio, validado con zod)
│   ├── ui/                 ← ~50 shadcn/ui components
│   └── views/              ← 8 vistas principales del sistema
│       ├── dashboard-view.tsx  ← KPIs + gráficos
│       ├── calendar-view.tsx   ← Calendario Gantt de reservas
│       ├── guests-view.tsx     ← Huéspedes + wizard de reserva
│       ├── pos-view.tsx        ← TPV catering + inventario
│       ├── billing-view.tsx    ← Facturas y pagos
│       ├── rooms-view.tsx      ← Gestión de habitaciones
│       ├── settings-view.tsx   ← Configuración del sistema
│       └── reports-view.tsx    ← Informes y KPIs avanzados
└── lib/
    ├── store.ts           ← Mock data + funciones helper (re-exporta tipos)
    ├── types.ts           ← Re-export de @hotel/types (backward compat)
    ├── validations.ts     ← Schemas zod
    ├── constants.tsx      ← Configuraciones compartidas
    └── utils.ts           ← cn(), formatCurrency()
backend/                    ← @hotel/backend — Fastify API
└── src/
    ├── app.ts            ← Instancia Fastify (exportada para Vercel)
    └── index.ts          ← Entry point (listen)
```

## Comandos importantes

```bash
pnpm dev          # Frontend (Next.js dev server)
pnpm dev:api      # Backend (tsx watch)
pnpm build        # Build frontend
pnpm build:api    # Build backend (tsc → dist/)
pnpm lint         # ESLint frontend
pnpm test         # Vitest frontend
```

## Convenciones del proyecto

- Componentes UI en `frontend/components/ui/` siguen el patrón shadcn/ui
- Vistas principales en `frontend/components/views/` — una por módulo del sistema
- `"use client"` solo en componentes interactivos
- Tema claro/oscuro con CSS variables en `globals.css`
- Backend: módulos en `backend/src/`, imports relativos con extensión `.js` (moduleResolution nodenext)
- Tipos de dominio SIEMPRE en `packages/types/src/index.ts` (nunca duplicar en frontend/backend)

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

## Reglas para añadir nuevas funcionalidades

1. Nueva vista → Crear archivo en `frontend/components/views/` y agregar enrutamiento
2. Nuevo componente UI → Usar shadcn/ui existente o crear en `frontend/components/ui/` siguiendo patrones establecidos
3. Nuevo tipo de dominio → Agregar en `packages/types/src/index.ts` (nunca en frontend)
4. Nueva función helper → Agregar en `frontend/lib/utils.ts`
5. Validación de formularios → Usar schemas de zod con react-hook-form
6. Nuevo endpoint API → Crear módulo en `backend/src/`

## Reglas para testing

- Framework: Vitest + React Testing Library
- Tests unitarios en archivos `*.test.ts` junto al archivo fuente
- Cobertura mínima: helpers de utilidad, lógica de negocio, componentes críticos

## Reglas para dependencias

- Usar pnpm como gestor de paquetes (NO npm)
- Dependencias shadcn se instalan con `pnpm dlx shadcn@latest add [component]`
- No instalar librerías de estado global sin evaluar necesidad real

## Problemas conocidos

- Auth completamente ficticia (solo setTimeout)
- Todos los datos son mock, sin persistencia
- Backend solo tiene endpoint `/health`, sin módulos ni DB aún
