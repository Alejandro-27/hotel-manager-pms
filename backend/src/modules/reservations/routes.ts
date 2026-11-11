import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  listReservations, getReservationById, createReservation,
  checkInReservation, checkOutReservation, cancelReservation,
} from './service.js'
import { createReservationSchema, reservationParamsSchema, listReservationsQuerySchema } from './schemas.js'

export default async function reservationRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>()

  typedApp.get('/api/reservations', {
    preHandler: [app.authenticate],
    schema: { querystring: listReservationsQuerySchema },
  }, async (req) => {
    const { status, roomId, guestId } = req.query
    return listReservations(req.authUser.tenantId!, { status, roomId, guestId })
  })

  typedApp.get('/api/reservations/:id', {
    preHandler: [app.authenticate],
    schema: { params: reservationParamsSchema },
  }, async (req) => {
    return getReservationById(req.authUser.tenantId!, req.params.id)
  })

  typedApp.post('/api/reservations', {
    preHandler: [app.authenticate],
    schema: { body: createReservationSchema },
  }, async (req, reply) => {
    const reservation = await createReservation(req.authUser.tenantId!, req.body)
    reply.code(201).send(reservation)
  })

  typedApp.patch('/api/reservations/:id/checkin', {
    preHandler: [app.authenticate],
    schema: { params: reservationParamsSchema },
  }, async (req) => {
    return checkInReservation(req.authUser.tenantId!, req.params.id)
  })

  typedApp.patch('/api/reservations/:id/checkout', {
    preHandler: [app.authenticate],
    schema: { params: reservationParamsSchema },
  }, async (req) => {
    return checkOutReservation(req.authUser.tenantId!, req.params.id)
  })

  typedApp.patch('/api/reservations/:id/cancel', {
    preHandler: [app.authenticate],
    schema: { params: reservationParamsSchema },
  }, async (req) => {
    return cancelReservation(req.authUser.tenantId!, req.params.id)
  })
}
