import { and, desc, eq, gte, like, sql } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { expenses, invoices, products, reservations, rooms, sales } from '../../db/schema.js'

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function monthStart(offset: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export async function getDashboard() {
  const allRooms = await db.select().from(rooms)
  const occupied = allRooms.filter(r => r.status === 'ocupada').length
  const occupancyRate = allRooms.length > 0 ? Math.round((occupied / allRooms.length) * 100) : 0

  const today = todayStr()
  const activeReservations = await db.select().from(reservations).where(eq(reservations.status, 'checkin'))
  const lodging = activeReservations.reduce((sum, r) => {
    const room = allRooms.find(x => x.id === r.roomId)
    return sum + (room?.pricePerNight ?? 0)
  }, 0)

  const todaySales = await db.select().from(sales).where(eq(sales.date, today))
  const catering = todaySales.reduce((sum, s) => sum + s.total, 0)

  const pendingCheckins = await db.select()
    .from(reservations)
    .where(eq(reservations.status, 'confirmada'))
    .orderBy(desc(reservations.checkIn))

  const lowStockProducts = (await db.select().from(products))
    .filter(p => p.currentStock < p.minStock)

  return {
    occupancyRate,
    dailyRevenue: Math.round((lodging + catering) * 100) / 100,
    pendingCheckins,
    lowStockProducts,
  }
}

export async function getFinancialReport(months = 6) {
  const monthly = []

  for (let offset = months - 1; offset >= 0; offset--) {
    const start = monthStart(offset)
    const end = monthStart(offset - 1)

    const monthSales = await db.select().from(sales).where(and(gte(sales.date, start), sql`${sales.date} < ${end}`))
    const monthReservations = await db.select().from(reservations).where(and(
      gte(reservations.checkIn, start),
      sql`${reservations.checkIn} < ${end}`,
      eq(reservations.status, 'checkout'),
    ))
    const monthExpenses = await db.select().from(expenses).where(and(
      gte(expenses.date, start),
      sql`${expenses.date} < ${end}`,
    ))

    const monthIndex = Number(start.slice(5, 7)) - 1
    monthly.push({
      month: monthNames[monthIndex],
      ingresos: Math.round((monthSales.reduce((s, x) => s + x.total, 0) + monthReservations.reduce((s, x) => s + x.totalAmount, 0)) * 100) / 100,
      gastos: Math.round(monthExpenses.reduce((s, x) => s + x.amount, 0) * 100) / 100,
    })
  }

  const totalInvoices = await db.select().from(invoices)
  const totalRevenue = totalInvoices.reduce((s, i) => s + i.subtotal, 0)
  const totalPaid = totalInvoices.reduce((s, i) => s + i.advancePayment, 0)

  return { monthlyRevenue: monthly, totalRevenue, totalPaid }
}

export async function getOccupancyReport() {
  const allRooms = await db.select().from(rooms)
  const total = allRooms.length
  const occupied = allRooms.filter(r => r.status === 'ocupada').length

  const byType = ['individual', 'doble', 'suite', 'familiar'].map(type => {
    const roomsOfType = allRooms.filter(r => r.type === type)
    return {
      type,
      total: roomsOfType.length,
      occupied: roomsOfType.filter(r => r.status === 'ocupada').length,
    }
  })

  const byStatus = ['libre', 'ocupada', 'mantenimiento', 'limpieza'].map(status => ({
    status,
    count: allRooms.filter(r => r.status === status).length,
  }))

  return {
    rate: total > 0 ? Math.round((occupied / total) * 100) : 0,
    totalRooms: total,
    occupiedRooms: occupied,
    byType,
    byStatus,
  }
}
