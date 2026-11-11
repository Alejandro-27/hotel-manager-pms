import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { db, client } from './index.js'
import {
  users, rooms, guests, reservations, products, sales, invoices, expenses, settings, tenants,
  type NewRoom, type NewGuest, type NewReservation, type NewProduct, type NewSale,
  type NewInvoice, type NewExpense,
} from './schema.js'
import { eq, sql } from 'drizzle-orm'

const now = new Date().toISOString()
const today = new Date().toISOString().slice(0, 10)

function iso(offsetDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

function monthDay(offsetMonths: number, day: number): string {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - offsetMonths)
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(day, lastDay))
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const roomData: NewRoom[] = [
  { id: "r101", tenantId: "tenant_default", number: "101", floor: 1, type: "individual", maxCapacity: 1, pricePerNight: 75, status: "libre", createdAt: now, updatedAt: now },
  { id: "r102", tenantId: "tenant_default", number: "102", floor: 1, type: "doble", maxCapacity: 2, pricePerNight: 120, status: "ocupada", createdAt: now, updatedAt: now },
  { id: "r103", tenantId: "tenant_default", number: "103", floor: 1, type: "doble", maxCapacity: 2, pricePerNight: 120, status: "libre", createdAt: now, updatedAt: now },
  { id: "r104", tenantId: "tenant_default", number: "104", floor: 1, type: "familiar", maxCapacity: 4, pricePerNight: 200, status: "mantenimiento", createdAt: now, updatedAt: now },
  { id: "r201", tenantId: "tenant_default", number: "201", floor: 2, type: "individual", maxCapacity: 1, pricePerNight: 80, status: "libre", createdAt: now, updatedAt: now },
  { id: "r202", tenantId: "tenant_default", number: "202", floor: 2, type: "doble", maxCapacity: 2, pricePerNight: 130, status: "ocupada", createdAt: now, updatedAt: now },
  { id: "r203", tenantId: "tenant_default", number: "203", floor: 2, type: "suite", maxCapacity: 2, pricePerNight: 250, status: "limpieza", createdAt: now, updatedAt: now },
  { id: "r204", tenantId: "tenant_default", number: "204", floor: 2, type: "familiar", maxCapacity: 4, pricePerNight: 210, status: "libre", createdAt: now, updatedAt: now },
  { id: "r301", tenantId: "tenant_default", number: "301", floor: 3, type: "suite", maxCapacity: 2, pricePerNight: 280, status: "ocupada", createdAt: now, updatedAt: now },
  { id: "r302", tenantId: "tenant_default", number: "302", floor: 3, type: "doble", maxCapacity: 2, pricePerNight: 135, status: "libre", createdAt: now, updatedAt: now },
  { id: "r303", tenantId: "tenant_default", number: "303", floor: 3, type: "individual", maxCapacity: 1, pricePerNight: 85, status: "libre", createdAt: now, updatedAt: now },
  { id: "r304", tenantId: "tenant_default", number: "304", floor: 3, type: "familiar", maxCapacity: 4, pricePerNight: 220, status: "ocupada", createdAt: now, updatedAt: now },
  { id: "r401", tenantId: "tenant_default", number: "401", floor: 4, type: "suite", maxCapacity: 3, pricePerNight: 320, status: "libre", createdAt: now, updatedAt: now },
  { id: "r402", tenantId: "tenant_default", number: "402", floor: 4, type: "doble", maxCapacity: 2, pricePerNight: 140, status: "libre", createdAt: now, updatedAt: now },
  { id: "r403", tenantId: "tenant_default", number: "403", floor: 4, type: "individual", maxCapacity: 1, pricePerNight: 90, status: "ocupada", createdAt: now, updatedAt: now },
  { id: "r501", tenantId: "tenant_default", number: "501", floor: 5, type: "suite", maxCapacity: 3, pricePerNight: 350, status: "libre", createdAt: now, updatedAt: now },
  { id: "r502", tenantId: "tenant_default", number: "502", floor: 5, type: "familiar", maxCapacity: 5, pricePerNight: 280, status: "ocupada", createdAt: now, updatedAt: now },
  { id: "r503", tenantId: "tenant_default", number: "503", floor: 5, type: "doble", maxCapacity: 2, pricePerNight: 145, status: "libre", createdAt: now, updatedAt: now },
  { id: "r504", tenantId: "tenant_default", number: "504", floor: 5, type: "individual", maxCapacity: 1, pricePerNight: 95, status: "libre", createdAt: now, updatedAt: now },
  { id: "r505", tenantId: "tenant_default", number: "505", floor: 5, type: "suite", maxCapacity: 3, pricePerNight: 360, status: "libre", createdAt: now, updatedAt: now },
]

