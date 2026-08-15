# HotelManager PMS & POS

Sistema de gestión hotelera (PMS) y punto de venta (POS) para catering. Frontend completo construido con Next.js.

## Stack

- Next.js 16.1.6 (App Router)
- React 19.2.4
- TypeScript 5.7.3
- Tailwind CSS 4.2
- shadcn/ui (new-york style)
- Recharts 2.15
- pnpm

## Inicio rápido

```bash
pnpm install
pnpm dev
```

## Comandos

| Comando | Descripción |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm start` | Iniciar en producción |
| `pnpm lint` | Ejecutar ESLint |

## Estructura

```
app/              → Páginas y layouts (App Router)
components/
  ui/             → Componentes shadcn/ui
  views/          → Vistas principales del sistema
lib/
  store.ts        → Datos mock y funciones helper
  types.ts        → Tipos de dominio
  constants.ts    → Configuraciones compartidas
  utils.ts        → Utilidades (cn, formatCurrency)
```

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

Este es un frontend con datos mock. No hay backend ni persistencia de datos. La autenticación es ficticia.
