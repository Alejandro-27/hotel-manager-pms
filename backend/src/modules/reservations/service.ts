import { randomUUID } from 'node:crypto'
import { and, desc, eq, gt, inArray, lt } from 'drizzle-orm'
import type { ReservationStatus } from '@hotel/types'
import { db } from '../../db/index.js'
import { guests, invoices, reservations, rooms } from '../../db/schema.js'
import { AppError } from '../../plugins/error-handler.js'
import { syncInvoiceForReservation } from '../billing/service.js'
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

export async function listReservations(tenantId: string, filters: ReservationFilters = {}) {
  const conditions = [eq(reservations.tenantId, tenantId)]
  if (filters.status) conditions.push(eq(reservations.status, filters.status))
  if (filters.roomId) conditions.push(eq(reservations.roomId, filters.roomId))
  if (filters.guestId) conditions.push(eq(reservations.guestId, filters.guestId))

  return db.select().from(reservations)
    .where(and(...conditions))
    .orderBy(desc(reservations.createdAt))
}

export async function getReservationById(tenantId: string, id: string) {
  const reservation = (await db.select().from(reservations).where(and(
    eq(reservations.id, id),
    eq(reservations.tenantId, tenantId),
  )).limit(1))[0]
  if (!reservation) throw new AppError(404, 'Reserva no encontrada')
  return reservation
}

export async function checkRoomAvailability(tenantId: string, roomId: string, checkIn: string, checkOut: string, excludeId?: string): Promise<void> {
  const conditions = [
    eq(reservations.tenantId, tenantId),
    eq(reservations.roomId, roomId),
    inArray(reservations.status, ['confirmada', 'checkin']),
    lt(reservations.checkIn, checkOut),
    gt(reservations.checkOut, checkIn),
  ]
  const overlapping = (await db.select().from(reservations).where(and(...conditions)).limit(1))[0]

  if (overlapping && overlapping.id !== excludeId) {
    throw new AppError(409, `La habitación ya tiene una reserva del ${overlapping.checkIn} al ${overlapping.checkOut}`)
  }
}

export async function createReservation(tenantId: string, input: CreateReservationInput) {
  if (new Date(input.checkOut) <= new Date(input.checkIn)) {
    throw new AppError(400, 'La fecha de salida debe ser posterior a la de entrada')
  }

  return db.transaction(async (tx) => {
    const room = (await tx.select().from(rooms).where(and(
      eq(rooms.id, input.roomId),
      eq(rooms.tenantId, tenantId),
    )).limit(1).for('update'))[0]
    if (!room) throw new AppError(404, 'Habitación no encontrada')

    const guest = (await tx.select().from(guests).where(and(
      eq(guests.id, input.guestId),
      eq(guests.tenantId, tenantId),
    )).limit(1))[0]
    if (!guest) throw new AppError(404, 'Huésped no encontrado')

    if (input.guests > room.maxCapacity) {
      throw new AppError(400, `La habitación tiene capacidad máxima de ${room.maxCapacity} personas`)
    }

    await checkRoomAvailability(tenantId, input.roomId, input.checkIn, input.checkOut)

    const now = new Date().toISOString()
    const id = randomUUID()
    const totalAmount = computeTotalAmount(room.pricePerNight, input.checkIn, input.checkOut)
    const advancePayment = Math.min(input.advancePayment ?? 0, totalAmount)

    await tx.insert(reservations).values({
      id,
      tenantId,
      ...input,
      cancellationPolicyAcceptedAt: now,
      advancePayment,
      status: 'confirmada',
      totalAmount,
      createdAt: now,
      updatedAt: now,
    })

    return (await tx.select().from(reservations).where(and(
      eq(reservations.id, id),
      eq(reservations.tenantId, tenantId),
    )).limit(1))[0]
  })
}

export async function checkInReservation(tenantId: string, id: string) {
  return db.transaction(async (tx) => {
    const reservation = (await tx.select().from(reservations).where(and(
      eq(reservations.id, id),
      eq(reservations.tenantId, tenantId),
    )).limit(1))[0]
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
      .where(and(
        eq(rooms.id, reservation.roomId),
        eq(rooms.tenantId, tenantId),
      ))

    return (await tx.select().from(reservations).where(eq(reservations.id, id)).limit(1))[0]
  })
}

export async function checkOutReservation(tenantId: string, id: string) {
  return db.transaction(async (tx) => {
    const reservation = (await tx.select().from(reservations).where(and(
      eq(reservations.id, id),
      eq(reservations.tenantId, tenantId),
    )).limit(1))[0]
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
      .where(and(
        eq(rooms.id, reservation.roomId),
        eq(rooms.tenantId, tenantId),
      ))

    await syncInvoiceForReservation(tx, reservation, tenantId)
    return (await tx.select().from(reservations).where(eq(reservations.id, id)).limit(1))[0]
  })
}

export async function cancelReservation(tenantId: string, id: string) {
  return db.transaction(async (tx) => {
    const reservation = (await tx.select().from(reservations).where(and(
      eq(reservations.id, id),
      eq(reservations.tenantId, tenantId),
    )).limit(1))[0]
    if (!reservation) throw new AppError(404, 'Reserva no encontrada')
    if (reservation.status === 'checkout' || reservation.status === 'cancelada') {
      throw new AppError(409, `No se puede cancelar una reserva con estado ${reservation.status}`)
    }
    if (reservation.status === 'checkin') {
      throw new AppError(400, 'No se puede cancelar una estancia alojada; realice el checkout primero')
    }

    const now = new Date().toISOString()
    await tx.update(reservations)
      .set({ status: 'cancelada', updatedAt: now })
      .where(eq(reservations.id, id))

    const invoice = (await tx.select().from(invoices).where(eq(invoices.reservationId, reservation.id)).limit(1))[0]
    if (invoice && invoice.status === 'pendiente') {
      await tx.delete(invoices).where(eq(invoices.id, invoice.id))
    }

    return (await tx.select().from(reservations).where(eq(reservations.id, id)).limit(1))[0]
  })
}
