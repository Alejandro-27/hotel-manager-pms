import { z } from 'zod/v4'

export const createGuestSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  document: z.string().min(3, 'Documento requerido'),
  country: z.string().length(2, 'País en formato ISO 3166 (2 letras)'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(6, 'Teléfono requerido'),
})

export const updateGuestSchema = createGuestSchema.partial()

export const guestParamsSchema = z.object({
  id: z.string().min(1),
})

export type CreateGuestInput = z.infer<typeof createGuestSchema>
export type UpdateGuestInput = z.infer<typeof updateGuestSchema>
