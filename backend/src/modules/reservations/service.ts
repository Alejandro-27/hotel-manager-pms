import { randomUUID } from 'node:crypto'
import { and, desc, eq, gte, gt, inArray, lt } from 'drizzle-orm'
import type { PgTransaction } from 'drizzle-orm/pg-core'
import type { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js'
import type { ExtractTablesWithRelations } from 'drizzle-orm'
import type { ReservationStatus } from '@hotel/types'
import { db } from '../../db/index.js'
import * as schema from '../../db/schema.js'
import { guests, invoices, reservations, rooms, sales } from '../../db/schema.js'
import { AppError } from '../../plugins/error-handler.js'
import type { CreateReservationInput } from './schemas.js'

export interface ReservationFilters {
  status?: ReservationStatus
  roomId?: string
  guestId?: string
}

function daysBetween(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

export function computeTotalAmount(pricePerNight: number, checkIn: string, checkOut: string): number {
  return pricePerNight * daysBetween(checkIn, checkOut)
}

export async function listReservations(filters: ReservationFilters = {}) {
  const conditions = []
  if (filters.status) conditions.push(eq(reservations.status, filters.status))
  if (filters.roomId) conditions.push(eq(reservations.roomId, filters.roomId))
  if (filters.guestId) conditions.push(eq(reservations.guestId, filters.guestId))

  const query = db.select().from(reservations)
  const filtered = conditions.length > 0 ? query.where(and(...conditions)) : query
  return filtered.orderBy(desc(reservations.createdAt))
}

export async function getReservationById(id: string) {
  const reservation = (await db.select().from(reservations).where(eq(reservations.id, id)).limit(1))[0]
  if (!reservation) throw new AppError(404, 'Reserva no encontrada')
  return reservation
}

export async function checkRoomAvailability(roomId: string, checkIn: string, checkOut: string, excludeId?: string): Promise<void> {
  const overlapping = (await db.select().from(reservations).where(and(
    eq(reservations.roomId, roomId),
    inArray(reservations.status, ['confirmada', 'checkin']),
    lt(reservations.checkIn, checkOut),
    gt(reservations.checkOut, checkIn),
  )).limit(1))[0]

  if (overlapping && overlapping.id !== excludeId) {
    throw new AppError(409, `La habitación ya tiene una reserva del ${overlapping.checkIn} al ${overlapping.checkOut}`)
  }
}

export async function createReservation(input: CreateReservationInput) {
  const room = (await db.select().from(rooms).where(eq(rooms.id, input.roomId)).limit(1))[0]
  if (!room) throw new AppError(404, 'Habitación no encontrada')

  const guest = (await db.select().from(guests).where(eq(guests.id, input.guestId)).limit(1))[0]
  if (!guest) throw new AppError(404, 'Huésped no encontrado')

  if (new Date(input.checkOut) <= new Date(input.checkIn)) {
    throw new AppError(400, 'La fecha de salida debe ser posterior a la de entrada')
  }

  if (input.guests > room.maxCapacity) {
    throw new AppError(400, `La habitación tiene capacidad máxima de ${room.maxCapacity} personas`)
  }

  await checkRoomAvailability(input.roomId, input.checkIn, input.checkOut)

  const now = new Date().toISOString()
  const id = randomUUID()
  const totalAmount = computeTotalAmount(room.pricePerNight, input.checkIn, input.checkOut)

  await db.insert(reservations).values({
    id,
    ...input,
    status: 'confirmada',
    totalAmount,
    createdAt: now,
    updatedAt: now,
  })

  return getReservationById(id)
}

export async function checkInReservation(id: string) {
  return db.transaction(async (tx) => {
    const reservation = (await tx.select().from(reservations).where(eq(reservations.id, id)).limit(1))[0]
    if (!reservation) throw new AppError(404, 'Reserva no encontrada')
    if (reservation.status !== 'confirmada') {
      throw new AppError(409, `Solo se puede hacer check-in a reservas confirmadas (estado actual: ${reservation.status})`)
    }

    const now = new Date().toISOString()
    await tx.update(reservations)
      .set({ status: 'checkin', updatedAt: now })
      .where(eq(reservations.id, id))
    await tx.update(rooms)
      .set({ status: 'ocupada', updatedAt: now })
      .where(eq(rooms.id, reservation.roomId))

    return (await tx.select().from(reservations).where(eq(reservations.id, id)).limit(1))[0]
  })
}

export async function checkOutReservation(id: string) {
  return db.transaction(async (tx) => {
    const reservation = (await tx.select().from(reservations).where(eq(reservations.id, id)).limit(1))[0]
    if (!reservation) throw new AppError(404, 'Reserva no encontrada')
    if (reservation.status !== 'checkin') {
      throw new AppError(409, `Solo se puede hacer check-out a reservas con check-in hecho (estado actual: ${reservation.status})`)
    }

    const now = new Date().toISOString()
    await tx.update(reservations)
      .set({ status: 'checkout', updatedAt: now })
      .where(eq(reservations.id, id))
    await tx.update(rooms)
      .set({ status: 'libre', updatedAt: now })
      .where(eq(rooms.id, reservation.roomId))

    await generateInvoice(tx, reservation)
    return (await tx.select().from(reservations).where(eq(reservations.id, id)).limit(1))[0]
  })
}

export async function cancelReservation(id: string) {
  return db.transaction(async (tx) => {
    const reservation = (await tx.select().from(reservations).where(eq(reservations.id, id)).limit(1))[0]
    if (!reservation) throw new AppError(404, 'Reserva no encontrada')
    if (reservation.status === 'checkout' || reservation.status === 'cancelada') {
      throw new AppError(409, `No se puede cancelar una reserva con estado ${reservation.status}`)
    }

    const now = new Date().toISOString()
    await tx.update(reservations)
      .set({ status: 'cancelada', updatedAt: now })
      .where(eq(reservations.id, id))

    if (reservation.status === 'checkin') {
      await tx.update(rooms)
        .set({ status: 'libre', updatedAt: now })
        .where(eq(rooms.id, reservation.roomId))
    }

    return (await tx.select().from(reservations).where(eq(reservations.id, id)).limit(1))[0]
  })
}

type DbLike = PgTransaction<PostgresJsQueryResultHKT, typeof schema, ExtractTablesWithRelations<typeof schema>>

async function generateInvoice(tx: DbLike, reservation: NonNullable<Awaited<ReturnType<typeof getReservationById>>>) {
  const room = (await tx.select().from(rooms).where(eq(rooms.id, reservation.roomId)).limit(1))[0]
  if (!room) return

  const nights = daysBetween(reservation.checkIn, reservation.checkOut)
  const roomTotal = nights * room.pricePerNight

  const roomSales = await tx.select().from(sales).where(and(
    eq(sales.roomId, reservation.roomId),
    gte(sales.date, reservation.checkIn),
  ))

  const cateringCharges = roomSales.flatMap(s => s.items)
  const cateringTotal = cateringCharges.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)

  const subtotal = Math.round((roomTotal + cateringTotal) * 100) / 100
  const advancePayment = reservation.advancePayment
  const totalDue = Math.round((subtotal - advancePayment) * 100) / 100

  const existingInvoice = (await tx.select().from(invoices).where(eq(invoices.reservationId, reservation.id)).limit(1))[0]
  if (existingInvoice) return

  await tx.insert(invoices).values({
    id: randomUUID(),
    reservationId: reservation.id,
    guestId: reservation.guestId,
    roomNights: { nights, pricePerNight: room.pricePerNight },
    cateringCharges,
    tax: 10,
    subtotal,
    advancePayment,
    totalDue,
    status: totalDue <= 0 ? 'pagada' : 'pendiente',
    date: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  })
}
