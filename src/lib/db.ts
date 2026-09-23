import Dexie, { type EntityTable } from 'dexie'
import type {
  Song,
  Notebook,
  NotebookSong,
  SongVersion,
  PracticeHistoryEntry,
  AppSettings,
} from '@/types'

export type DeletableTable = 'songs' | 'notebooks' | 'notebook_songs'

export interface SyncDeletion {
  id: string
  table: DeletableTable
  recordId: string
  deletedAt: string
}

export function deletionId(table: DeletableTable, recordId: string): string {
  return `${table}:${recordId}`
}

/**
 * Banco local no navegador (IndexedDB), espelhando o modelo de dados da
 * seção 44 da especificação. É a fonte da verdade enquanto não há login
 * (Fases 1-3); a sincronização com o Supabase entra na Fase 4 (Etapa 11).
 */
class CadernoSanfonaDB extends Dexie {
  songs!: EntityTable<Song, 'id'>
  notebooks!: EntityTable<Notebook, 'id'>
  notebookSongs!: EntityTable<NotebookSong, 'id'>
  songVersions!: EntityTable<SongVersion, 'id'>
  practiceHistory!: EntityTable<PracticeHistoryEntry, 'id'>
  settings!: EntityTable<AppSettings, 'userId'>
  syncDeletions!: EntityTable<SyncDeletion, 'id'>

  constructor() {
    super('caderno-sanfona')
    this.version(1).stores({
      songs: 'id, title, artist, favorite, lastPracticedAt, timesPlayed, createdAt, *tags',
      notebooks: 'id, name, createdAt',
      notebookSongs: 'id, notebookId, songId, [notebookId+position]',
      songVersions: 'id, songId, createdAt',
      practiceHistory: 'id, songId, date',
      settings: 'userId',
    })
    this.version(2).stores({
      songs: 'id, title, artist, favorite, lastPracticedAt, timesPlayed, createdAt, *tags',
      notebooks: 'id, name, createdAt',
      notebookSongs: 'id, notebookId, songId, [notebookId+position]',
      songVersions: 'id, songId, createdAt',
      practiceHistory: 'id, songId, date',
      settings: 'userId',
      syncDeletions: 'id, table, recordId, deletedAt',
    })
  }
}

export const db = new CadernoSanfonaDB()

export const LOCAL_USER_ID = 'local'

export const DEFAULT_SETTINGS: AppSettings = {
  userId: LOCAL_USER_ID,
  notation: 'international',
  fontSize: 18,
  chordSize: 18,
  theme: 'light',
  autoScrollSpeed: 0,
  accordionType: '120',
  helpLevel: 'iniciante',
  externalControllerMapping: {},
}

export async function ensureDefaultSettings(): Promise<AppSettings> {
  const existing = await db.settings.get(LOCAL_USER_ID)
  if (existing) return existing
  await db.settings.put(DEFAULT_SETTINGS)
  return DEFAULT_SETTINGS
}
