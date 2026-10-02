import { randomUUID } from 'node:crypto'
import { eq, sql } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { db } from '../../db/index.js'
import { refreshSessions, users } from '../../db/schema.js'
import { AppError } from '../../plugins/error-handler.js'
import { isRegistrationAllowed } from '../../config/env.js'
import type { LoginInput, RegisterInput, UpdateProfileInput } from './schemas.js'
import type { AuthUser } from '../../plugins/auth.js'

export interface PublicUser {
  id: string
  name: string
  email: string
  role: string
  hotelName: string | null
}

const LOGIN_MAX_FAILS = 5
const LOGIN_LOCK_MS = 15 * 60 * 1000
const DUMMY_HASH = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'

const loginAttempts = new Map<string, { fails: number; lockedUntil: number }>()

function toPublicUser(u: { id: string; name: string; email: string; role: string; hotelName: string | null }): PublicUser {
  return { id: u.id, name: u.name, email: u.email, role: u.role, hotelName: u.hotelName }
}

function registerFailure(email: string) {
  const state = loginAttempts.get(email) ?? { fails: 0, lockedUntil: 0 }
  state.fails += 1
  if (state.fails >= LOGIN_MAX_FAILS) state.lockedUntil = Date.now() + LOGIN_LOCK_MS
  loginAttempts.set(email, state)
}

export async function register(input: RegisterInput): Promise<PublicUser> {
  const existing = (await db.select().from(users).where(eq(users.email, input.email)).limit(1))[0]
  if (existing) {
    throw new AppError(409, 'El email ya está registrado')
  }

  const userCount = await db.select({ count: sql<number>`count(*)` }).from(users)
  const isFirstUser = Number(userCount[0]?.count ?? 0) === 0

  if (!isFirstUser && !isRegistrationAllowed()) {
    throw new AppError(403, 'El registro público está deshabilitado')
  }

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
  const key = input.email.toLowerCase()
  const state = loginAttempts.get(key)
  if (state?.lockedUntil && state.lockedUntil > Date.now()) {
    throw new AppError(429, 'Demasiados intentos fallidos. Intente de nuevo en unos minutos')
  }
  if (state?.lockedUntil && state.lockedUntil <= Date.now()) {
    loginAttempts.delete(key)
  }

  const user = (await db.select().from(users).where(eq(users.email, input.email)).limit(1))[0]
  if (!user) {
    await bcrypt.compare(input.password, DUMMY_HASH)
    registerFailure(key)
    throw new AppError(401, 'Credenciales inválidas')
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash)
  if (!valid) {
    registerFailure(key)
    throw new AppError(401, 'Credenciales inválidas')
  }

  loginAttempts.delete(key)
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

export async function updateProfile(userId: string, input: UpdateProfileInput): Promise<PublicUser> {
  const existing = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0]
  if (!existing) throw new AppError(404, 'Usuario no encontrado')

  const changes: Record<string, string | null> = { updatedAt: new Date().toISOString() }
  if (input.name !== undefined) changes.name = input.name
  if (input.hotelName !== undefined) changes.hotelName = input.hotelName

  await db.update(users).set(changes).where(eq(users.id, userId))
  const updated = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0]
  if (!updated) throw new AppError(500, 'Error actualizando perfil')

  return toPublicUser(updated)
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  const user = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0]
  if (!user) throw new AppError(404, 'Usuario no encontrado')

  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) throw new AppError(400, 'La contraseña actual no es correcta')

  const passwordHash = await bcrypt.hash(newPassword, 10)
  await db.update(users).set({ passwordHash, updatedAt: new Date().toISOString() }).where(eq(users.id, userId))
  await revokeAllUserSessions(userId)
}

export async function createRefreshSession(id: string, userId: string, expiresAt: string): Promise<void> {
  await db.insert(refreshSessions).values({
    id,
    userId,
    createdAt: new Date().toISOString(),
    expiresAt,
    revokedAt: null,
  })
}

export async function rotateRefreshSession(oldId: string, userId: string): Promise<boolean> {
  const session = (await db.select().from(refreshSessions).where(eq(refreshSessions.id, oldId)).limit(1))[0]
  if (!session || session.revokedAt || session.userId !== userId) return false
  if (new Date(session.expiresAt).getTime() <= Date.now()) return false

  await db.update(refreshSessions).set({ revokedAt: new Date().toISOString() }).where(eq(refreshSessions.id, oldId))
  return true
}

export async function revokeRefreshSession(id: string): Promise<void> {
  await db
    .update(refreshSessions)
    .set({ revokedAt: new Date().toISOString() })
    .where(eq(refreshSessions.id, id))
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await db
    .update(refreshSessions)
    .set({ revokedAt: new Date().toISOString() })
    .where(eq(refreshSessions.userId, userId))
}
