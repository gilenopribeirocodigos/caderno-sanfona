import { db } from './db'
import type { ChordData, Song } from '@/types'
import { buildChordData, stripChords, transposeChordProSource } from '@/utils/chordpro'
import { semitonesBetweenKeys } from '@/utils/chords'

function newId(): string {
  return crypto.randomUUID()
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
  })
}
