import { eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { settings } from '../../db/schema.js'
import { AppError } from '../../plugins/error-handler.js'
import type { UpdateSettingsInput } from './schemas.js'

const MAIN_ROW = 'main'

export async function getSettings() {
  const row = (await db.select().from(settings).where(eq(settings.id, MAIN_ROW)).limit(1))[0]
  if (!row) throw new AppError(500, 'Configuración no inicializada')
  return row
}

export async function updateSettings(input: UpdateSettingsInput) {
  await getSettings()
  await db.update(settings)
    .set({ ...input, updatedAt: new Date().toISOString() })
    .where(eq(settings.id, MAIN_ROW))
  return getSettings()
}