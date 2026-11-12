import { randomUUID } from 'node:crypto'
import { asc, eq, sql } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { db } from '../../db/index.js'
import { refreshSessions, tenants, users, rooms, reservations, sales } from '../../db/schema.js'
import { AppError } from '../../plugins/error-handler.js'
import type { LoginInput, RegisterInput, UpdateProfileInput, UpdateTenantInput } from './schemas.js'
import type { AuthUser } from '../../plugins/auth.js'

export interface PublicUser {
  id: string
  name: string
  email: string
  role: string
  status: string
  tenantId: string | null
  tenantName: string | null
  termsAcceptedAt: string | null
}

const LOGIN_MAX_FAILS = 5
const LOGIN_LOCK_MS = 15 * 60 * 1000
const DUMMY_HASH = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'

const loginAttempts = new Map<string, { fails: number; lockedUntil: number }>()

function toPublicUser(u: {
  id: string
  name: string
  email: string
  role: string
  status: string
  tenantId: string | null
  tenantName: string | null
  termsAcceptedAt: string | null
}): PublicUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    tenantId: u.tenantId,
    tenantName: u.tenantName,
    termsAcceptedAt: u.termsAcceptedAt,
  }
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

  const passwordHash = await bcrypt.hash(input.password, 10)
  const now = new Date().toISOString()
  const userId = randomUUID()

  await db.insert(users).values({
    id: userId,
    name: input.name,
    email: input.email,
    passwordHash,
    role: 'pendiente',
    status: 'pendiente',
    tenantId: null,
    invitedBy: null,
    termsAcceptedAt: input.acceptTerms ? now : null,
    createdAt: now,
    updatedAt: now,
  })

  const created = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0]
  if (!created) throw new AppError(500, 'Error creando usuario')

  return toPublicUser({
    id: created.id,
    name: created.name,
    email: created.email,
    role: created.role,
    status: created.status,
    tenantId: created.tenantId,
    tenantName: null,
    termsAcceptedAt: created.termsAcceptedAt,
  })
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

  if (user.status !== 'activo') {
    throw new AppError(403, 'Su cuenta está pendiente de aprobación por el administrador')
  }

  loginAttempts.delete(key)

  const tenantName = user.tenantId
    ? (await db.select({ name: tenants.name }).from(tenants).where(eq(tenants.id, user.tenantId)).limit(1))[0]?.name ?? null
    : null

  return toPublicUser({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    tenantId: user.tenantId,
    tenantName,
    termsAcceptedAt: user.termsAcceptedAt,
  })
}

export function buildAuthUser(user: {
  id: string
  name: string
  email: string
  role: string
  status: string
  tenantId: string | null
}): AuthUser {
  return {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    tenantId: user.tenantId,
  }
}

export async function getMe(userId: string): Promise<PublicUser> {
  const user = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0]
  if (!user) throw new AppError(404, 'Usuario no encontrado')

  const tenantName = user.tenantId
    ? (await db.select({ name: tenants.name }).from(tenants).where(eq(tenants.id, user.tenantId)).limit(1))[0]?.name ?? null
    : null

  return toPublicUser({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    tenantId: user.tenantId,
    tenantName,
    termsAcceptedAt: user.termsAcceptedAt,
  })
}

export async function updateProfile(userId: string, input: UpdateProfileInput): Promise<PublicUser> {
  const existing = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0]
  if (!existing) throw new AppError(404, 'Usuario no encontrado')

  const changes: Record<string, string | null> = { updatedAt: new Date().toISOString() }
  if (input.name !== undefined) changes.name = input.name

  await db.update(users).set(changes).where(eq(users.id, userId))
  const updated = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0]
  if (!updated) throw new AppError(500, 'Error actualizando perfil')

  const tenantName = updated.tenantId
    ? (await db.select({ name: tenants.name }).from(tenants).where(eq(tenants.id, updated.tenantId)).limit(1))[0]?.name ?? null
    : null

  return toPublicUser({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    status: updated.status,
    tenantId: updated.tenantId,
    tenantName,
    termsAcceptedAt: updated.termsAcceptedAt,
  })
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

export async function createRefreshSession(id: string, userId: string, tenantId: string | null, expiresAt: string): Promise<void> {
  await db.insert(refreshSessions).values({
    id,
    userId,
    tenantId: tenantId ?? '',
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

/* ---------- Gestión de solicitudes pendientes (admin del sistema) ---------- */

export interface PendingRequest {
  id: string
  name: string
  email: string
  role: string
  status: string
  createdAt: string
  tenantId: string | null
  tenantName: string | null
}

export async function listPendingRequests(): Promise<PendingRequest[]> {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
      createdAt: users.createdAt,
      tenantId: users.tenantId,
      tenantName: tenants.name,
    })
    .from(users)
    .leftJoin(tenants, eq(users.tenantId, tenants.id))
    .where(eq(users.status, 'pendiente'))
    .orderBy(asc(users.createdAt))

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    status: r.status,
    createdAt: r.createdAt,
    tenantId: r.tenantId,
    tenantName: r.tenantName,
  }))
}

export interface ApproveRequestInput {
  userId: string
  role: 'admin' | 'recepcion'
  tenantId: string
}

