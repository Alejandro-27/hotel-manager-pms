# AGENTS.md — @hotel/types

## Propósito

Paquete compartido de tipos de dominio para el monorepo HotelManager. Usado por frontend y backend para mantener consistencia en las interfaces de datos.

## Ubicación

`packages/types/src/index.ts` — archivo único con todos los tipos.

## Uso

```ts
// En frontend
import type { Room, Guest, Reservation } from '@hotel/types'

// En backend
import type { Room, ReservationStatus } from '@hotel/types'

// Re-export en frontend/lib/types.ts (backward compat)
export type { Room, Guest, Reservation, ... } from '@hotel/types'
```

## Tipos de dominio

### Room
```ts
interface Room {
  id: string
  number: string              // e.g. "101", "201", "302"
  floor: number               // planta
  type: 'individual' | 'doble' | 'suite' | 'familiar'
  maxCapacity: number
  pricePerNight: number
  status: RoomStatus
  createdAt: string
  updatedAt: string
}
type RoomStatus = 'libre' | 'ocupada' | 'mantenimiento' | 'limpieza'
type RoomType = 'individual' | 'doble' | 'suite' | 'familiar'
```

### Guest
```ts
interface Guest {
  id: string
  name: string
  document: string            // DNI, pasaporte (unique)
  country: string             // código ISO
  email: string
  phone: string
  createdAt: string
}
```

### Reservation
```ts
interface Reservation {
  id: string
  guestId: string
  roomId: string
  checkIn: string             // ISO date (YYYY-MM-DD)
  checkOut: string
  guests: number
  status: ReservationStatus
  totalAmount: number
  advancePayment: number
  paymentMethod: PaymentMethod
  notes: string
  createdAt: string
  updatedAt: string
}
type ReservationStatus = 'confirmada' | 'checkin' | 'checkout' | 'cancelada'
type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia'
```

### Product
```ts
interface Product {
  id: string
  name: string
  category: ProductCategory
  price: number
  currentStock: number
  minStock: number
  image: string
  active: boolean           // false = desactivado (no se vende ni aparece en el grid del POS)
  createdAt: string
}
type ProductCategory = 'desayunos' | 'snacks' | 'bebidas'
```

### Sale
```ts
interface Sale {
  id: string
  items: SaleItem[]
  total: number
  paymentMethod: SalePaymentMethod
  roomId: string | null       // cargo a habitación
  date: string
  time: string
  createdAt: string
}
interface SaleItem {
  productId: string
  quantity: number
  unitPrice: number
}
type SalePaymentMethod = 'efectivo' | 'tarjeta' | 'cargo_habitacion'
```

### Invoice
```ts
interface Invoice {
  id: string
  reservationId: string
  guestId: string
  roomNights: { nights: number; pricePerNight: number }
  cateringCharges: SaleItem[]
  tax: number
  subtotal: number
  advancePayment: number
  totalDue: number
  status: InvoiceStatus
  date: string
  createdAt: string
}
type InvoiceStatus = 'pagada' | 'parcial' | 'pendiente'
```

## Estados de habitación (RoomStatus)

| Estado | Descripción |
|--------|-------------|
| `libre` | Disponible para nueva reserva |
| `ocupada` | Con huésped activo (check-in hecho) |
| `mantenimiento` | En mantenimiento, no disponible |
| `limpieza` | Pendiente de limpieza |

## Estados de reserva (ReservationStatus)

| Estado | Descripción | Transiciones |
|--------|-------------|--------------|
| `confirmada` | Reserva confirmada, sin check-in | → checkin, → cancelada |
| `checkin` | Huésped alojado en la habitación | → checkout, → cancelada |
| `checkout` | Huésped ha salido | (estado final) |
| `cancelada` | Reserva cancelada | (estado final) |

## Estados de factura (InvoiceStatus)

| Estado | Descripción |
|--------|-------------|
| `pendiente` | Factura generada, sin pagos |
| `parcial` | Pago parcial realizado |
| `pagada` | Factura completamente pagada |

## Categorías de producto (ProductCategory)

| Categoría | Ejemplos |
|-----------|----------|
| `desayunos` | Huevos, tostadas, cereal, fruta |
| `snacks` | Patatas, frutos secos, galletas |
| `bebidas` | Café, refrescos, vino, agua |

## Reglas para modificar tipos

1. **SIEMPRE** agregar nuevos tipos en este archivo (`packages/types/src/index.ts`)
2. **NUNCA** duplicar tipos en frontend o backend
3. Los cambios aquí afectan frontend Y backend — verificar ambos después de modificar
4. Mantener compatibilidad: no renombra tipos existentes sin actualizar todos los usos
5. Preferir unions de strings (`type X = 'a' | 'b'`) sobre enums
6. Usar `string` para fechas ISO (YYYY-MM-DD), no objetos Date
7. IDs son strings (UUIDs o IDs legibles como "r101")
