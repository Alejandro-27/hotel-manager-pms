import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import type { RoomStatus } from '@hotel/types'
import { listRooms, getRoomById, createRoom, updateRoom, updateRoomStatus } from './service.js'
import { createRoomSchema, updateRoomSchema, updateRoomStatusSchema, roomParamsSchema } from './schemas.js'

export default async function roomRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>()

  typedApp.get('/api/rooms', { preHandler: [app.authenticate] }, async (req) => {
    const { status, type, floor } = req.query as { status?: RoomStatus; type?: 'individual' | 'doble' | 'suite' | 'familiar'; floor?: string }
    return listRooms({
      status,
      type,
      floor: floor !== undefined ? Number(floor) : undefined,
    })
  })

  typedApp.get('/api/rooms/:id', {
    preHandler: [app.authenticate],
    schema: { params: roomParamsSchema },
  }, async (req) => {
    return getRoomById(req.params.id)
  })

  typedApp.post('/api/rooms', {
    preHandler: [app.requireAdmin],
    schema: { body: createRoomSchema },
  }, async (req, reply) => {
    const room = await createRoom(req.body)
    reply.code(201).send(room)
  })

  typedApp.patch('/api/rooms/:id', {
    preHandler: [app.requireAdmin],
    schema: { params: roomParamsSchema, body: updateRoomSchema },
  }, async (req) => {
    return updateRoom(req.params.id, req.body)
  })

  typedApp.patch('/api/rooms/:id/status', {
    preHandler: [app.authenticate],
    schema: { params: roomParamsSchema, body: updateRoomStatusSchema },
  }, async (req) => {
    return updateRoomStatus(req.params.id, req.body)
  })
}
