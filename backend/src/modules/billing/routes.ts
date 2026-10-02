import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { listInvoices, getInvoiceById, payInvoice } from './service.js'
import { payInvoiceSchema, invoiceParamsSchema, listInvoicesQuerySchema } from './schemas.js'

export default async function billingRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>()

  typedApp.get('/api/invoices', {
    preHandler: [app.authenticate],
    schema: { querystring: listInvoicesQuerySchema },
  }, async (req) => {
    const { status, guestId } = req.query
    return listInvoices({ status, guestId })
  })

  typedApp.get('/api/invoices/:id', {
    preHandler: [app.authenticate],
    schema: { params: invoiceParamsSchema },
  }, async (req) => {
    return getInvoiceById(req.params.id)
  })

  typedApp.post('/api/invoices/:id/pay', {
    preHandler: [app.authenticate],
    schema: { params: invoiceParamsSchema, body: payInvoiceSchema },
  }, async (req) => {
    return payInvoice(req.params.id, req.body)
  })
}
