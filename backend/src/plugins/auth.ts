import fp from 'fastify-plugin'
import fastifyJwt from '@fastify/jwt'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { env } from '../config/env.js'

export interface AuthUser {
  sub: string
  email: string
  name: string
  role: string
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
    requireAdmin: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
  interface FastifyRequest {
    authUser: AuthUser
  }
}

export default fp(async (app) => {
  await app.register(fastifyJwt, {
    secret: env.jwtSecret,
    sign: { expiresIn: env.jwtExpiresIn },
  })

  app.decorate('authenticate', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const token =
        req.cookies?.token ??
        (req.headers.authorization?.startsWith('Bearer ')
          ? req.headers.authorization.slice(7)
          : null)

      if (!token) {
        reply.code(401).send({ error: 'No autorizado' })
        return
      }

      const payload = await app.jwt.verify<AuthUser>(token)
      req.authUser = {
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role,
      }
    } catch {
      reply.code(401).send({ error: 'No autorizado' })
    }
  })

  app.decorate('requireAdmin', async (req: FastifyRequest, reply: FastifyReply) => {
    await app.authenticate(req, reply)
    if (reply.sent) return
    if (req.authUser.role !== 'admin') {
      reply.code(403).send({ error: 'Requiere rol de administrador' })
    }
  })
})
