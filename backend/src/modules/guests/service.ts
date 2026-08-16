import { randomUUID } from 'node:crypto'
import { asc, eq, like, or } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { guests } from '../../db/schema.js'
import { AppError } from '../../plugins/error-handler.js'
import type { CreateGuestInput, UpdateGuestInput } from './schemas.js'

export async function listGuests(search?: string) {
  if (search) {
    const pattern = `%${search}%`
    return db.select()
      .from(guests)
      .where(or(
        like(guests.name, pattern),
        like(guests.document, pattern),
        like(guests.email, pattern),
        like(guests.phone, pattern),
      ))
      .orderBy(asc(guests.name))
  }
  return db.select().from(guests).orderBy(asc(guests.name))
}

export async function getGuestById(id: string) {
  const guest = (await db.select().from(guests).where(eq(guests.id, id)).limit(1))[0]
  if (!guest) throw new AppError(404, 'Huésped no encontrado')
  return guest
}

export async function createGuest(input: CreateGuestInput) {
  const existing = (await db.select().from(guests).where(eq(guests.document, input.document)).limit(1))[0]
  if (existing) throw new AppError(409, `Ya existe un huésped con el documento ${input.document}`)

  const id = randomUUID()
  await db.insert(guests).values({ id, ...input, createdAt: new Date().toISOString() })
  return getGuestById(id)
}

export async function updateGuest(id: string, input: UpdateGuestInput) {
  await getGuestById(id)

  if (input.document !== undefined) {
    const existing = (await db.select().from(guests).where(eq(guests.document, input.document)).limit(1))[0]
    if (existing && existing.id !== id) {
      throw new AppError(409, `Ya existe un huésped con el documento ${input.document}`)
    }
  }

  await db.update(guests).set(input).where(eq(guests.id, id))
  return getGuestById(id)
}
