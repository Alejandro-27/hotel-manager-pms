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
  updateTenant,
  deleteTenant,
  getSystemOverview,
  getTenantsWithStats,
} from './service.js'
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  approveRequestSchema,
  rejectRequestSchema,
  createTenantSchema,
  updateTenantSchema,
  createRecepcionSchema,
  type CreateTenantInput,
  type UpdateTenantInput,
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

const tenantParamsSchema = z.object({
  tenantId: z.string().min(1, 'ID de hotel requerido'),
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

  const sameSite: 'none' | 'lax' = env.nodeEnv === 'production' ? 'none' : 'lax'

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
    // Limpiar cookies con las mismas opciones con las que se crearon
    reply.clearCookie('token', { path: '/', sameSite, secure: env.nodeEnv === 'production' })
    reply.clearCookie('refreshToken', { path: '/api/auth', sameSite, secure: env.nodeEnv === 'production' })
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

  /* ---------- Endpoints de administración del sistema (solo superadmin) ---------- */

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

  /* ---------- Gestión de tenants (hoteles) - solo superadmin ---------- */

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

  typedApp.patch('/api/auth/tenants/:tenantId', {
    preHandler: [app.requireSuperAdmin],
    schema: { params: tenantParamsSchema, body: updateTenantSchema },
  }, async (req, reply) => {
    const { tenantId } = req.params as { tenantId: string }
    const input = req.body as UpdateTenantInput
    const existing = (await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1))[0]
    if (!existing) {
      throw new AppError(404, 'Hotel no encontrado')
    }
    if (input.slug) {
      const slugExists = (await db.select().from(tenants).where(eq(tenants.slug, input.slug)).limit(1))[0]
      if (slugExists && slugExists.id !== tenantId) {
        throw new AppError(409, 'Ya existe un hotel con ese slug')
      }
    }
    await updateTenant(tenantId, input)
    const updated = (await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1))[0]
    reply.send(updated)
  })

  typedApp.delete('/api/auth/tenants/:tenantId', {
    preHandler: [app.requireSuperAdmin],
    schema: { params: tenantParamsSchema },
  }, async (req, reply) => {
    const { tenantId } = req.params as { tenantId: string }
    await deleteTenant(tenantId)
    reply.send({ ok: true })
  })

  /* ---------- Informes del sistema (solo superadmin) ---------- */

  typedApp.get('/api/auth/system-reports/overview', {
    preHandler: [app.requireSuperAdmin],
  }, async () => {
    return getSystemOverview()
  })

  typedApp.get('/api/auth/system-reports/tenants', {
    preHandler: [app.requireSuperAdmin],
  }, async () => {
    return getTenantsWithStats()
  })

  /* ---------- Crear recepción ---------- */

  typedApp.post('/api/auth/recepcion', {
    preHandler: [app.requireAdmin],
    schema: { body: createRecepcionSchema },
  }, async (req, reply) => {
    const { name, email, password, tenantId } = req.body as CreateRecepcionInput

    // Determinar el tenant donde se creará la recepción
    let targetTenantId: string

    if (req.authUser.role === 'superadmin') {
      // Superadmin debe especificar tenantId
      if (!tenantId) {
        throw new AppError(400, 'Debe especificar el hotel donde se creará la recepción')
      }
      targetTenantId = tenantId
    } else {
      // Admin regular: solo puede crear recepciones en su propio hotel
      if (!req.authUser.tenantId) {
        throw new AppError(403, 'El administrador no tiene un hotel asignado')
      }
      targetTenantId = req.authUser.tenantId
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
      tenantId: targetTenantId,
      invitedBy: req.authUser.sub,
      termsAcceptedAt: now,
      createdAt: now,
      updatedAt: now,
    })

    const created = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0]
    if (!created) throw new AppError(500, 'Error creando recepción')

    const tenantName = (await db.select({ name: tenants.name }).from(tenants).where(eq(tenants.id, targetTenantId)).limit(1))[0]?.name ?? null

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
      password, // Contraseña en texto plano solo en esta respuesta de creación
    })
  })
}
