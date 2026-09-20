import { db } from './db'
import type { Song } from '@/types'

function newId(): string {
  return crypto.randomUUID()
}

export interface CreateSongInput {
  title: string
  artist?: string
  originalKey: string
  lyrics: string
}

/** Cria uma música nova a partir da letra colada/digitada (item 7). */
export async function createSong(input: CreateSongInput): Promise<Song> {
  const now = new Date().toISOString()
  const song: Song = {
    id: newId(),
    title: input.title.trim(),
    artist: input.artist?.trim() || undefined,
    originalKey: input.originalKey,
    preferredKey: input.originalKey,
    lyrics: input.lyrics,
    chordData: { chordProSource: input.lyrics, lines: [] },
    tags: [],
    favorite: false,
    timesPlayed: 0,
    createdAt: now,
    updatedAt: now,
  }
  await db.songs.add(song)
  return song
}

export async function updateSong(id: string, changes: Partial<Song>): Promise<void> {
  await db.songs.update(id, { ...changes, updatedAt: new Date().toISOString() })
}

export async function deleteSong(id: string): Promise<void> {
  await db.transaction('rw', db.songs, db.notebookSongs, db.songVersions, db.practiceHistory, async () => {
    await db.songs.delete(id)
    await db.notebookSongs.where('songId').equals(id).delete()
    await db.songVersions.where('songId').equals(id).delete()
    await db.practiceHistory.where('songId').equals(id).delete()
  })
}

export async function toggleFavorite(id: string, favorite: boolean): Promise<void> {
  await updateSong(id, { favorite })
}

export function listSongsQuery() {
  return db.songs.orderBy('title').toArray()
}
