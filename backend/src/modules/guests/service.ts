import { randomUUID } from 'node:crypto'
import { and, asc, eq, ne, sql } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { guests } from '../../db/schema.js'
import { AppError } from '../../plugins/error-handler.js'
import type { CreateGuestInput, UpdateGuestInput } from './schemas.js'

export async function listGuests(tenantId: string, search?: string) {
  const conditions = [eq(guests.tenantId, tenantId)]
  if (search) {
    const escaped = search.replace(/[\\%_]/g, (ch) => `\\${ch}`)
    const pattern = `%${escaped}%`
    conditions.push(
      sql`${guests.name} LIKE ${pattern} OR ${guests.document} LIKE ${pattern} OR ${guests.email} LIKE ${pattern} OR ${guests.phone} LIKE ${pattern}`
    )
  }
  return db.select()
    .from(guests)
    .where(and(...conditions))
    .orderBy(asc(guests.name))
}

export async function getGuestById(tenantId: string, id: string) {
  const guest = (await db.select().from(guests).where(and(
    eq(guests.id, id),
    eq(guests.tenantId, tenantId),
  )).limit(1))[0]
  if (!guest) throw new AppError(404, 'Huésped no encontrado')
  return guest
}

async function assertUniqueGuest(
  tenantId: string,
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
    const conditions = [eq(guests.tenantId, tenantId), eq(guests[field], value)]
    if (excludeId) conditions.push(ne(guests.id, excludeId))
    const existing = (await db.select().from(guests).where(and(...conditions)).limit(1))[0]
    if (existing) throw new AppError(409, `Ya existe un huésped con el ${label} ${value}`)
  }
}

export async function createGuest(tenantId: string, input: CreateGuestInput) {
  await assertUniqueGuest(tenantId, input)

  const id = randomUUID()
  await db.insert(guests).values({
    id,
    tenantId,
    name: input.name,
    document: input.document,
    country: input.country ?? '',
    email: input.email ?? '',
    phone: input.phone ?? '',
    createdAt: new Date().toISOString(),
  })
  return getGuestById(tenantId, id)
}

export async function updateGuest(tenantId: string, id: string, input: UpdateGuestInput) {
  await getGuestById(tenantId, id)
  await assertUniqueGuest(tenantId, input, id)

  await db.update(guests).set(input).where(and(
    eq(guests.id, id),
    eq(guests.tenantId, tenantId),
  ))
  return getGuestById(tenantId, id)
}