const guestData: NewGuest[] = [
  { id: "g1", tenantId: "tenant_default", name: "Carlos Mendoza", document: "12345678A", country: "ES", email: "carlos@email.com", phone: "+34612345678", createdAt: now },
  { id: "g2", tenantId: "tenant_default", name: "Maria Garcia", document: "87654321B", country: "ES", email: "maria@email.com", phone: "+34698765432", createdAt: now },
  { id: "g3", tenantId: "tenant_default", name: "John Smith", document: "US98765432", country: "US", email: "john@email.com", phone: "+15551234567", createdAt: now },
  { id: "g4", tenantId: "tenant_default", name: "Sophie Dubois", document: "FR12345678", country: "FR", email: "sophie@email.com", phone: "+33612345678", createdAt: now },
  { id: "g5", tenantId: "tenant_default", name: "Hans Mueller", document: "DE98765432", country: "DE", email: "hans@email.com", phone: "+49151234567", createdAt: now },
  { id: "g6", tenantId: "tenant_default", name: "Ana Torres", document: "45678901C", country: "ES", email: "ana@email.com", phone: "+34611223344", createdAt: now },
  { id: "g7", tenantId: "tenant_default", name: "Luca Rossi", document: "IT12345678", country: "IT", email: "luca@email.com", phone: "+39321234567", createdAt: now },
  { id: "g8", tenantId: "tenant_default", name: "Yuki Tanaka", document: "JP98765432", country: "JP", email: "yuki@email.com", phone: "+81901234567", createdAt: now },
]

const reservationData: NewReservation[] = [
  { id: "res1", tenantId: "tenant_default", guestId: "g1", roomId: "r102", checkIn: iso(-3), checkOut: iso(2), guests: 2, status: "checkin", totalAmount: 480, advancePayment: 144, paymentMethod: "tarjeta", notes: "", createdAt: now, updatedAt: now },
  { id: "res2", tenantId: "tenant_default", guestId: "g2", roomId: "r202", checkIn: iso(-2), checkOut: iso(2), guests: 1, status: "checkin", totalAmount: 520, advancePayment: 156, paymentMethod: "efectivo", notes: "Peticion de cama extra", createdAt: now, updatedAt: now },
  { id: "res3", tenantId: "tenant_default", guestId: "g3", roomId: "r301", checkIn: iso(-1), checkOut: iso(5), guests: 2, status: "checkin", totalAmount: 1680, advancePayment: 504, paymentMethod: "tarjeta", notes: "", createdAt: now, updatedAt: now },
  { id: "res4", tenantId: "tenant_default", guestId: "g4", roomId: "r304", checkIn: iso(-4), checkOut: iso(1), guests: 3, status: "checkin", totalAmount: 880, advancePayment: 264, paymentMethod: "transferencia", notes: "Llegada tardia", createdAt: now, updatedAt: now },
  { id: "res5", tenantId: "tenant_default", guestId: "g5", roomId: "r403", checkIn: iso(1), checkOut: iso(4), guests: 1, status: "confirmada", totalAmount: 270, advancePayment: 81, paymentMethod: "tarjeta", notes: "", createdAt: now, updatedAt: now },
  { id: "res6", tenantId: "tenant_default", guestId: "g6", roomId: "r502", checkIn: iso(-5), checkOut: iso(0), guests: 4, status: "checkin", totalAmount: 1400, advancePayment: 420, paymentMethod: "efectivo", notes: "", createdAt: now, updatedAt: now },
  { id: "res7", tenantId: "tenant_default", guestId: "g7", roomId: "r103", checkIn: iso(2), checkOut: iso(6), guests: 2, status: "confirmada", totalAmount: 480, advancePayment: 144, paymentMethod: "tarjeta", notes: "", createdAt: now, updatedAt: now },
  { id: "res8", tenantId: "tenant_default", guestId: "g8", roomId: "r501", checkIn: iso(4), checkOut: iso(8), guests: 2, status: "confirmada", totalAmount: 1400, advancePayment: 420, paymentMethod: "transferencia", notes: "Aniversario", createdAt: now, updatedAt: now },
]

