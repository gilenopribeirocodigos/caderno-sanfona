import { db, deletionId } from './db'
import type { ChordData, Song, SongVersion } from '@/types'
import { buildChordData, stripChords, transposeChordProSource } from '@/utils/chordpro'
import { semitonesBetweenKeys } from '@/utils/chords'
import { queueSyncChange, removePendingChange } from './syncQueue'

function newId(): string {
  return crypto.randomUUID()
}

export function normalizedIdentity(value?: string): string {
  return (value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR')
}

export class DuplicateSongError extends Error {
  constructor(public readonly existingSongId: string) {
    super('Esta música já está na Biblioteca. Abra a música existente para continuar a edição.')
  }
}

export async function findDuplicateSong(title: string, artist?: string): Promise<Song | undefined> {
  const titleKey = normalizedIdentity(title)
  const artistKey = normalizedIdentity(artist)
  return db.songs.filter((song) =>
    normalizedIdentity(song.title) === titleKey && normalizedIdentity(song.artist) === artistKey,
  ).first()
}

export interface SongDetailsInput {
  title: string
  artist?: string
  originalKey: string
  rhythm?: string
  difficulty?: Song['difficulty']
  tags: string[]
  notes?: string
}

export interface CreateSongInput extends SongDetailsInput {
  lyrics: string
}

/** Cria uma música nova a partir da letra colada/digitada (item 7). */
export async function createSong(input: CreateSongInput): Promise<Song> {
  return db.transaction('rw', db.songs, async () => {
    const existing = await findDuplicateSong(input.title, input.artist)
    if (existing) throw new DuplicateSongError(existing.id)
    const now = new Date().toISOString()
    const song: Song = {
      id: newId(),
      title: input.title.trim(),
      artist: input.artist?.trim() || undefined,
      originalKey: input.originalKey,
      preferredKey: input.originalKey,
      lyrics: input.lyrics,
      chordData: { chordProSource: input.lyrics, lines: [] },
      rhythm: input.rhythm?.trim() || undefined,
      difficulty: input.difficulty,
      tags: input.tags,
      notes: input.notes?.trim() || undefined,
      favorite: false,
      timesPlayed: 0,
      createdAt: now,
      updatedAt: now,
    }
    await db.songs.add(song)
    return song
  }).then((song) => {
    queueSyncChange('songs', song.id)
    return song
  })
}

/** Atualiza só os dados cadastrais da música (item 4), sem mexer na letra/cifra. */
export async function updateSongDetails(id: string, input: SongDetailsInput): Promise<void> {
  await updateSong(id, {
    title: input.title.trim(),
    artist: input.artist?.trim() || undefined,
    originalKey: input.originalKey,
    rhythm: input.rhythm?.trim() || undefined,
    difficulty: input.difficulty,
    tags: input.tags,
    notes: input.notes?.trim() || undefined,
  })
}

export function parseTagsInput(raw: string): string[] {
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

export async function updateSong(id: string, changes: Partial<Song>): Promise<void> {
  await db.songs.update(id, { ...changes, updatedAt: new Date().toISOString() })
  queueSyncChange('songs', id)
}

export async function deleteSong(id: string): Promise<void> {
  const markerId = deletionId('songs', id)
  await db.transaction('rw', db.songs, db.notebookSongs, db.songVersions, db.practiceHistory, db.syncDeletions, async () => {
    await db.syncDeletions.put({ id: markerId, table: 'songs', recordId: id, deletedAt: new Date().toISOString() })
    await db.songs.delete(id)
    await db.notebookSongs.where('songId').equals(id).delete()
    await db.songVersions.where('songId').equals(id).delete()
    await db.practiceHistory.where('songId').equals(id).delete()
  })
  removePendingChange({ table: 'songs', id })
  queueSyncChange('syncDeletions', markerId)
}

export async function toggleFavorite(id: string, favorite: boolean): Promise<void> {
  await updateSong(id, { favorite })
}

export function listSongsQuery() {
  return db.songs.orderBy('title').toArray()
}

/** Define a letra inicial da música (item 7, passo 5) e gera o chordData sem cifras ainda. */
export async function setInitialLyrics(id: string, lyrics: string): Promise<void> {
  await updateSong(id, { lyrics, chordData: buildChordData(lyrics) })
}

/** Salva o texto ChordPro editado (cifras inseridas/movidas/removidas, item 8-9). */
export async function saveChordData(id: string, chordData: ChordData): Promise<void> {
  await updateSong(id, { lyrics: stripChords(chordData.chordProSource), chordData })
}

/** Transpõe a música para um novo tom, recalculando toda a cifra (item 11). */
export async function transposeSongToKey(song: Song, newKey: string): Promise<void> {
  const semitones = semitonesBetweenKeys(song.preferredKey, newKey)
  if (semitones === 0) return
  const newSource = transposeChordProSource(song.chordData.chordProSource, semitones)
  await updateSong(song.id, { preferredKey: newKey, chordData: buildChordData(newSource) })
}

export async function transposeSongBySemitones(song: Song, delta: number): Promise<void> {
  const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const currentIndex = CHROMATIC.indexOf(song.preferredKey)
  if (currentIndex === -1) return
  const newKey = CHROMATIC[(currentIndex + delta + 120) % 12]
  await transposeSongToKey(song, newKey)
}

/** Registra uma sessão de prática (item 29), incrementando o contador de execuções. */
export async function registerPractice(id: string): Promise<void> {
  const song = await db.songs.get(id)
  if (!song) return
  await db.songs.update(id, {
    timesPlayed: song.timesPlayed + 1,
    lastPracticedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
  queueSyncChange('songs', id)
}

export async function restoreSongVersion(songId: string, versionId: string): Promise<void> {
  const [song, version] = await Promise.all([db.songs.get(songId), db.songVersions.get(versionId)])
  if (!song || !version || version.songId !== songId) throw new Error('Esta versão não está mais disponível.')
  const now = new Date().toISOString()
  const currentCopy: SongVersion = {
    id: newId(),
    songId,
    name: `Cópia antes de restaurar · ${new Date(now).toLocaleString('pt-BR')}`,
    key: song.preferredKey,
    lyrics: song.lyrics,
    chordData: song.chordData,
    createdAt: now,
  }
  await db.transaction('rw', [db.songs, db.songVersions], async () => {
    await db.songVersions.add(currentCopy)
    await db.songs.update(songId, {
      preferredKey: version.key,
      lyrics: version.lyrics,
      chordData: version.chordData,
      updatedAt: now,
    })
  })
  queueSyncChange('songs', songId)
  queueSyncChange('songVersions', currentCopy.id)
}
