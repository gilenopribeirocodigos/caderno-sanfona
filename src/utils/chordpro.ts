import type { ChordData, LyricLine, LyricToken } from '@/types'
import { transposeChord } from './chords'

const SECTION_PREFIX = '## '

/** Converte texto em formato ChordPro (item 37) em linhas estruturadas para renderização. */
export function parseChordPro(source: string): LyricLine[] {
  return source.split('\n').map(parseLine)
}

function parseLine(rawLine: string): LyricLine {
  if (rawLine.startsWith(SECTION_PREFIX)) {
    return { section: rawLine.slice(SECTION_PREFIX.length).trim(), tokens: [] }
  }
  if (rawLine.trim() === '') return { tokens: [] }

  const words = rawLine.trim().split(/\s+/)
  const tokens: LyricToken[] = words.map((word) => {
    const match = /^\[([^\]]+)\](.*)$/.exec(word)
    if (match) return { chord: match[1], text: match[2] }
    return { text: word }
  })
  return { tokens }
}

/** Reconstrói o texto em ChordPro a partir das linhas estruturadas (inverso de parseChordPro). */
export function renderChordPro(lines: LyricLine[]): string {
  return lines
    .map((line) => {
      if (line.section !== undefined) return `${SECTION_PREFIX}${line.section}`
      if (line.tokens.length === 0) return ''
      return line.tokens.map((t) => (t.chord ? `[${t.chord}]${t.text}` : t.text)).join(' ')
    })
    .join('\n')
}

export function buildChordData(source: string): ChordData {
  return { chordProSource: source, lines: parseChordPro(source) }
}

/** Transpõe todos os acordes do texto ChordPro em `semitones` semitons (item 11). */
export function transposeChordProSource(source: string, semitones: number): string {
  if (semitones === 0) return source
  return source.replace(/\[([^\]]+)\]/g, (_, chord: string) => `[${transposeChord(chord, semitones)}]`)
}

/** Extrai só o texto puro da letra, sem colchetes de cifra (para busca/exibição simples). */
export function stripChords(source: string): string {
  return source.replace(/\[[^\]]+\]/g, '')
}

/** Primeiro acorde encontrado no texto, usado como padrão do Modo Sanfona Visual. */
export function firstChord(source: string): string | undefined {
  const match = /\[([^\]]+)\]/.exec(source)
  return match?.[1]
}

/** Todos os acordes distintos usados na música, na ordem em que aparecem. */
export function uniqueChordsInSong(lines: LyricLine[]): string[] {
  const seen = new Set<string>()
  for (const line of lines) {
    for (const token of line.tokens) {
      if (token.chord) seen.add(token.chord)
    }
  }
  return Array.from(seen)
}
