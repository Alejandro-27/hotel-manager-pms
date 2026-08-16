import { z } from 'zod/v4'
import type { ReservationStatus } from '@hotel/types'

export const reservationStatusValues: ReservationStatus[] = ['confirmada', 'checkin', 'checkout', 'cancelada']

export const createReservationSchema = z.object({
  guestId: z.string().min(1),
  roomId: z.string().min(1),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD)'),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD)'),
  guests: z.number().int().min(1),
  paymentMethod: z.enum(['efectivo', 'tarjeta', 'transferencia']),
  advancePayment: z.number().min(0).default(0),
  notes: z.string().default(''),
})

export const reservationParamsSchema = z.object({
  id: z.string().min(1),
})

export type CreateReservationInput = z.infer<typeof createReservationSchema>