const productData: NewProduct[] = [
  { id: "p1", tenantId: "tenant_default", name: "Desayuno Continental", category: "desayunos", price: 12.50, currentStock: 30, minStock: 10, image: "", createdAt: now },
  { id: "p2", tenantId: "tenant_default", name: "Desayuno Buffet", category: "desayunos", price: 18.00, currentStock: 25, minStock: 10, image: "", createdAt: now },
  { id: "p3", tenantId: "tenant_default", name: "Tostadas con Jamon", category: "desayunos", price: 8.50, currentStock: 40, minStock: 15, image: "", createdAt: now },
  { id: "p4", tenantId: "tenant_default", name: "Huevos Revueltos", category: "desayunos", price: 9.00, currentStock: 35, minStock: 10, image: "", createdAt: now },
  { id: "p5", tenantId: "tenant_default", name: "Croissant", category: "snacks", price: 3.50, currentStock: 50, minStock: 20, image: "", createdAt: now },
  { id: "p6", tenantId: "tenant_default", name: "Sandwich Club", category: "snacks", price: 7.50, currentStock: 20, minStock: 10, image: "", createdAt: now },
  { id: "p7", tenantId: "tenant_default", name: "Patatas Fritas", category: "snacks", price: 4.00, currentStock: 8, minStock: 15, image: "", createdAt: now },
  { id: "p8", tenantId: "tenant_default", name: "Frutos Secos", category: "snacks", price: 5.00, currentStock: 15, minStock: 10, image: "", createdAt: now },
  { id: "p9", tenantId: "tenant_default", name: "Agua Mineral", category: "bebidas", price: 2.50, currentStock: 100, minStock: 30, image: "", createdAt: now },
  { id: "p10", tenantId: "tenant_default", name: "Refresco Cola", category: "bebidas", price: 3.00, currentStock: 60, minStock: 20, image: "", createdAt: now },
  { id: "p11", tenantId: "tenant_default", name: "Zumo de Naranja", category: "bebidas", price: 4.00, currentStock: 5, minStock: 15, image: "", createdAt: now },
  { id: "p12", tenantId: "tenant_default", name: "Cerveza", category: "bebidas", price: 4.50, currentStock: 45, minStock: 20, image: "", createdAt: now },
  { id: "p13", tenantId: "tenant_default", name: "Vino Tinto (Copa)", category: "bebidas", price: 6.00, currentStock: 30, minStock: 10, image: "", createdAt: now },
  { id: "p14", tenantId: "tenant_default", name: "Cafe Espresso", category: "bebidas", price: 2.00, currentStock: 3, minStock: 20, image: "", createdAt: now },
]

const saleData: NewSale[] = [
  { id: "s1", tenantId: "tenant_default", items: [{ productId: "p1", quantity: 2, unitPrice: 12.50 }, { productId: "p9", quantity: 2, unitPrice: 2.50 }], total: 30.00, paymentMethod: "cargo_habitacion", roomId: "r102", date: today, time: "08:30", createdAt: now },
  { id: "s2", tenantId: "tenant_default", items: [{ productId: "p5", quantity: 3, unitPrice: 3.50 }, { productId: "p14", quantity: 3, unitPrice: 2.00 }], total: 16.50, paymentMethod: "efectivo", roomId: null, date: today, time: "09:15", createdAt: now },
  { id: "s3", tenantId: "tenant_default", items: [{ productId: "p6", quantity: 1, unitPrice: 7.50 }, { productId: "p10", quantity: 1, unitPrice: 3.00 }], total: 10.50, paymentMethod: "tarjeta", roomId: null, date: today, time: "13:00", createdAt: now },
  { id: "s4", tenantId: "tenant_default", items: [{ productId: "p12", quantity: 2, unitPrice: 4.50 }, { productId: "p7", quantity: 1, unitPrice: 4.00 }], total: 13.00, paymentMethod: "cargo_habitacion", roomId: "r301", date: today, time: "19:45", createdAt: now },
]

const invoiceData: NewInvoice[] = [
  {
    id: "inv1", tenantId: "tenant_default", reservationId: "res1", guestId: "g1",
    roomNights: { nights: 4, pricePerNight: 120 },
    cateringCharges: [{ productId: "p1", quantity: 2, unitPrice: 12.50 }, { productId: "p9", quantity: 2, unitPrice: 2.50 }],
    tax: 10, subtotal: 510, advancePayment: 144, totalDue: 366, status: "parcial", date: iso(2), createdAt: now,
  },
  {
    id: "inv2", tenantId: "tenant_default", reservationId: "res4", guestId: "g4",
    roomNights: { nights: 4, pricePerNight: 220 },
    cateringCharges: [],
    tax: 10, subtotal: 880, advancePayment: 264, totalDue: 616, status: "pendiente", date: iso(1), createdAt: now,
  },
  {
    id: "inv3", tenantId: "tenant_default", reservationId: "res6", guestId: "g6",
    roomNights: { nights: 5, pricePerNight: 280 },
    cateringCharges: [{ productId: "p2", quantity: 4, unitPrice: 18.00 }],
    tax: 10, subtotal: 1472, advancePayment: 420, totalDue: 1052, status: "pagada", date: today, createdAt: now,
  },
]

