import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { listExpenses, createExpense, deleteExpense } from './service.js'
import { createExpenseSchema, expenseParamsSchema } from './schemas.js'

export default async function expenseRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>()

  typedApp.get('/api/expenses', { preHandler: [app.authenticate] }, async (req) => {
    return listExpenses(req.authUser.tenantId!)
  })

  typedApp.post('/api/expenses', {
    preHandler: [app.requireAdmin],
    schema: { body: createExpenseSchema },
  }, async (req, reply) => {
    const expense = await createExpense(req.authUser.tenantId!, req.body)
    reply.code(201).send(expense)
  })

  typedApp.delete('/api/expenses/:id', {
    preHandler: [app.requireAdmin],
    schema: { params: expenseParamsSchema },
  }, async (req, reply) => {
    await deleteExpense(req.authUser.tenantId!, req.params.id)
    reply.code(204).send()
  })
}
