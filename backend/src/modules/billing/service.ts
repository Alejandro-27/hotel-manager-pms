import { randomUUID } from 'node:crypto'
import { and, desc, eq, gte } from 'drizzle-orm'
import type { PgTransaction } from 'drizzle-orm/pg-core'
import type { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js'
import type { ExtractTablesWithRelations } from 'drizzle-orm'
import type { InvoiceStatus } from '@hotel/types'
import { db } from '../../db/index.js'
import * as schema from '../../db/schema.js'
import { invoices, rooms, sales } from '../../db/schema.js'
import { AppError } from '../../plugins/error-handler.js'
import type { PayInvoiceInput } from './schemas.js'

export type DbLike = PgTransaction<PostgresJsQueryResultHKT, typeof schema, ExtractTablesWithRelations<typeof schema>>

export interface InvoiceFilters {
  status?: InvoiceStatus
  guestId?: string
}

function daysBetween(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

interface StayReservation {
  id: string
  guestId: string
  roomId: string
  checkIn: string
  checkOut: string
  advancePayment: number
}

/**
 * Crea o actualiza la factura de una reserva en curso (o en check-out).
 * Reconstruye todo desde la fuente de verdad (habitacion + ventas cargo a habitacion),
 * preservando los pagos ya registrados en la factura.
 */
export async function syncInvoiceForReservation(tx: DbLike, reservation: StayReservation) {
  const room = (await tx.select().from(rooms).where(eq(rooms.id, reservation.roomId)).limit(1))[0]
  if (!room) return null

  const nights = daysBetween(reservation.checkIn, reservation.checkOut)
  const roomTotal = nights * room.pricePerNight

  const roomSales = await tx.select().from(sales).where(and(
    eq(sales.roomId, reservation.roomId),
    gte(sales.date, reservation.checkIn),
  ))
  const cateringCharges = roomSales.flatMap((s) => s.items)
  const cateringTotal = cateringCharges.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)

  const subtotal = Math.round((roomTotal + cateringTotal) * 100) / 100
  const roomNights = { nights, pricePerNight: room.pricePerNight }
  const today = new Date().toISOString().slice(0, 10)

  const existing = (await tx.select().from(invoices).where(eq(invoices.reservationId, reservation.id)).limit(1))[0]

  if (existing) {
    const totalDue = Math.round((subtotal - existing.advancePayment) * 100) / 100
    const status: InvoiceStatus = totalDue <= 0
      ? 'pagada'
      : existing.advancePayment > reservation.advancePayment
        ? 'parcial'
        : 'pendiente'

    await tx.update(invoices)
      .set({ roomNights, cateringCharges, subtotal, totalDue, status, date: today })
      .where(eq(invoices.id, existing.id))
    return (await tx.select().from(invoices).where(eq(invoices.id, existing.id)).limit(1))[0]
  }

  const advancePayment = reservation.advancePayment
  const totalDue = Math.round((subtotal - advancePayment) * 100) / 100
  const status: InvoiceStatus = totalDue <= 0 ? 'pagada' : 'pendiente'

  await tx.insert(invoices).values({
    id: randomUUID(),
    reservationId: reservation.id,
    guestId: reservation.guestId,
    roomNights,
    cateringCharges,
    tax: 10,
    subtotal,
    advancePayment,
    totalDue,
    status,
    date: today,
    createdAt: new Date().toISOString(),
  })
  return (await tx.select().from(invoices).where(eq(invoices.reservationId, reservation.id)).limit(1))[0]
}

export async function listInvoices(filters: InvoiceFilters = {}) {
  const conditions = []
  if (filters.status) conditions.push(eq(invoices.status, filters.status))
  if (filters.guestId) conditions.push(eq(invoices.guestId, filters.guestId))

  const query = db.select().from(invoices)
  const filtered = conditions.length > 0 ? query.where(and(...conditions)) : query
  return filtered.orderBy(desc(invoices.createdAt))
}

export async function getInvoiceById(id: string) {
  const invoice = (await db.select().from(invoices).where(eq(invoices.id, id)).limit(1))[0]
  if (!invoice) throw new AppError(404, 'Factura no encontrada')
  return invoice
}

export async function payInvoice(id: string, input: PayInvoiceInput) {
  const invoice = await getInvoiceById(id)
  if (invoice.status === 'pagada') {
    throw new AppError(409, 'La factura ya está pagada')
  }

  const newPaid = Math.round((invoice.advancePayment + input.amount) * 100) / 100
  const newTotalDue = Math.round((invoice.totalDue - input.amount) * 100) / 100
  const status = newTotalDue <= 0 ? 'pagada' : 'parcial'

  await db.update(invoices)
    .set({ advancePayment: newPaid, totalDue: Math.max(newTotalDue, 0), status })
    .where(eq(invoices.id, id))

  return getInvoiceById(id)
}
