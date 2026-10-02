import { randomUUID } from 'node:crypto'
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
} from './service.js'
import { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } from './schemas.js'
import type { AuthUser } from '../../plugins/auth.js'
import { env, jwtAccessTtlSeconds, jwtRefreshTtlSeconds } from '../../config/env.js'

const accessCookie = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.nodeEnv === 'production',
  path: '/',
  maxAge: jwtAccessTtlSeconds,
}

const refreshCookie = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.nodeEnv === 'production',
  path: '/api/auth',
  maxAge: jwtRefreshTtlSeconds,
}

export default async function authRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>()

  async function issueSession(reply: FastifyReply, user: { id: string; name: string; email: string; role: string }) {
    const token = app.jwt.sign({ ...buildAuthUser(user), type: 'access' })
    const jti = randomUUID()
    const refreshToken = app.jwt.sign(
      { ...buildAuthUser(user), type: 'refresh', jti },
      { expiresIn: env.jwtRefreshExpiresIn }
    )
    await createRefreshSession(jti, user.id, new Date(Date.now() + jwtRefreshTtlSeconds * 1000).toISOString())
    reply.setCookie('token', token, accessCookie)
    reply.setCookie('refreshToken', refreshToken, refreshCookie)
  }

  typedApp.post('/api/auth/register', {
    config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
    schema: { body: registerSchema },
  }, async (req, reply) => {
    const user = await register(req.body)
    await issueSession(reply, user)
    reply.code(201).send({ user })
  })

  typedApp.post('/api/auth/login', {
    config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
    schema: { body: loginSchema },
  }, async (req, reply) => {
    const user = await login(req.body)
    await issueSession(reply, user)
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
    await issueSession(reply, user)
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

  typedApp.get('/api/auth/me', { preHandler: [app.authenticate] }, async (req, reply) => {
    const user = await getMe(req.authUser.sub)
    reply.send(user)
  })

  typedApp.patch('/api/auth/profile', {
    preHandler: [app.authenticate],
    schema: { body: updateProfileSchema },
  }, async (req, reply) => {
    const user = await updateProfile(req.authUser.sub, req.body)
    reply.send(user)
  })

  typedApp.post('/api/auth/password', {
    preHandler: [app.authenticate],
    schema: { body: changePasswordSchema },
  }, async (req, reply) => {
    await changePassword(req.authUser.sub, req.body.currentPassword, req.body.newPassword)
    reply.send({ ok: true })
  })
}
