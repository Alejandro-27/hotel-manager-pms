import type { FastifyInstance } from 'fastify'
import { getDashboard, getFinancialReport, getOccupancyReport } from './service.js'

export default async function reportRoutes(app: FastifyInstance) {
  app.get('/api/reports/dashboard', { preHandler: [app.authenticate] }, async () => {
    return getDashboard()
  })

  app.get('/api/reports/financial', { preHandler: [app.requireAdmin] }, async () => {
    return getFinancialReport()
  })

  app.get('/api/reports/occupancy', { preHandler: [app.authenticate] }, async () => {
    return getOccupancyReport()
  })
}
