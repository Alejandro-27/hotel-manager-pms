import { z } from 'zod/v4'

export const registerSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  acceptTerms: z.literal(true, {
    error: 'Debes aceptar los términos y la política de privacidad',
  }),
})

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
})

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Nombre requerido').optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
})

// Nuevos esquemas para gestión de solicitudes pendientes (admin del sistema)
export const approveRequestSchema = z.object({
  userId: z.string().min(1, 'ID de usuario requerido'),
  role: z.enum(['admin', 'recepcion']),
  tenantId: z.string().min(1, 'Hotel requerido'),
})

export const rejectRequestSchema = z.object({
  userId: z.string().min(1, 'ID de usuario requerido'),
})

export const createTenantSchema = z.object({
  name: z.string().min(2, 'Nombre del hotel requerido'),
  slug: z.string().min(2, 'Slug requerido').regex(/^[a-z0-9-]+$/, 'Slug inválido (solo minúsculas, números y guiones)'),
})

export const createRecepcionSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type ApproveRequestInput = z.infer<typeof approveRequestSchema>
export type RejectRequestInput = z.infer<typeof rejectRequestSchema>
export type CreateTenantInput = z.infer<typeof createTenantSchema>
export type CreateRecepcionInput = z.infer<typeof createRecepcionSchema>
