import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Introduce un email válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Introduce un email válido'),
  hotelName: z.string().optional(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export type RegisterFormData = z.infer<typeof registerSchema>

export const newRoomSchema = z.object({
  number: z.string().min(1, 'Introduce el número de habitación'),
  floor: z.number().min(1, 'Introduce una planta válida'),
  type: z.enum(['individual', 'doble', 'suite', 'familiar']),
  maxCapacity: z.number().min(1, 'Capacidad mínima: 1').max(10, 'Capacidad máxima: 10'),
  pricePerNight: z.number().min(0, 'El precio no puede ser negativo'),
})

export type NewRoomFormData = z.infer<typeof newRoomSchema>

export const reservationSchema = z.object({
  guestId: z.string().min(1, 'Selecciona un huésped'),
  roomId: z.string().min(1, 'Selecciona una habitación'),
  checkIn: z.string().min(1, 'Selecciona fecha de check-in'),
  checkOut: z.string().min(1, 'Selecciona fecha de check-out'),
  guests: z.number().min(1, 'Mínimo 1 huésped').max(10, 'Máximo 10 huéspedes'),
  paymentMethod: z.enum(['efectivo', 'tarjeta', 'transferencia']),
}).refine((data) => data.checkOut > data.checkIn, {
  message: 'La fecha de check-out debe ser posterior al check-in',
  path: ['checkOut'],
})

export type ReservationFormData = z.infer<typeof reservationSchema>

export const productFormSchema = z.object({
  name: z.string().trim().min(2, 'Introduce un nombre válido (mínimo 2 caracteres)'),
  category: z.enum(['desayunos', 'snacks', 'bebidas']),
  price: z.string().refine(
    (v) => v.trim() !== '' && !Number.isNaN(Number(v)) && Number(v) >= 0,
    'Introduce un precio válido'
  ),
  currentStock: z.string().refine(
    (v) => v.trim() !== '' && Number.isInteger(Number(v)) && Number(v) >= 0,
    'El stock actual debe ser un número entero no negativo'
  ),
  minStock: z.string().refine(
    (v) => v.trim() !== '' && Number.isInteger(Number(v)) && Number(v) >= 0,
    'El stock mínimo debe ser un número entero no negativo'
  ),
})

export type ProductFormData = z.infer<typeof productFormSchema>
