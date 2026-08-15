// Hotel PMS & POS Data Store
// This file provides all mock data and state management for the application

// Re-export types from types.ts for backward compatibility
export type {
  Room,
  Guest,
  Reservation,
  Product,
  Sale,
  SaleItem,
  Invoice,
  RoomStatus,
  ReservationStatus,
  InvoiceStatus,
} from './types'

import type {
  Room,
  Guest,
  Reservation,
  Product,
  Sale,
  Invoice,
} from './types'

// --- Mock Data ---

export const rooms: Room[] = [
  { id: "r101", number: "101", floor: 1, type: "individual", maxCapacity: 1, pricePerNight: 75, status: "libre" },
  { id: "r102", number: "102", floor: 1, type: "doble", maxCapacity: 2, pricePerNight: 120, status: "ocupada" },
  { id: "r103", number: "103", floor: 1, type: "doble", maxCapacity: 2, pricePerNight: 120, status: "libre" },
  { id: "r104", number: "104", floor: 1, type: "familiar", maxCapacity: 4, pricePerNight: 200, status: "mantenimiento" },
  { id: "r201", number: "201", floor: 2, type: "individual", maxCapacity: 1, pricePerNight: 80, status: "libre" },
  { id: "r202", number: "202", floor: 2, type: "doble", maxCapacity: 2, pricePerNight: 130, status: "ocupada" },
  { id: "r203", number: "203", floor: 2, type: "suite", maxCapacity: 2, pricePerNight: 250, status: "limpieza" },
  { id: "r204", number: "204", floor: 2, type: "familiar", maxCapacity: 4, pricePerNight: 210, status: "libre" },
  { id: "r301", number: "301", floor: 3, type: "suite", maxCapacity: 2, pricePerNight: 280, status: "ocupada" },
  { id: "r302", number: "302", floor: 3, type: "doble", maxCapacity: 2, pricePerNight: 135, status: "libre" },
  { id: "r303", number: "303", floor: 3, type: "individual", maxCapacity: 1, pricePerNight: 85, status: "libre" },
  { id: "r304", number: "304", floor: 3, type: "familiar", maxCapacity: 4, pricePerNight: 220, status: "ocupada" },
  { id: "r401", number: "401", floor: 4, type: "suite", maxCapacity: 3, pricePerNight: 320, status: "libre" },
  { id: "r402", number: "402", floor: 4, type: "doble", maxCapacity: 2, pricePerNight: 140, status: "libre" },
  { id: "r403", number: "403", floor: 4, type: "individual", maxCapacity: 1, pricePerNight: 90, status: "ocupada" },
  { id: "r501", number: "501", floor: 5, type: "suite", maxCapacity: 3, pricePerNight: 350, status: "libre" },
  { id: "r502", number: "502", floor: 5, type: "familiar", maxCapacity: 5, pricePerNight: 280, status: "ocupada" },
  { id: "r503", number: "503", floor: 5, type: "doble", maxCapacity: 2, pricePerNight: 145, status: "libre" },
  { id: "r504", number: "504", floor: 5, type: "individual", maxCapacity: 1, pricePerNight: 95, status: "libre" },
  { id: "r505", number: "505", floor: 5, type: "suite", maxCapacity: 3, pricePerNight: 360, status: "libre" },
]

export const guests: Guest[] = [
  { id: "g1", name: "Carlos Mendoza", document: "12345678A", country: "ES", email: "carlos@email.com", phone: "+34612345678" },
  { id: "g2", name: "Maria Garcia", document: "87654321B", country: "ES", email: "maria@email.com", phone: "+34698765432" },
  { id: "g3", name: "John Smith", document: "US98765432", country: "US", email: "john@email.com", phone: "+15551234567" },
  { id: "g4", name: "Sophie Dubois", document: "FR12345678", country: "FR", email: "sophie@email.com", phone: "+33612345678" },
  { id: "g5", name: "Hans Mueller", document: "DE98765432", country: "DE", email: "hans@email.com", phone: "+49151234567" },
  { id: "g6", name: "Ana Torres", document: "45678901C", country: "ES", email: "ana@email.com", phone: "+34611223344" },
  { id: "g7", name: "Luca Rossi", document: "IT12345678", country: "IT", email: "luca@email.com", phone: "+39321234567" },
  { id: "g8", name: "Yuki Tanaka", document: "JP98765432", country: "JP", email: "yuki@email.com", phone: "+81901234567" },
]

