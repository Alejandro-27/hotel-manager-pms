import { z } from 'zod/v4'

export const updateSettingsSchema = z.object({
  legalName: z.string().max(120).optional(),
  taxId: z.string().max(40).optional(),
  address: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
  email: z.union([z.literal(''), z.string().trim().email('Email inválido')]).optional(),
  jurisdiction: z.string().max(120).optional(),
})

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>