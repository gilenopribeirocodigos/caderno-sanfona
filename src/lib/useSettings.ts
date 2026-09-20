import { useLiveQuery } from 'dexie-react-hooks'
import { db, DEFAULT_SETTINGS, LOCAL_USER_ID } from './db'
import type { AppSettings } from '@/types'

/** Configurações do usuário (item 44), com fallback enquanto o registro padrão não carrega. */
export function useSettings(): AppSettings {
  const settings = useLiveQuery(() => db.settings.get(LOCAL_USER_ID), [])
  return settings ?? DEFAULT_SETTINGS
}
