import { db, LOCAL_USER_ID } from './db'
import type { AppSettings } from '@/types'

export async function updateSettings(changes: Partial<AppSettings>): Promise<void> {
  await db.settings.update(LOCAL_USER_ID, changes)
}
