import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { register, login, buildAuthUser, getMe } from './service.js'
import { registerSchema, loginSchema } from './schemas.js'

export default async function authRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>()

  typedApp.post('/api/auth/register', {
    schema: { body: registerSchema },
  }, async (req, reply) => {
    const user = await register(req.body)
    const token = app.jwt.sign(buildAuthUser(user))
    reply.code(201).send({ user, token })
  })

  typedApp.post('/api/auth/login', {
    schema: { body: loginSchema },
  }, async (req, reply) => {
    const user = await login(req.body)
    const token = app.jwt.sign(buildAuthUser(user))
    reply.send({ user, token })
  })

  typedApp.get('/api/auth/me', { preHandler: [app.authenticate] }, async (req, reply) => {
    const user = await getMe(req.authUser.sub)
    reply.send(user)
  })
}
