// Modelo de dados alinhado à seção 44 da especificação (songs, notebooks,
// notebook_songs, song_versions, practice_history, settings), pensado para
// espelhar 1:1 as tabelas do Supabase quando a sincronização em nuvem
// (Fase 4) for implementada.

export type ChordNotation = 'international' | 'brazilian'
export type Theme = 'light' | 'dark'
export type AccordionType = '12' | '48' | '80' | '96' | '120'
export type HelpLevel = 'iniciante' | 'intermediario' | 'avancado'

/** Um segmento de linha da letra: texto opcionalmente precedido por um acorde. */
export interface LyricToken {
  chord?: string
  text: string
}

export interface LyricLine {
  section?: string // Introdução, Verso, Refrão, Ponte... (item 21)
  tokens: LyricToken[]
}

/**
 * Representação estruturada da música, derivada do texto em formato
 * ChordPro (item 37). `chordProSource` é a fonte da verdade editável;
 * `lines` é recalculado a partir dela para renderização/transposição.
 */
export interface ChordData {
  chordProSource: string
  lines: LyricLine[]
}

export interface Song {
  id: string
  userId?: string
  title: string
  artist?: string
  originalKey: string
  preferredKey: string
  lyrics: string
  chordData: ChordData
  bpm?: number
  rhythm?: string
  timeSignature?: string
  difficulty?: 'facil' | 'medio' | 'dificil'
  notes?: string
  tags: string[]
  favorite: boolean
  lastPracticedAt?: string
  timesPlayed: number
  createdAt: string
  updatedAt: string
}

export interface SongVersion {
  id: string
  songId: string
  name: string
  key: string
  lyrics: string
  chordData: ChordData
  createdAt: string
}

export interface Notebook {
  id: string
  userId?: string
  name: string
  description?: string
  createdAt: string
}

export interface NotebookSong {
  id: string
  notebookId: string
  songId: string
  position: number
}

export interface PracticeHistoryEntry {
  id: string
  songId: string
  date: string
  durationSeconds?: number
  bpm?: number
  notes?: string
}

export interface ExternalControllerMapping {
  next?: string
  previous?: string
  toggleScroll?: string
  goToStart?: string
}

export interface AppSettings {
  userId: string // 'local' enquanto não há login (Fase 1-3)
  notation: ChordNotation
  fontSize: number
  chordSize: number
  theme: Theme
  autoScrollSpeed: number // 0 = desligado
  accordionType: AccordionType
  helpLevel: HelpLevel
  externalControllerMapping: ExternalControllerMapping
}
