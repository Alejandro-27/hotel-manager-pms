import { randomUUID } from 'node:crypto'
import { eq, sql } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { db } from '../../db/index.js'
import { users } from '../../db/schema.js'
import { AppError } from '../../plugins/error-handler.js'
import type { LoginInput, RegisterInput } from './schemas.js'
import type { AuthUser } from '../../plugins/auth.js'

export interface PublicUser {
  id: string
  name: string
  email: string
  role: string
  hotelName: string | null
}

function toPublicUser(u: { id: string; name: string; email: string; role: string; hotelName: string | null }): PublicUser {
  return { id: u.id, name: u.name, email: u.email, role: u.role, hotelName: u.hotelName }
}

export async function register(input: RegisterInput): Promise<PublicUser> {
  const existing = (await db.select().from(users).where(eq(users.email, input.email)).limit(1))[0]
  if (existing) {
    throw new AppError(409, 'El email ya está registrado')
  }

  const userCount = await db.select({ count: sql<number>`count(*)` }).from(users)
  const isFirstUser = Number(userCount[0]?.count ?? 0) === 0

  const passwordHash = await bcrypt.hash(input.password, 10)
  const now = new Date().toISOString()
  const userId = randomUUID()

  await db.insert(users).values({
    id: userId,
    name: input.name,
    email: input.email,
    passwordHash,
    role: isFirstUser ? 'admin' : 'recepcion',
    hotelName: input.hotelName ?? null,
    createdAt: now,
    updatedAt: now,
  })

  const created = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0]
  if (!created) throw new AppError(500, 'Error creando usuario')

  return toPublicUser(created)
}

export async function login(input: LoginInput): Promise<PublicUser> {
  const user = (await db.select().from(users).where(eq(users.email, input.email)).limit(1))[0]
  if (!user) {
    throw new AppError(401, 'Credenciales inválidas')
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash)
  if (!valid) {
    throw new AppError(401, 'Credenciales inválidas')
  }

  return toPublicUser(user)
}

export function buildAuthUser(user: { id: string; name: string; email: string; role: string }): AuthUser {
  return {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  }
}

export async function getMe(userId: string): Promise<PublicUser> {
  const user = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0]
  if (!user) throw new AppError(404, 'Usuario no encontrado')
  return toPublicUser(user)
}
