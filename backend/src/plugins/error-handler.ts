import fp from 'fastify-plugin'
import type { FastifyReply, FastifyRequest } from 'fastify'

export class AppError extends Error {
  statusCode: number
  details?: unknown

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message)
    this.statusCode = statusCode
    this.details = details
  }
}

export default fp(async (app) => {
  app.setErrorHandler((error: Error, req: FastifyRequest, reply: FastifyReply) => {
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({
        error: error.message,
        ...(error.details !== undefined ? { details: error.details } : {}),
      })
    }

    if ('validation' in error) {
      return reply.code(400).send({
        error: 'Datos inválidos',
        details: (error as { validation: unknown }).validation,
      })
    }

    req.log.error(error)
    reply.code(500).send({ error: 'Error interno del servidor' })
  })
})
