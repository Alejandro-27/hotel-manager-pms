import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { listGuests, getGuestById, createGuest, updateGuest } from './service.js'
import { createGuestSchema, updateGuestSchema, guestParamsSchema } from './schemas.js'

export default async function guestRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>()

  typedApp.get('/api/guests', { preHandler: [app.authenticate] }, async (req) => {
    const { q } = req.query as { q?: string }
    return listGuests(q)
  })

  typedApp.get('/api/guests/:id', {
    preHandler: [app.authenticate],
    schema: { params: guestParamsSchema },
  }, async (req) => {
    return getGuestById(req.params.id)
  })

  typedApp.post('/api/guests', {
    preHandler: [app.authenticate],
    schema: { body: createGuestSchema },
  }, async (req, reply) => {
    const guest = await createGuest(req.body)
    reply.code(201).send(guest)
  })

  typedApp.patch('/api/guests/:id', {
    preHandler: [app.authenticate],
    schema: { params: guestParamsSchema, body: updateGuestSchema },
  }, async (req) => {
    return updateGuest(req.params.id, req.body)
  })
}
