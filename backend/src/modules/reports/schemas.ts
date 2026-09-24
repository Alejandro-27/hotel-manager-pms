import { z } from 'zod/v4'

export const financialQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(24).default(6),
})