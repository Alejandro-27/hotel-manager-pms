import { z } from 'zod/v4'
import type { RoomStatus } from '@hotel/types'

export const roomStatusValues = ['libre', 'ocupada', 'mantenimiento', 'limpieza'] as const satisfies readonly RoomStatus[]

export const createRoomSchema = z.object({
  number: z.string().min(1, 'Número requerido'),
  floor: z.number().int().min(0),
  type: z.enum(['individual', 'doble', 'suite', 'familiar']),
  maxCapacity: z.number().int().min(1),
  pricePerNight: z.number().positive(),
})

export const updateRoomSchema = z.object({
  number: z.string().min(1).optional(),
  floor: z.number().int().min(0).optional(),
  type: z.enum(['individual', 'doble', 'suite', 'familiar']).optional(),
  maxCapacity: z.number().int().min(1).optional(),
  pricePerNight: z.number().positive().optional(),
})

export const updateRoomStatusSchema = z.object({
  status: z.enum(roomStatusValues),
})

export const roomParamsSchema = z.object({
  id: z.string().min(1),
})

export type CreateRoomInput = z.infer<typeof createRoomSchema>
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>
export type UpdateRoomStatusInput = z.infer<typeof updateRoomStatusSchema>
