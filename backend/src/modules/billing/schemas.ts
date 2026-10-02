import { z } from 'zod/v4'

export const payInvoiceSchema = z.object({
  amount: z.number().positive('El monto debe ser mayor a 0'),
  paymentMethod: z.enum(['efectivo', 'tarjeta', 'transferencia']).optional(),
})

export const invoiceParamsSchema = z.object({
  id: z.string().min(1),
})

export const listInvoicesQuerySchema = z.object({
  status: z.enum(['pagada', 'parcial', 'pendiente']).optional(),
  guestId: z.string().optional(),
})

export type PayInvoiceInput = z.infer<typeof payInvoiceSchema>
