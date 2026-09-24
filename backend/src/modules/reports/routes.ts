import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { getDashboard, getFinancialReport, getOccupancyReport } from './service.js'
import { financialQuerySchema } from './schemas.js'

export default async function reportRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>()

  typedApp.get('/api/reports/dashboard', { preHandler: [app.authenticate] }, async () => {
    return getDashboard()
  })

  typedApp.get('/api/reports/financial', {
    preHandler: [app.requireAdmin],
    schema: { querystring: financialQuerySchema },
  }, async (req) => {
    return getFinancialReport(req.query.months)
  })

  typedApp.get('/api/reports/occupancy', { preHandler: [app.authenticate] }, async () => {
    return getOccupancyReport()
  })
}