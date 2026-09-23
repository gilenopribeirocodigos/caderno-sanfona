import { db, LOCAL_USER_ID } from './db'
import { queueSyncChange } from './syncQueue'
import type { AppSettings, Notebook, NotebookSong, PracticeHistoryEntry, Song, SongVersion } from '@/types'

const BACKUP_FORMAT = 'caderno-sanfona-backup'
const BACKUP_VERSION = 1

export async function exportBackup(): Promise<void> {
  const [songs, notebooks, notebookSongs, songVersions, practiceHistory, settings] = await Promise.all([
    db.songs.toArray(), db.notebooks.toArray(), db.notebookSongs.toArray(),
    db.songVersions.toArray(), db.practiceHistory.toArray(), db.settings.toArray(),
  ])
  const payload = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: { songs, notebooks, notebookSongs, songVersions, practiceHistory, settings },
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `caderno-sanfona-backup-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function importBackup(file: File): Promise<number> {
  const parsed: unknown = JSON.parse(await file.text())
  if (!isBackup(parsed)) throw new Error('Este arquivo não parece ser um backup válido do Caderno de Sanfona.')
  const { songs, notebooks, notebookSongs, songVersions, practiceHistory, settings } = parsed.data
  await db.transaction('rw', [db.songs, db.notebooks, db.notebookSongs, db.songVersions, db.practiceHistory, db.settings], async () => {
    if (songs.length) await db.songs.bulkPut(songs)
    if (notebooks.length) await db.notebooks.bulkPut(notebooks)
    if (notebookSongs.length) await db.notebookSongs.bulkPut(notebookSongs)
    if (songVersions.length) await db.songVersions.bulkPut(songVersions)
    if (practiceHistory.length) await db.practiceHistory.bulkPut(practiceHistory)
    if (settings.length) await db.settings.bulkPut(settings.map((item) => ({ ...item, userId: LOCAL_USER_ID })))
  })
  for (const item of songs) queueSyncChange('songs', item.id)
  for (const item of notebooks) queueSyncChange('notebooks', item.id)
  for (const item of notebookSongs) queueSyncChange('notebookSongs', item.id)
  for (const item of songVersions) queueSyncChange('songVersions', item.id)
  for (const item of practiceHistory) queueSyncChange('practiceHistory', item.id)
  if (settings.length) queueSyncChange('settings', LOCAL_USER_ID)
  return songs.length
}

type BackupData = {
  songs: Song[]
  notebooks: Notebook[]
  notebookSongs: NotebookSong[]
  songVersions: SongVersion[]
  practiceHistory: PracticeHistoryEntry[]
  settings: AppSettings[]
}

function isBackup(value: unknown): value is { format: string; version: number; data: BackupData } {
  if (!value || typeof value !== 'object') return false
  const backup = value as Record<string, unknown>
  if (backup.format !== BACKUP_FORMAT || backup.version !== BACKUP_VERSION || !backup.data || typeof backup.data !== 'object') return false
  const data = backup.data as Record<string, unknown>
  return ['songs', 'notebooks', 'notebookSongs', 'songVersions', 'practiceHistory', 'settings']
    .every((key) => Array.isArray(data[key]))
}
