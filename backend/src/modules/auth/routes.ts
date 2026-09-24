import type { FastifyInstance, FastifyReply } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { register, login, buildAuthUser, getMe, updateProfile, changePassword } from './service.js'
import { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } from './schemas.js'
import type { AuthUser } from '../../plugins/auth.js'
import { env } from '../../config/env.js'

const accessCookie = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.nodeEnv === 'production',
  path: '/',
  maxAge: 7 * 24 * 60 * 60,
}

const refreshCookie = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.nodeEnv === 'production',
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60,
}

export default async function authRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>()

  function setAuthCookies(reply: FastifyReply, user: { id: string; name: string; email: string; role: string }) {
    const token = app.jwt.sign(buildAuthUser(user))
    const refreshToken = app.jwt.sign(
      { ...buildAuthUser(user), type: 'refresh' },
      { expiresIn: env.jwtRefreshExpiresIn }
    )
    reply.setCookie('token', token, accessCookie)
    reply.setCookie('refreshToken', refreshToken, refreshCookie)
    return token
  }

  typedApp.post('/api/auth/register', {
    config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
    schema: { body: registerSchema },
  }, async (req, reply) => {
    const user = await register(req.body)
    const token = setAuthCookies(reply, user)
    reply.code(201).send({ user, token })
  })

  typedApp.post('/api/auth/login', {
    config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
    schema: { body: loginSchema },
  }, async (req, reply) => {
    const user = await login(req.body)
    const token = setAuthCookies(reply, user)
    reply.send({ user, token })
  })

  typedApp.post('/api/auth/refresh', {
    config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
  }, async (req, reply) => {
    const token = req.cookies?.refreshToken
    if (!token) {
      reply.code(401).send({ error: 'Sesión expirada' })
      return
    }
    let payload: AuthUser & { type?: string }
    try {
      payload = await app.jwt.verify<AuthUser & { type?: string }>(token)
    } catch {
      reply.code(401).send({ error: 'Sesión expirada' })
      return
    }
    if (payload.type !== 'refresh') {
      reply.code(401).send({ error: 'Sesión expirada' })
      return
    }

    const user = await getMe(payload.sub)
    const newToken = setAuthCookies(reply, user)
    reply.send({ user, token: newToken })
  })

  typedApp.post('/api/auth/logout', async (_req, reply) => {
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
