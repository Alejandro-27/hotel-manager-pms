import { randomUUID } from 'node:crypto'
import { and, asc, eq } from 'drizzle-orm'
import type { RoomStatus } from '@hotel/types'
import { db } from '../../db/index.js'
import { rooms } from '../../db/schema.js'
import { AppError } from '../../plugins/error-handler.js'
import type { CreateRoomInput, UpdateRoomInput, UpdateRoomStatusInput } from './schemas.js'

export interface RoomFilters {
  status?: RoomStatus
  type?: 'individual' | 'doble' | 'suite' | 'familiar'
  floor?: number
}

export async function listRooms(filters: RoomFilters = {}) {
  const conditions = []
  if (filters.status) conditions.push(eq(rooms.status, filters.status))
  if (filters.type) conditions.push(eq(rooms.type, filters.type))
  if (filters.floor !== undefined) conditions.push(eq(rooms.floor, filters.floor))

  const query = db.select().from(rooms)
  const filtered = conditions.length > 0 ? query.where(and(...conditions)) : query
  return filtered.orderBy(asc(rooms.floor), asc(rooms.number))
}

export async function getRoomById(id: string) {
  const room = (await db.select().from(rooms).where(eq(rooms.id, id)).limit(1))[0]
  if (!room) throw new AppError(404, 'Habitación no encontrada')
  return room
}

export async function createRoom(input: CreateRoomInput) {
  const existing = (await db.select().from(rooms).where(eq(rooms.number, input.number)).limit(1))[0]
  if (existing) throw new AppError(409, `Ya existe una habitación con el número ${input.number}`)

  const now = new Date().toISOString()
  const id = randomUUID()
  await db.insert(rooms).values({ id, ...input, status: 'libre', createdAt: now, updatedAt: now })
  return getRoomById(id)
}

export async function updateRoom(id: string, input: UpdateRoomInput) {
  await getRoomById(id)

  if (input.number !== undefined) {
    const existing = (await db.select().from(rooms).where(eq(rooms.number, input.number)).limit(1))[0]
    if (existing && existing.id !== id) {
      throw new AppError(409, `Ya existe una habitación con el número ${input.number}`)
    }
  }

  await db.update(rooms)
    .set({ ...input, updatedAt: new Date().toISOString() })
    .where(eq(rooms.id, id))

  return getRoomById(id)
}

export async function updateRoomStatus(id: string, input: UpdateRoomStatusInput) {
  await getRoomById(id)
  await db.update(rooms)
    .set({ status: input.status, updatedAt: new Date().toISOString() })
    .where(eq(rooms.id, id))
  return getRoomById(id)
}
