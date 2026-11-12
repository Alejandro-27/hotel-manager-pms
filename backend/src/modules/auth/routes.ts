import { randomUUID } from 'node:crypto'
import { z } from 'zod/v4'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import type { FastifyInstance, FastifyReply } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  register,
  login,
  buildAuthUser,
  getMe,
  updateProfile,
  changePassword,
  createRefreshSession,
  rotateRefreshSession,
  revokeRefreshSession,
  listPendingRequests,
  approveRequest,
  rejectRequest,
  listTenants,
} from './service.js'
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  approveRequestSchema,
  rejectRequestSchema,
  createTenantSchema,
  createRecepcionSchema,
  type CreateTenantInput,
  type CreateRecepcionInput,
} from './schemas.js'
import type { AuthUser } from '../../plugins/auth.js'
import { env, jwtAccessTtlSeconds, jwtRefreshTtlSeconds } from '../../config/env.js'
import { db } from '../../db/index.js'
import { tenants, users } from '../../db/schema.js'
import { AppError } from '../../plugins/error-handler.js'

const sameSite: 'none' | 'lax' = env.nodeEnv === 'production' ? 'none' : 'lax'

const accessCookie = {
  httpOnly: true,
  sameSite,
  secure: env.nodeEnv === 'production',
  path: '/',
  maxAge: jwtAccessTtlSeconds,
}

const refreshCookie = {
  httpOnly: true,
  sameSite,
  secure: env.nodeEnv === 'production',
  path: '/api/auth',
  maxAge: jwtRefreshTtlSeconds,
}

const userParamsSchema = z.object({
  userId: z.string().min(1, 'ID de usuario requerido'),
})