export const reservations: Reservation[] = [
  { id: "res1", guestId: "g1", roomId: "r102", checkIn: "2026-02-18", checkOut: "2026-02-22", guests: 2, status: "checkin", totalAmount: 480, advancePayment: 144, paymentMethod: "tarjeta", notes: "" },
  { id: "res2", guestId: "g2", roomId: "r202", checkIn: "2026-02-17", checkOut: "2026-02-21", guests: 1, status: "checkin", totalAmount: 520, advancePayment: 156, paymentMethod: "efectivo", notes: "Peticion de cama extra" },
  { id: "res3", guestId: "g3", roomId: "r301", checkIn: "2026-02-19", checkOut: "2026-02-25", guests: 2, status: "checkin", totalAmount: 1680, advancePayment: 504, paymentMethod: "tarjeta", notes: "" },
  { id: "res4", guestId: "g4", roomId: "r304", checkIn: "2026-02-16", checkOut: "2026-02-20", guests: 3, status: "checkin", totalAmount: 880, advancePayment: 264, paymentMethod: "transferencia", notes: "Llegada tardia" },
  { id: "res5", guestId: "g5", roomId: "r403", checkIn: "2026-02-20", checkOut: "2026-02-23", guests: 1, status: "confirmada", totalAmount: 270, advancePayment: 81, paymentMethod: "tarjeta", notes: "" },
  { id: "res6", guestId: "g6", roomId: "r502", checkIn: "2026-02-15", checkOut: "2026-02-20", guests: 4, status: "checkin", totalAmount: 1400, advancePayment: 420, paymentMethod: "efectivo", notes: "" },
  { id: "res7", guestId: "g7", roomId: "r103", checkIn: "2026-02-22", checkOut: "2026-02-26", guests: 2, status: "confirmada", totalAmount: 480, advancePayment: 144, paymentMethod: "tarjeta", notes: "" },
  { id: "res8", guestId: "g8", roomId: "r501", checkIn: "2026-02-24", checkOut: "2026-02-28", guests: 2, status: "confirmada", totalAmount: 1400, advancePayment: 420, paymentMethod: "transferencia", notes: "Aniversario" },
]

export const products: Product[] = [
  { id: "p1", name: "Desayuno Continental", category: "desayunos", price: 12.50, currentStock: 30, minStock: 10, image: "" },
  { id: "p2", name: "Desayuno Buffet", category: "desayunos", price: 18.00, currentStock: 25, minStock: 10, image: "" },
  { id: "p3", name: "Tostadas con Jamon", category: "desayunos", price: 8.50, currentStock: 40, minStock: 15, image: "" },
  { id: "p4", name: "Huevos Revueltos", category: "desayunos", price: 9.00, currentStock: 35, minStock: 10, image: "" },
  { id: "p5", name: "Croissant", category: "snacks", price: 3.50, currentStock: 50, minStock: 20, image: "" },
  { id: "p6", name: "Sandwich Club", category: "snacks", price: 7.50, currentStock: 20, minStock: 10, image: "" },
  { id: "p7", name: "Patatas Fritas", category: "snacks", price: 4.00, currentStock: 8, minStock: 15, image: "" },
  { id: "p8", name: "Frutos Secos", category: "snacks", price: 5.00, currentStock: 15, minStock: 10, image: "" },
  { id: "p9", name: "Agua Mineral", category: "bebidas", price: 2.50, currentStock: 100, minStock: 30, image: "" },
  { id: "p10", name: "Refresco Cola", category: "bebidas", price: 3.00, currentStock: 60, minStock: 20, image: "" },
  { id: "p11", name: "Zumo de Naranja", category: "bebidas", price: 4.00, currentStock: 5, minStock: 15, image: "" },
  { id: "p12", name: "Cerveza", category: "bebidas", price: 4.50, currentStock: 45, minStock: 20, image: "" },
  { id: "p13", name: "Vino Tinto (Copa)", category: "bebidas", price: 6.00, currentStock: 30, minStock: 10, image: "" },
  { id: "p14", name: "Cafe Espresso", category: "bebidas", price: 2.00, currentStock: 3, minStock: 20, image: "" },
]

