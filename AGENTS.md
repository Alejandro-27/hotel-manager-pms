# AGENTS.md — HotelManager PMS & POS

## Propósito

Sistema de gestión hotelera (PMS) y punto de venta (POS) para catering. Frontend completo construido con Next.js. Actualmente funciona con datos mock (sin backend).

## Stack

- **Framework**: Next.js 16.1.6 (App Router)
- **UI Library**: React 19.2.4
- **Language**: TypeScript 5.7.3 (`strict: true`)
- **Styling**: Tailwind CSS 4.2 + shadcn/ui (new-york style)
- **Charts**: Recharts 2.15
- **Forms**: React Hook Form + Zod (instalados, usar para validación)
- **Icons**: Lucide React
- **Package manager**: pnpm

## Estructura importante

```
app/
├── page.tsx              ← Página principal, controla auth + routing por useState
├── layout.tsx            ← Root layout
├── globals.css           ← Theme variables light/dark
├── designs/page.tsx      ← Página de mockups (solo imágenes)
components/
├── app-sidebar.tsx       ← Navegación lateral
├── auth-screen.tsx       ← Login/registro (ficticio)
├── ui/                   ← ~50 shadcn/ui components
└── views/                ← 8 vistas principales del sistema
    ├── dashboard-view.tsx  ← KPIs + gráficos
    ├── calendar-view.tsx   ← Calendario Gantt de reservas
    ├── guests-view.tsx     ← Huéspedes + wizard de reserva
    ├── pos-view.tsx        ← TPV catering + inventario
    ├── billing-view.tsx    ← Facturas y pagos
    ├── rooms-view.tsx      ← Gestión de habitaciones
    ├── settings-view.tsx   ← Configuración del sistema
    └── reports-view.tsx    ← Informes y KPIs avanzados
lib/
├── store.ts              ← Mock data, tipos, funciones helper
├── types.ts              ← Tipos de dominio
├── constants.ts          ← Configuraciones compartidas
└── utils.ts              ← cn(), formatCurrency()
```

## Comandos importantes

```bash
pnpm dev          # Iniciar servidor de desarrollo
pnpm build        # Build de producción
pnpm start        # Iniciar en producción
pnpm lint         # Ejecutar ESLint
```

## Convenciones del proyecto

- Componentes UI en `components/ui/` siguen el patrón shadcn/ui
- Vistas principales en `components/views/` — una por módulo del sistema
- `"use client"` solo en componentes interactivos
- Tema claro/oscuro con CSS variables en `globals.css`
- Navegación lateral con componentes shadcn Sidebar

## Datos del dominio (tipos clave)

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

- `components/ui/` — Componentes shadcn. Solo modificar si es necesario para el diseño.
- `globals.css` variables de tema — Cambiar solo con cuidado para mantener consistencia visual.
- Tipos de dominio en `lib/store.ts` — Cambios aquí afectan todas las vistas.
- Estructura de `components/views/` — Mantener una vista por archivo.

## Reglas para añadir nuevas funcionalidades

1. Nueva vista → Crear archivo en `components/views/` y agregar enrutamiento
2. Nuevo componente UI → Usar shadcn/ui existente o crear en `components/ui/` siguiendo patrones establecidos
3. Nuevo tipo de dominio → Agregar en `lib/types.ts`
4. Nueva función helper → Agregar en `lib/utils.ts`
5. Validación de formularios → Usar schemas de zod con react-hook-form

## Reglas para testing

- Framework: Vitest + React Testing Library
- Tests unitarios en archivos `*.test.ts` junto al archivo fuente
- Cobertura mínima: helpers de utilidad, lógica de negocio, componentes críticos

## Reglas para dependencias

- Usar pnpm como gestor de paquetes (NO npm)
- Dependencias shadcn se instalan con `pnpm dlx shadcn@latest add [component]`
- No instalar librerías de estado global sin evaluar necesidad real

## Problemas conocidos

- `ignoreBuildErrors: true` en next.config.mjs (CRITICAL — silencia errores TS)
- Auth completamente ficticia (solo setTimeout)
- Todos los datos son mock, sin persistencia
- `formatCurrency` duplicado en 3 archivos (ya centralizado en lib/utils.ts)
- Hooks duplicados en `hooks/` y `components/ui/` (ya eliminados los de hooks/)
- Sin tests, configuración pendiente