const expenseData: NewExpense[] = [
  { id: "e1", tenantId: "tenant_default", category: "servicios", amount: 950, date: monthDay(5, 5), note: "Electricidad y agua", createdAt: now },
  { id: "e2", tenantId: "tenant_default", category: "mantenimiento", amount: 320, date: monthDay(5, 12), note: "Reparacion climatizacion 203", createdAt: now },
  { id: "e3", tenantId: "tenant_default", category: "limpieza", amount: 450, date: monthDay(4, 3), note: "Productos de limpieza", createdAt: now },
  { id: "e4", tenantId: "tenant_default", category: "servicios", amount: 900, date: monthDay(4, 18), note: "Internet y telefonía", createdAt: now },
  { id: "e5", tenantId: "tenant_default", category: "nominas", amount: 4200, date: monthDay(3, 1), note: "Nomina equipo recepcion", createdAt: now },
  { id: "e6", tenantId: "tenant_default", category: "mantenimiento", amount: 210, date: monthDay(3, 15), note: "Fontaneria bano 501", createdAt: now },
  { id: "e7", tenantId: "tenant_default", category: "limpieza", amount: 380, date: monthDay(2, 7), note: "Lavanderia ropa de cama", createdAt: now },
  { id: "e8", tenantId: "tenant_default", category: "servicios", amount: 610, date: monthDay(2, 22), note: "Gas y calefaccion", createdAt: now },
  { id: "e9", tenantId: "tenant_default", category: "otros", amount: 150, date: monthDay(1, 10), note: "Suministros de oficina", createdAt: now },
  { id: "e10", tenantId: "tenant_default", category: "mantenimiento", amount: 490, date: monthDay(1, 24), note: "Pintura exterior", createdAt: now },
  { id: "e11", tenantId: "tenant_default", category: "servicios", amount: 870, date: monthDay(0, 6), note: "Electricidad y agua", createdAt: now },
  { id: "e12", tenantId: "tenant_default", category: "nominas", amount: 4100, date: monthDay(0, 1), note: "Nomina mensual", createdAt: now },
]

async function seed() {
  const count = await db.select({ count: sql<number>`count(*)` }).from(users)
  const userCount = Number(count[0]?.count ?? 0)
  if (userCount > 0) {
    console.log('Seed skipped: database already has data')
    return
  }

  // Crear tenant por defecto
  await db.insert(tenants).values({
    id: 'tenant_default',
    name: 'Hotel Paraiso',
    slug: 'hotel-paraiso',
    createdAt: now,
    updatedAt: now,
  })

  const passwordHash = await bcrypt.hash('Admin123!', 10)
  await db.insert(users).values([
    { id: randomUUID(), name: 'Admin Hotel', email: 'admin@hotel.com', passwordHash, role: 'admin', status: 'activo', tenantId: 'tenant_default', invitedBy: null, termsAcceptedAt: now, createdAt: now, updatedAt: now },
    { id: randomUUID(), name: 'Recepcion', email: 'recepcion@hotel.com', passwordHash, role: 'recepcion', status: 'activo', tenantId: 'tenant_default', invitedBy: null, termsAcceptedAt: now, createdAt: now, updatedAt: now },
  ])

  await db.insert(rooms).values(roomData)
  await db.insert(guests).values(guestData)
  await db.insert(reservations).values(reservationData)
  await db.insert(products).values(productData)
  await db.insert(sales).values(saleData)
  await db.insert(invoices).values(invoiceData)
  await db.insert(expenses).values(expenseData)
  await db.insert(settings).values({
    tenantId: 'tenant_default',
    legalName: '',
    taxId: '',
    address: '',
    phone: '',
    email: '',
    jurisdiction: '',
    updatedAt: now,
  })

  console.log('Seed complete:')
  console.log(`  - 1 tenant (Hotel Paraiso)`)
  console.log(`  - ${roomData.length} rooms`)
  console.log(`  - ${guestData.length} guests`)
  console.log(`  - ${reservationData.length} reservations`)
  console.log(`  - ${productData.length} products`)
  console.log(`  - ${saleData.length} sales`)
  console.log(`  - ${invoiceData.length} invoices`)
  console.log(`  - ${expenseData.length} expenses`)
  console.log('  - 2 users (admin@hotel.com / Admin123!)')
}

if (process.env.NODE_ENV === 'production') {
  console.error('El seed está deshabilitado en producción')
  process.exit(1)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
}).finally(async () => {
  await client.end()
})
