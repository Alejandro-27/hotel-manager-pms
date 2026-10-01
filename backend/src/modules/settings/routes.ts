import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { getSettings, updateSettings } from './service.js'
import { updateSettingsSchema } from './schemas.js'

export default async function settingsRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>()

  typedApp.get('/api/settings', { preHandler: [app.authenticate] }, async () => {
    return getSettings()
  })

  typedApp.patch('/api/settings', {
    preHandler: [app.authenticate, app.requireAdmin],
    schema: { body: updateSettingsSchema },
  }, async (req) => {
    return updateSettings(req.body)
  })
}