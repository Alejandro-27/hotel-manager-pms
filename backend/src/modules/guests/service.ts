import { randomUUID } from 'node:crypto'
import { and, asc, eq, like, ne, or } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { guests } from '../../db/schema.js'
import { AppError } from '../../plugins/error-handler.js'
import type { CreateGuestInput, UpdateGuestInput } from './schemas.js'

export async function listGuests(search?: string) {
  if (search) {
    const escaped = search.replace(/[\\%_]/g, (ch) => `\\${ch}`)
    const pattern = `%${escaped}%`
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

async function assertUniqueGuest(
  input: { document?: string; email?: string; phone?: string },
  excludeId?: string,
) {
  const checks = [
    { field: 'document' as const, label: 'documento', value: input.document },
    { field: 'email' as const, label: 'email', value: input.email },
    { field: 'phone' as const, label: 'telefono', value: input.phone },
  ]
  for (const { field, label, value } of checks) {
    if (!value?.trim()) continue
    const conditions = [eq(guests[field], value)]
    if (excludeId) conditions.push(ne(guests.id, excludeId))
    const existing = (await db.select().from(guests).where(and(...conditions)).limit(1))[0]
    if (existing) throw new AppError(409, `Ya existe un huésped con el ${label} ${value}`)
  }
}

export async function createGuest(input: CreateGuestInput) {
  await assertUniqueGuest(input)

  const id = randomUUID()
  await db.insert(guests).values({
    id,
    name: input.name,
    document: input.document,
    country: input.country ?? '',
    email: input.email ?? '',
    phone: input.phone ?? '',
    createdAt: new Date().toISOString(),
  })
  return getGuestById(id)
}

export async function updateGuest(id: string, input: UpdateGuestInput) {
  await getGuestById(id)
  await assertUniqueGuest(input, id)

  await db.update(guests).set(input).where(eq(guests.id, id))
  return getGuestById(id)
}
