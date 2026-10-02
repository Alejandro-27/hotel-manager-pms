import { z } from 'zod/v4'

function optionalText<T extends z.ZodType<string>>(schema: T) {
  return z.union([z.literal(''), schema]).optional()
}

export const createGuestSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  document: z.string().min(3, 'Documento requerido'),
  country: optionalText(z.string().trim().length(2, 'País en formato ISO 3166 (2 letras)')),
  email: optionalText(z.string().trim().email('Email inválido')),
  phone: optionalText(z.string().trim().min(6, 'Teléfono requerido')),
})

export const updateGuestSchema = createGuestSchema.partial()

export const guestParamsSchema = z.object({
  id: z.string().min(1),
})

export const listGuestsQuerySchema = z.object({
  q: z.string().max(120).optional(),
})

export type CreateGuestInput = z.infer<typeof createGuestSchema>
export type UpdateGuestInput = z.infer<typeof updateGuestSchema>