export default async function authRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>()

  async function issueSession(reply: FastifyReply, user: { id: string; name: string; email: string; role: string; status: string; tenantId: string | null }) {
    const token = app.jwt.sign({ ...buildAuthUser(user), type: 'access' })
    const jti = randomUUID()
    const refreshToken = app.jwt.sign(
      { ...buildAuthUser(user), type: 'refresh', jti },
      { expiresIn: env.jwtRefreshExpiresIn }
    )
    await createRefreshSession(jti, user.id, user.tenantId, new Date(Date.now() + jwtRefreshTtlSeconds * 1000).toISOString())
    reply.setCookie('token', token, accessCookie)
    reply.setCookie('refreshToken', refreshToken, refreshCookie)
  }

  // Registro: crea cuenta pendiente, no inicia sesión automáticamente
  typedApp.post('/api/auth/register', {
    config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
    schema: { body: registerSchema },
  }, async (_req, reply) => {
    const user = await register(_req.body)
    reply.code(201).send({ user, message: 'Cuenta creada. Está pendiente de aprobación por el administrador.' })
  })

  typedApp.post('/api/auth/login', {
    config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
    schema: { body: loginSchema },
  }, async (req, reply) => {
    const user = await login(req.body)
    await issueSession(reply, { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status, tenantId: user.tenantId })
    reply.send({ user })
  })

  typedApp.post('/api/auth/refresh', {
    config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
  }, async (req, reply) => {
    const token = req.cookies?.refreshToken
    if (!token) {
      reply.code(401).send({ error: 'Sesión expirada' })
      return
    }
    let payload: AuthUser & { type?: string; jti?: string }
    try {
      payload = await app.jwt.verify<AuthUser & { type?: string; jti?: string }>(token)
    } catch {
      reply.code(401).send({ error: 'Sesión expirada' })
      return
    }
    if (payload.type !== 'refresh' || !payload.jti) {
      reply.code(401).send({ error: 'Sesión expirada' })
      return
    }

    const rotated = await rotateRefreshSession(payload.jti, payload.sub)
    if (!rotated) {
      reply.code(401).send({ error: 'Sesión expirada' })
      return
    }

    const user = await getMe(payload.sub)
    await issueSession(reply, { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status, tenantId: user.tenantId })
    reply.send({ user })
  })

  typedApp.post('/api/auth/logout', async (req, reply) => {
    const token = req.cookies?.refreshToken
    if (token) {
      try {
        const payload = await app.jwt.verify<AuthUser & { jti?: string }>(token)
        if (payload.jti) await revokeRefreshSession(payload.jti)
      } catch {
        // cookie inválida o expirada: solo se limpian las cookies
      }
    }
    reply.clearCookie('token', { path: '/' })
    reply.clearCookie('refreshToken', { path: '/api/auth' })
    reply.send({ ok: true })
  })

  typedApp.get('/api/auth/me', { preHandler: [app.requireActive] }, async (req, reply) => {
    const user = await getMe(req.authUser.sub)
    reply.send(user)
  })

  typedApp.patch('/api/auth/profile', {
    preHandler: [app.requireActive],
    schema: { body: updateProfileSchema },
  }, async (req, reply) => {
    const user = await updateProfile(req.authUser.sub, req.body)
    reply.send(user)
  })

  typedApp.post('/api/auth/password', {
    preHandler: [app.requireActive],
    schema: { body: changePasswordSchema },
  }, async (req, reply) => {
    await changePassword(req.authUser.sub, req.body.currentPassword, req.body.newPassword)
    reply.send({ ok: true })
  })

  /* ---------- Endpoints de administración del sistema (solo admin aprobado) ---------- */

  typedApp.get('/api/auth/pending-requests', {
    preHandler: [app.requireSuperAdmin],
  }, async () => {
    const requests = await listPendingRequests()
    return { requests }
  })

  typedApp.patch('/api/auth/pending-requests/:userId/approve', {
    preHandler: [app.requireSuperAdmin],
    schema: { params: userParamsSchema, body: approveRequestSchema },
  }, async (req, reply) => {
    const { userId } = req.params as { userId: string }
    const { role, tenantId } = req.body as { role: 'admin' | 'recepcion'; tenantId: string }
    const user = await approveRequest({ userId, role, tenantId })
    reply.send({ user })
  })

  typedApp.patch('/api/auth/pending-requests/:userId/reject', {
    preHandler: [app.requireSuperAdmin],
    schema: { params: userParamsSchema, body: rejectRequestSchema },
  }, async (req, reply) => {
    const { userId } = req.params as { userId: string }
    await rejectRequest(userId)
    reply.send({ ok: true })
  })

  typedApp.get('/api/auth/tenants', {
    preHandler: [app.requireSuperAdmin],
  }, async () => {
    const list = await listTenants()
    return { tenants: list }
  })

  typedApp.post('/api/auth/tenants', {
    preHandler: [app.requireSuperAdmin],
    schema: { body: createTenantSchema },
  }, async (req, reply) => {
    const input = req.body as CreateTenantInput
    const existing = (await db.select().from(tenants).where(eq(tenants.slug, input.slug)).limit(1))[0]
    if (existing) {
      throw new AppError(409, 'Ya existe un hotel con ese slug')
    }
    const now = new Date().toISOString()
    const id = randomUUID()
    await db.insert(tenants).values({ id, name: input.name, slug: input.slug, createdAt: now, updatedAt: now })
    reply.code(201).send({ id, name: input.name, slug: input.slug })
  })

  typedApp.post('/api/auth/recepcion', {
    preHandler: [app.requireAdmin],
    schema: { body: createRecepcionSchema },
  }, async (req, reply) => {
    const { name, email, password } = req.body as CreateRecepcionInput
    let adminTenantId = req.authUser.tenantId

    // Un superadmin puede crear recepción en cualquier tenant si se especifica
    // En el futuro se podría agregar un campo tenantId opcional al body
    if (!adminTenantId) {
      throw new AppError(403, 'El administrador no tiene un hotel asignado')
    }

    // Si es superadmin y no tiene tenantId, no puede crear recepción (necesita especificar hotel)
    if (req.authUser.role === 'superadmin' && !adminTenantId) {
      throw new AppError(403, 'Debe especificar un hotel para crear una recepción')
    }

    const existing = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0]
    if (existing) {
      throw new AppError(409, 'El email ya está registrado')
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const now = new Date().toISOString()
    const userId = randomUUID()

    await db.insert(users).values({
      id: userId,
      name,
      email,
      passwordHash,
      role: 'recepcion',
      status: 'activo',
      tenantId: adminTenantId,
      invitedBy: req.authUser.sub,
      termsAcceptedAt: now,
      createdAt: now,
      updatedAt: now,
    })

    const created = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0]
    if (!created) throw new AppError(500, 'Error creando recepción')

    const tenantName = (await db.select({ name: tenants.name }).from(tenants).where(eq(tenants.id, adminTenantId)).limit(1))[0]?.name ?? null

    reply.code(201).send({
      user: {
        id: created.id,
        name: created.name,
        email: created.email,
        role: created.role,
        status: created.status,
        tenantId: created.tenantId,
        tenantName,
        termsAcceptedAt: created.termsAcceptedAt,
      },
    })
  })
}
