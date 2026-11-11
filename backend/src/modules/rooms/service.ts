import { randomUUID } from 'node:crypto'
import { and, asc, eq, gt, inArray } from 'drizzle-orm'
import type { RoomStatus } from '@hotel/types'
import { db } from '../../db/index.js'
import { reservations, rooms } from '../../db/schema.js'
import { AppError } from '../../plugins/error-handler.js'
import type { CreateRoomInput, UpdateRoomInput, UpdateRoomStatusInput } from './schemas.js'

export interface RoomFilters {
  status?: RoomStatus
  type?: 'individual' | 'doble' | 'suite' | 'familiar'
  floor?: number
}

export function todayISO(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export async function getOccupiedRoomIds(tenantId: string): Promise<Set<string>> {
  const active = await db.select({ roomId: reservations.roomId }).from(reservations).where(and(
    eq(reservations.tenantId, tenantId),
    inArray(reservations.status, ['confirmada', 'checkin']),
    gt(reservations.checkOut, todayISO()),
  ))
  return new Set(active.map((row) => row.roomId))
}

export async function listRooms(tenantId: string, filters: RoomFilters = {}) {
  const occupied = await getOccupiedRoomIds(tenantId)

  const rows = (await db.select().from(rooms).where(eq(rooms.tenantId, tenantId))).map((room) =>
    occupied.has(room.id) && room.status !== 'mantenimiento' && room.status !== 'limpieza'
      ? { ...room, status: 'ocupada' as RoomStatus }
      : room,
  )

  return rows
    .filter((room) => !filters.status || room.status === filters.status)
    .filter((room) => !filters.type || room.type === filters.type)
    .filter((room) => filters.floor === undefined || room.floor === filters.floor)
    .sort((a, b) => a.floor - b.floor || a.number.localeCompare(b.number))
}

export async function getRoomById(tenantId: string, id: string) {
  const room = (await db.select().from(rooms).where(and(
    eq(rooms.id, id),
    eq(rooms.tenantId, tenantId),
  )).limit(1))[0]
  if (!room) throw new AppError(404, 'Habitación no encontrada')
  return room
}

export async function createRoom(tenantId: string, input: CreateRoomInput) {
  const existing = (await db.select().from(rooms).where(and(
    eq(rooms.tenantId, tenantId),
    eq(rooms.number, input.number),
  )).limit(1))[0]
  if (existing) throw new AppError(409, `Ya existe una habitación con el número ${input.number}`)

  const now = new Date().toISOString()
  const id = randomUUID()
  await db.insert(rooms).values({ id, tenantId, ...input, status: 'libre', createdAt: now, updatedAt: now })
  return getRoomById(tenantId, id)
}

export async function updateRoom(tenantId: string, id: string, input: UpdateRoomInput) {
  await getRoomById(tenantId, id)

  if (input.number !== undefined) {
    const existing = (await db.select().from(rooms).where(and(
      eq(rooms.tenantId, tenantId),
      eq(rooms.number, input.number),
    )).limit(1))[0]
    if (existing && existing.id !== id) {
      throw new AppError(409, `Ya existe una habitación con el número ${input.number}`)
    }
  }

  await db.update(rooms)
    .set({ ...input, updatedAt: new Date().toISOString() })
    .where(and(
      eq(rooms.id, id),
      eq(rooms.tenantId, tenantId),
    ))

  return getRoomById(tenantId, id)
}

export async function updateRoomStatus(tenantId: string, id: string, input: UpdateRoomStatusInput) {
  await getRoomById(tenantId, id)
  await db.update(rooms)
    .set({ status: input.status, updatedAt: new Date().toISOString() })
    .where(and(
      eq(rooms.id, id),
      eq(rooms.tenantId, tenantId),
    ))
  return getRoomById(tenantId, id)
}
