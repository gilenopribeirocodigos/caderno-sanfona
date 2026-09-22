import { db, LOCAL_USER_ID } from './db'
import type { AppSettings } from '@/types'
import { queueSyncChange } from './syncQueue'

export async function updateSettings(changes: Partial<AppSettings>): Promise<void> {
  await db.settings.update(LOCAL_USER_ID, changes)
  queueSyncChange('settings', LOCAL_USER_ID)
}
