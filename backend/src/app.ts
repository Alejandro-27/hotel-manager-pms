import Fastify from 'fastify'
import cors from '@fastify/cors'
import fastifyCookie from '@fastify/cookie'
import fastifyRateLimit from '@fastify/rate-limit'
import { type ZodTypeProvider, validatorCompiler, serializerCompiler } from 'fastify-type-provider-zod'
import authPlugin from './plugins/auth.js'
import errorHandlerPlugin from './plugins/error-handler.js'
import authRoutes from './modules/auth/routes.js'
import roomRoutes from './modules/rooms/routes.js'
import guestRoutes from './modules/guests/routes.js'
import reservationRoutes from './modules/reservations/routes.js'
import posRoutes from './modules/pos/routes.js'
import billingRoutes from './modules/billing/routes.js'
import reportRoutes from './modules/reports/routes.js'
import { env } from './config/env.js'

export function buildApp() {
  const app = Fastify({
    logger: {
      level: env.nodeEnv === 'production' ? 'info' : 'debug',
      redact: {
        paths: [
          'password',
          '*.password',
          '*.token',
          '*.refreshToken',
          'req.headers.authorization',
          'req.headers.cookie',
          'res.headers["set-cookie"]',
        ],
        censor: '[REDACTED]',
      },
    },
  }).withTypeProvider<ZodTypeProvider>()

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  app.register(cors, {
    origin: (origin, cb) => {
      if (!origin || env.corsOrigin.includes(origin)) {
        cb(null, true)
        return
      }
      cb(new Error('Not allowed by CORS'), false)
    },
    credentials: true,
  })

  app.register(fastifyCookie)

  app.register(errorHandlerPlugin)
  app.register(authPlugin)

  app.register(fastifyRateLimit, {
    global: true,
    max: 300,
    timeWindow: '1 minute',
  })

  app.get('/health', async () => ({ status: 'ok' }))

  app.register(authRoutes)
  app.register(roomRoutes)
  app.register(guestRoutes)
  app.register(reservationRoutes)
  app.register(posRoutes)
  app.register(billingRoutes)
  app.register(reportRoutes)

  return app
}
