# AGENTS.md — Frontend

## Stack

- **Framework**: Next.js 16.1.6 (App Router)
- **UI**: React 19.2.4, Tailwind CSS 4.2, shadcn/ui (~50 components)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts 2.15
- **Package**: @hotel/frontend (pnpm workspace)

## Comandos

```bash
pnpm dev          # Next.js dev server (localhost:3000)
pnpm build        # Build producción
pnpm lint         # ESLint
pnpm test         # Vitest + React Testing Library (33 tests)
```

## Estructura

```
├── app/
│   ├── page.tsx            ← Página principal: controla auth + routing por view activa
│   ├── layout.tsx          ← Root layout con ThemeProvider + Sidebar + Toaster de sonner
│   ├── globals.css         ← CSS variables light/dark + estilos base
│   └── designs/page.tsx    ← Página estática de mockups (solo imágenes)
├── components/
│   ├── app-sidebar.tsx     ← Sidebar de navegación (shadcn Sidebar)
│   ├── auth-screen.tsx     ← Login/registro (validado con zod, JWT real)
│   ├── ui/                 ← ~50 componentes shadcn/ui
│   └── views/              ← 8 vistas principales (una por módulo)
│       ├── dashboard-view.tsx
│       ├── calendar-view.tsx
│       ├── guests-view.tsx
│       ├── pos-view.tsx
│       ├── billing-view.tsx
│       ├── rooms-view.tsx
│       ├── settings-view.tsx
│       └── reports-view.tsx
└── lib/
    ├── api.ts              ← Cliente de la API real (fetch + endpoints + AuthUser)
    ├── auth-context.tsx    ← Sesión real (JWT + refresh + refreshUser)
    ├── types.ts            ← Re-export de @hotel/types (backward compat)
    ├── validations.ts      ← Schemas zod para formularios
    ├── constants.tsx       ← Configuraciones compartidas
    └── utils.ts            ← cn(), formatCurrency(), exportToCsv()
```

## Convenciones

### Componentes
- `"use client"` SOLO en componentes interactivos (modals, forms, etc.)
- Componentes UI genéricos en `components/ui/` (shadcn, NO tocar sin razón)
- Vistas en `components/views/` — UNA vista por archivo, una por módulo del sistema
- No crear componentes de más de 300 líneas — dividir en sub-componentes

### Datos
- **Todo se consume de la API real** (Fastify + PostgreSQL) via `lib/api.ts` — sin datos mock
- Auth real: JWT con cookies httpOnly + refresh (roles `admin`/`recepcion`)
- Re-exportar tipos de `@hotel/types` vía `lib/types.ts`

### Estilos
- Tailwind CSS 4.2 utility-first
- Tema claro/oscuro con CSS variables en `globals.css`
- shadcn/ui como base de componentes
- Colores: primary azul, success verde, warning naranja, destructive rojo
- Formateo: `formatCurrency()` para precios, `cn()` para class merging

### Forms
- React Hook Form para formularios
- Zod schemas en `lib/validations.ts`
- Validación en submit, errores inline
- Wizards multi-paso para reservas

### Testing
- Vitest + React Testing Library
- Tests en `*.test.ts` junto al archivo fuente
- 33 tests pasando (utils, api, auth-context, validaciones)

## Vistas del sistema

| Vista | Archivo | Descripción |
|-------|---------|-------------|
| Dashboard | `dashboard-view.tsx` | KPIs, check-in rápido, stock bajo |
| Calendario | `calendar-view.tsx` | Vista Gantt de reservas |
| Huéspedes | `guests-view.tsx` | Lista (búsqueda server-side) + wizard de reserva |
| TPV | `pos-view.tsx` | Punto de venta catering + inventario |
| Facturación | `billing-view.tsx` | Facturas y pagos |
| Habitaciones | `rooms-view.tsx` | Grid de habitaciones + gestión |
| Configuración | `settings-view.tsx` | Perfil, contraseña y tema (solo lo real) |
| Informes | `reports-view.tsx` | KPIs, financiero por periodo, gastos, export CSV |

## Cosas que NO deben modificarse sin razón clara

- `components/ui/` — Componentes shadcn. Solo modificar si es necesario para el diseño.
- `app/globals.css` variables de tema — Cambiar solo con cuidado para mantener consistencia visual.
- `lib/types.ts` — Solo re-exportar, NO definir tipos aquí.

## Reglas para añadir cosas nuevas

1. **Nueva vista** → Crear `components/views/nombre-view.tsx` + agregar caso en `page.tsx`
2. **Nuevo componente UI** → Usar `pnpm dlx shadcn@latest add [component]` o crear manualmente en `ui/`
3. **Nuevo tipo de dominio** → Agregar en `packages/types/src/index.ts` (NO aquí)
4. **Nueva función helper** → Agregar en `lib/utils.ts`
5. **Nuevo schema zod** → Agregar en `lib/validations.ts`
6. **Nuevo endpoint** → Agregar cliente en `lib/api.ts` + endpoint real en `backend/src/modules/`

## Dependencias clave

- `next` 16.1.6, `react` 19.2.4
- `tailwindcss` 4.2, `@tailwindcss/postcss`
- `recharts` 2.15
- `react-hook-form`, `@hookform/resolvers`
- `zod` 3.25.76
- `@hotel/types` (workspace)
- shadcn/ui: accordion, alert-dialog, badge, button, calendar, card, checkbox, command, dialog, drawer, dropdown-menu, form, input, label, popover, select, separator, sheet, sidebar, skeleton, sonner, table, tabs, textarea, tooltip, etc.
