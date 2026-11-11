import { eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { settings } from '../../db/schema.js'
import { AppError } from '../../plugins/error-handler.js'
import type { UpdateSettingsInput } from './schemas.js'

export async function getSettings(tenantId: string) {
  const row = (await db.select().from(settings).where(eq(settings.tenantId, tenantId)).limit(1))[0]
  if (!row) throw new AppError(500, 'Configuración no inicializada')
  return row
}

export async function updateSettings(tenantId: string, input: UpdateSettingsInput) {
  await getSettings(tenantId)
  await db.update(settings)
    .set({ ...input, updatedAt: new Date().toISOString() })
    .where(eq(settings.tenantId, tenantId))
  return getSettings(tenantId)
}
