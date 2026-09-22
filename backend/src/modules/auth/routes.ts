import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { register, login, buildAuthUser, getMe } from './service.js'
import { registerSchema, loginSchema } from './schemas.js'
import { env } from '../../config/env.js'

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.nodeEnv === 'production',
  path: '/',
  maxAge: 7 * 24 * 60 * 60,
}

export default async function authRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>()

  typedApp.post('/api/auth/register', {
    config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
    schema: { body: registerSchema },
  }, async (req, reply) => {
    const user = await register(req.body)
    const token = app.jwt.sign(buildAuthUser(user))
    reply.setCookie('token', token, cookieOptions)
    reply.code(201).send({ user, token })
  })

  typedApp.post('/api/auth/login', {
    config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
    schema: { body: loginSchema },
  }, async (req, reply) => {
    const user = await login(req.body)
    const token = app.jwt.sign(buildAuthUser(user))
    reply.setCookie('token', token, cookieOptions)
    reply.send({ user, token })
  })

  typedApp.post('/api/auth/logout', async (_req, reply) => {
    reply.clearCookie('token', { path: '/' })
    reply.send({ ok: true })
  })

  typedApp.get('/api/auth/me', { preHandler: [app.authenticate] }, async (req, reply) => {
    const user = await getMe(req.authUser.sub)
    reply.send(user)
  })
}