export const sales: Sale[] = [
  { id: "s1", items: [{ productId: "p1", quantity: 2, unitPrice: 12.50 }, { productId: "p9", quantity: 2, unitPrice: 2.50 }], total: 30.00, paymentMethod: "cargo_habitacion", roomId: "r102", date: "2026-02-20", time: "08:30" },
  { id: "s2", items: [{ productId: "p5", quantity: 3, unitPrice: 3.50 }, { productId: "p14", quantity: 3, unitPrice: 2.00 }], total: 16.50, paymentMethod: "efectivo", date: "2026-02-20", time: "09:15" },
  { id: "s3", items: [{ productId: "p6", quantity: 1, unitPrice: 7.50 }, { productId: "p10", quantity: 1, unitPrice: 3.00 }], total: 10.50, paymentMethod: "tarjeta", date: "2026-02-20", time: "13:00" },
  { id: "s4", items: [{ productId: "p12", quantity: 2, unitPrice: 4.50 }, { productId: "p7", quantity: 1, unitPrice: 4.00 }], total: 13.00, paymentMethod: "cargo_habitacion", roomId: "r301", date: "2026-02-20", time: "19:45" },
]

export const invoices: Invoice[] = [
  {
    id: "inv1", reservationId: "res1", guestId: "g1",
    roomNights: { nights: 4, pricePerNight: 120 },
    cateringCharges: [{ productId: "p1", quantity: 2, unitPrice: 12.50 }, { productId: "p9", quantity: 2, unitPrice: 2.50 }],
    tax: 10, subtotal: 510, advancePayment: 144, totalDue: 366, status: "parcial", date: "2026-02-22"
  },
  {
    id: "inv2", reservationId: "res4", guestId: "g4",
    roomNights: { nights: 4, pricePerNight: 220 },
    cateringCharges: [],
    tax: 10, subtotal: 880, advancePayment: 264, totalDue: 616, status: "pendiente", date: "2026-02-20"
  },
  {
    id: "inv3", reservationId: "res6", guestId: "g6",
    roomNights: { nights: 5, pricePerNight: 280 },
    cateringCharges: [{ productId: "p2", quantity: 4, unitPrice: 18.00 }],
    tax: 10, subtotal: 1472, advancePayment: 420, totalDue: 1052, status: "pagada", date: "2026-02-20"
  },
]

// Revenue data for charts
export const monthlyRevenueData = [
  { month: "Sep", ingresos: 42000, gastos: 28000 },
  { month: "Oct", ingresos: 48000, gastos: 30000 },
  { month: "Nov", ingresos: 38000, gastos: 27000 },
  { month: "Dic", ingresos: 55000, gastos: 32000 },
  { month: "Ene", ingresos: 35000, gastos: 25000 },
  { month: "Feb", ingresos: 52000, gastos: 31000 },
]

// Helper functions
export function getGuestById(id: string): Guest | undefined {
  return guests.find(g => g.id === id)
}

export function getRoomById(id: string): Room | undefined {
  return rooms.find(r => r.id === id)
}

export function getProductById(id: string): Product | undefined {
  return products.find(p => p.id === id)
}

export function getOccupancyRate(): number {
  const occupied = rooms.filter(r => r.status === "ocupada").length
  return Math.round((occupied / rooms.length) * 100)
}

export function getDailyRevenue(): number {
  const lodging = reservations
    .filter(r => r.status === "checkin")
    .reduce((sum, r) => {
      const room = getRoomById(r.roomId)
      return sum + (room?.pricePerNight ?? 0)
    }, 0)
  const catering = sales
    .filter(s => s.date === "2026-02-20")
    .reduce((sum, s) => sum + s.total, 0)
  return lodging + catering
}

export function getPendingCheckins(): Reservation[] {
  return reservations.filter(r => r.status === "confirmada")
}

export function getLowStockProducts(): Product[] {
  return products.filter(p => p.currentStock < p.minStock)
}
