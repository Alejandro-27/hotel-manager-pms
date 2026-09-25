import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import type { Product } from '@hotel/types'
import { listProducts, createProduct, updateProduct, deleteProduct, updateStock, createSale, listSales } from './service.js'
import { createProductSchema, updateProductSchema, updateStockSchema, createSaleSchema, productParamsSchema } from './schemas.js'

export default async function posRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>()

  typedApp.get('/api/products', { preHandler: [app.authenticate] }, async (req) => {
    const { category } = req.query as { category?: Product['category'] }
    return listProducts(category)
  })

  typedApp.post('/api/products', {
    preHandler: [app.requireAdmin],
    schema: { body: createProductSchema },
  }, async (req, reply) => {
    const product = await createProduct(req.body)
    reply.code(201).send(product)
  })

  typedApp.patch('/api/products/:id/stock', {
    preHandler: [app.authenticate],
    schema: { params: productParamsSchema, body: updateStockSchema },
  }, async (req) => {
    return updateStock(req.params.id, req.body)
  })

  typedApp.patch('/api/products/:id', {
    preHandler: [app.requireAdmin],
    schema: { params: productParamsSchema, body: updateProductSchema },
  }, async (req) => {
    return updateProduct(req.params.id, req.body)
  })

  typedApp.delete('/api/products/:id', {
    preHandler: [app.requireAdmin],
    schema: { params: productParamsSchema },
  }, async (req, reply) => {
    await deleteProduct(req.params.id)
    reply.code(204).send()
  })

  typedApp.post('/api/sales', {
    preHandler: [app.authenticate],
    schema: { body: createSaleSchema },
  }, async (req, reply) => {
    const sale = await createSale(req.body)
    reply.code(201).send(sale)
  })

  typedApp.get('/api/sales', { preHandler: [app.authenticate] }, async (req) => {
    const { date } = req.query as { date?: string }
    return listSales(date)
  })
}