export async function approveRequest(input: ApproveRequestInput): Promise<PublicUser> {
  const user = (await db.select().from(users).where(eq(users.id, input.userId)).limit(1))[0]
  if (!user) throw new AppError(404, 'Usuario no encontrado')
  if (user.status !== 'pendiente') {
    throw new AppError(400, 'El usuario ya no está pendiente de aprobación')
  }

  const tenant = (await db.select().from(tenants).where(eq(tenants.id, input.tenantId)).limit(1))[0]
  if (!tenant) throw new AppError(404, 'Hotel no encontrado')

  const now = new Date().toISOString()
  await db.update(users).set({
    role: input.role,
    status: 'activo',
    tenantId: input.tenantId,
    updatedAt: now,
  }).where(eq(users.id, input.userId))

  const updated = (await db.select().from(users).where(eq(users.id, input.userId)).limit(1))[0]!
  return toPublicUser({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    status: updated.status,
    tenantId: updated.tenantId,
    tenantName: tenant.name,
    termsAcceptedAt: updated.termsAcceptedAt,
  })
}

export async function rejectRequest(userId: string): Promise<void> {
  const user = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0]
  if (!user) throw new AppError(404, 'Usuario no encontrado')
  if (user.status !== 'pendiente') {
    throw new AppError(400, 'El usuario ya no está pendiente de aprobación')
  }

  await db.update(users).set({
    status: 'rechazado',
    updatedAt: new Date().toISOString(),
  }).where(eq(users.id, userId))
}

export async function listTenants(): Promise<{ id: string; name: string; slug: string }[]> {
  return db.select({ id: tenants.id, name: tenants.name, slug: tenants.slug }).from(tenants)
}

export async function updateTenant(tenantId: string, input: UpdateTenantInput): Promise<void> {
  const existing = (await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1))[0]
  if (!existing) throw new AppError(404, 'Hotel no encontrado')

  const changes: Record<string, string> = {}
  if (input.name !== undefined) changes.name = input.name
  if (input.slug !== undefined) changes.slug = input.slug
  changes.updatedAt = new Date().toISOString()

  if (Object.keys(changes).length > 1) {
    await db.update(tenants).set(changes).where(eq(tenants.id, tenantId))
  }
}

export async function deleteTenant(tenantId: string): Promise<void> {
  const existing = (await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1))[0]
  if (!existing) throw new AppError(404, 'Hotel no encontrado')

  // Verificar que no haya usuarios asociados
  const usersCount = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.tenantId, tenantId))
  if (Number(usersCount[0]?.count ?? 0) > 0) {
    throw new AppError(409, 'No se puede eliminar el hotel: tiene usuarios asociados')
  }

  await db.delete(tenants).where(eq(tenants.id, tenantId))
}

/* ---------- Informes del sistema (solo superadmin) ---------- */

export interface SystemOverview {
  totalTenants: number
  totalUsers: number
  activeUsers: number
  pendingUsers: number
  totalRooms: number
  occupiedRooms: number
  totalReservations: number
  activeReservations: number
  totalSales: number
  totalRevenue: number
}

export interface TenantStats {
  id: string
  name: string
  slug: string
  userCount: number
  roomCount: number
  reservationCount: number
  revenue: number
}

export async function getSystemOverview(): Promise<SystemOverview> {
  const [tenantCount, userCount, activeUserCount, pendingUserCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(tenants),
    db.select({ count: sql<number>`count(*)` }).from(users),
    db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.status, 'activo')),
    db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.status, 'pendiente')),
  ])

  const [roomCount, occupiedRoomCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(rooms),
    db.select({ count: sql<number>`count(*)` }).from(rooms).where(eq(rooms.status, 'ocupada')),
  ])

  const [reservationCount, activeReservationCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(reservations),
    db.select({ count: sql<number>`count(*)` }).from(reservations).where(eq(reservations.status, 'checkin')),
  ])

  const [salesResult] = await db.select({
    totalSales: sql<number>`count(*)`,
    totalRevenue: sql<number>`coalesce(sum(${sales.total}), 0)`,
  }).from(sales)

  return {
    totalTenants: Number(tenantCount[0]?.count ?? 0),
    totalUsers: Number(userCount[0]?.count ?? 0),
    activeUsers: Number(activeUserCount[0]?.count ?? 0),
    pendingUsers: Number(pendingUserCount[0]?.count ?? 0),
    totalRooms: Number(roomCount[0]?.count ?? 0),
    occupiedRooms: Number(occupiedRoomCount[0]?.count ?? 0),
    totalReservations: Number(reservationCount[0]?.count ?? 0),
    activeReservations: Number(activeReservationCount[0]?.count ?? 0),
    totalSales: Number(salesResult?.totalSales ?? 0),
    totalRevenue: Number(salesResult?.totalRevenue ?? 0),
  }
}

export async function getTenantsWithStats(): Promise<TenantStats[]> {
  const tenantList = await db.select({ id: tenants.id, name: tenants.name, slug: tenants.slug }).from(tenants)

  const result = await Promise.all(tenantList.map(async (t) => {
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.tenantId, t.id))
    const [roomCount] = await db.select({ count: sql<number>`count(*)` }).from(rooms).where(eq(rooms.tenantId, t.id))
    const [resCount] = await db.select({ count: sql<number>`count(*)` }).from(reservations).where(eq(reservations.tenantId, t.id))
    const [revenueResult] = await db.select({
      revenue: sql<number>`coalesce(sum(${sales.total}), 0)`,
    }).from(sales).where(eq(sales.tenantId, t.id))

    return {
      id: t.id,
      name: t.name,
      slug: t.slug,
      userCount: Number(userCount?.count ?? 0),
      roomCount: Number(roomCount?.count ?? 0),
      reservationCount: Number(resCount?.count ?? 0),
      revenue: Number(revenueResult?.revenue ?? 0),
    }
  }))

  return result
}

