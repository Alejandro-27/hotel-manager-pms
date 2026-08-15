export type RoomStatus = 'libre' | 'ocupada' | 'mantenimiento' | 'limpieza'

export interface Room {
  id: string
  number: string
  floor: number
  type: 'individual' | 'doble' | 'suite' | 'familiar'
  maxCapacity: number
  pricePerNight: number
  status: RoomStatus
}

export interface Guest {
  id: string
  name: string
  document: string
  country: string
  email: string
  phone: string
}

export type ReservationStatus = 'confirmada' | 'checkin' | 'checkout' | 'cancelada'

export interface Reservation {
  id: string
  guestId: string
  roomId: string
  checkIn: string
  checkOut: string
  guests: number
  status: ReservationStatus
  totalAmount: number
  advancePayment: number
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia'
  notes: string
}

export interface Product {
  id: string
  name: string
  category: 'desayunos' | 'snacks' | 'bebidas'
  price: number
  currentStock: number
  minStock: number
  image: string
}

export interface SaleItem {
  productId: string
  quantity: number
  unitPrice: number
}

export interface Sale {
  id: string
  items: SaleItem[]
  total: number
  paymentMethod: 'efectivo' | 'tarjeta' | 'cargo_habitacion'
  roomId?: string
  date: string
  time: string
}

export type InvoiceStatus = 'pagada' | 'parcial' | 'pendiente'

export interface Invoice {
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
}
