import { z } from 'zod/v4'

export const payInvoiceSchema = z.object({
  amount: z.number().positive('El monto debe ser mayor a 0'),
  paymentMethod: z.enum(['efectivo', 'tarjeta', 'transferencia']).optional(),
})

export const invoiceParamsSchema = z.object({
  id: z.string().min(1),
})

export type PayInvoiceInput = z.infer<typeof payInvoiceSchema>
