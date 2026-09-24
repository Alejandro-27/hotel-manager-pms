import { z } from 'zod/v4'

export const createExpenseSchema = z.object({
  category: z.enum(['mantenimiento', 'limpieza', 'servicios', 'nominas', 'otros']),
  amount: z.number().nonnegative(),
  date: z.string().min(1, 'Fecha requerida'),
  note: z.string().default(''),
})

export const expenseParamsSchema = z.object({
  id: z.string().min(1),
})

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>