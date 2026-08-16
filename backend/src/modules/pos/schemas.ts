import { z } from 'zod/v4'

export const createProductSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  category: z.enum(['desayunos', 'snacks', 'bebidas']),
  price: z.number().nonnegative(),
  currentStock: z.number().int().min(0).default(0),
  minStock: z.number().int().min(0).default(0),
  image: z.string().default(''),
})

export const updateStockSchema = z.object({
  currentStock: z.number().int().min(0),
})

export const productParamsSchema = z.object({
  id: z.string().min(1),
})

export const saleItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1),
  unitPrice: z.number().nonnegative(),
})

export const createSaleSchema = z.object({
  items: z.array(saleItemSchema).min(1, 'Debe incluir al menos un item'),
  paymentMethod: z.enum(['efectivo', 'tarjeta', 'cargo_habitacion']),
  roomId: z.string().nullable().optional(),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateStockInput = z.infer<typeof updateStockSchema>
export type CreateSaleInput = z.infer<typeof createSaleSchema>
