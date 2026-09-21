import type { ChordNotation } from '@/types'

// Notas cromáticas em sustenidos, usadas como representação interna (item 8).
export const CHROMATIC_SHARP = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
] as const

export const CHROMATIC_FLAT = [
  'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B',
] as const

// Notação brasileira (item 8).
const BRAZILIAN_NAMES: Record<string, string> = {
  C: 'Dó', 'C#': 'Dó#', Db: 'Réb', D: 'Ré', 'D#': 'Ré#', Eb: 'Mib',
  E: 'Mi', F: 'Fá', 'F#': 'Fá#', Gb: 'Solb', G: 'Sol', 'G#': 'Sol#',
  Ab: 'Láb', A: 'Lá', 'A#': 'Lá#', Bb: 'Sib', B: 'Si',
}

const BRAZILIAN_TO_INTERNATIONAL: Record<string, string> = Object.fromEntries(
  Object.entries(BRAZILIAN_NAMES).map(([intl, br]) => [br, intl]),
)

export const COMMON_CHORD_QUALITIES = [
  '', 'm', '7', 'maj7', 'm7', '9', 'dim', 'aug', 'sus2', 'sus4', '6', 'm6',
]

export const COMMON_ROOTS = CHROMATIC_SHARP

/** Acordes sugeridos para os graus da tonalidade maior (paleta rápida, item 10). */
const MAJOR_SCALE_DEGREE_OFFSETS = [0, 2, 4, 5, 7, 9, 11]
const MAJOR_SCALE_DEGREE_QUALITY = ['', 'm', 'm', '', '', 'm', 'dim']
const DEGREE_LABELS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']

export interface ParsedChord {
  root: string
  quality: string
  bass?: string // acorde com baixo diferente, ex: C/E
}

const CHORD_REGEX = /^([A-G])(#|b)?((?:maj7|m7|m6|dim|aug|sus2|sus4|add9|maj9|m9|[0-9]|m)*)(?:\/([A-G])(#|b)?)?$/

export function parseChord(chord: string): ParsedChord | null {
  const trimmed = chord.trim()
  const match = CHORD_REGEX.exec(trimmed)
  if (!match) return null
  const [, rootLetter, rootAccidental, quality, bassLetter, bassAccidental] = match
  const root = normalizeToSharp(`${rootLetter}${rootAccidental ?? ''}`)
  const bass = bassLetter ? normalizeToSharp(`${bassLetter}${bassAccidental ?? ''}`) : undefined
  return { root, quality, bass }
}

function normalizeToSharp(note: string): string {
  const flatIndex = CHROMATIC_FLAT.indexOf(note as (typeof CHROMATIC_FLAT)[number])
  if (flatIndex !== -1) return CHROMATIC_SHARP[flatIndex]
  return note
}

/** Transpõe um único acorde em `semitones` semitons (item 11). */
export function transposeChord(chord: string, semitones: number): string {
  const parsed = parseChord(chord)
  if (!parsed) return chord
  const shift = (i: number) => (i + semitones + 120) % 12
  const rootIndex = CHROMATIC_SHARP.indexOf(parsed.root as (typeof CHROMATIC_SHARP)[number])
  if (rootIndex === -1) return chord
  const newRoot = CHROMATIC_SHARP[shift(rootIndex)]
  let result = `${newRoot}${parsed.quality}`
  if (parsed.bass) {
    const bassIndex = CHROMATIC_SHARP.indexOf(parsed.bass as (typeof CHROMATIC_SHARP)[number])
    if (bassIndex !== -1) result += `/${CHROMATIC_SHARP[shift(bassIndex)]}`
  }
  return result
}

export function semitonesBetweenKeys(fromKey: string, toKey: string): number {
  const from = parseChord(fromKey)
  const to = parseChord(toKey)
  if (!from || !to) return 0
  const fromIndex = CHROMATIC_SHARP.indexOf(from.root as (typeof CHROMATIC_SHARP)[number])
  const toIndex = CHROMATIC_SHARP.indexOf(to.root as (typeof CHROMATIC_SHARP)[number])
  if (fromIndex === -1 || toIndex === -1) return 0
  return toIndex - fromIndex
}

/** Converte um acorde para exibição, respeitando a notação escolhida (item 8). */
export function formatChordForDisplay(chord: string, notation: ChordNotation): string {
  if (notation === 'international') return chord
  const parsed = parseChord(chord)
  if (!parsed) return chord
  const rootBr = BRAZILIAN_NAMES[parsed.root] ?? parsed.root
  let result = `${rootBr}${parsed.quality}`
  if (parsed.bass) {
    const bassBr = BRAZILIAN_NAMES[parsed.bass] ?? parsed.bass
    result += `/${bassBr}`
  }
  return result
}

/** Converte um acorde digitado pelo usuário (BR ou internacional) para forma interna. */
export function parseUserInputChord(input: string): string {
  const trimmed = input.trim()
  for (const [br, intl] of Object.entries(BRAZILIAN_TO_INTERNATIONAL)) {
    if (trimmed.startsWith(br)) {
      return intl + trimmed.slice(br.length)
    }
  }
  return trimmed
}

/** Paleta rápida de acordes prováveis para uma tonalidade maior (item 10). */
export function quickPaletteForKey(key: string): { label: string; chord: string }[] {
  const parsed = parseChord(key)
  if (!parsed) return []
  const rootIndex = CHROMATIC_SHARP.indexOf(parsed.root as (typeof CHROMATIC_SHARP)[number])
  if (rootIndex === -1) return []
  return MAJOR_SCALE_DEGREE_OFFSETS.map((offset, i) => {
    const noteIndex = (rootIndex + offset) % 12
    return {
      label: DEGREE_LABELS[i],
      chord: `${CHROMATIC_SHARP[noteIndex]}${MAJOR_SCALE_DEGREE_QUALITY[i]}`,
    }
  })
}

/**
 * Intervalos (em semitons a partir da fundamental) de cada qualidade de
 * acorde suportada — usado tanto para montar as notas de um acorde
 * conhecido quanto, ao contrário, para reconhecer um acorde a partir de
 * notas soltas (ver `chordFromNotes`).
 */
const QUALITY_INTERVALS: Record<string, number[]> = {
  '': [0, 4, 7],
  m: [0, 3, 7],
  '7': [0, 4, 7, 10],
  m7: [0, 3, 7, 10],
  maj7: [0, 4, 7, 11],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  '6': [0, 4, 7, 9],
  m6: [0, 3, 7, 9],
  '9': [0, 4, 7, 10, 14],
}

/** Notas que compõem um acorde, usadas nos diagramas de baixo/teclado (itens 60/70). */
export function notesInChord(chord: string): string[] {
  const parsed = parseChord(chord)
  if (!parsed) return []
  const rootIndex = CHROMATIC_SHARP.indexOf(parsed.root as (typeof CHROMATIC_SHARP)[number])
  if (rootIndex === -1) return []
  const intervals = QUALITY_INTERVALS[parsed.quality] ?? QUALITY_INTERVALS['']
  return intervals.map((i) => CHROMATIC_SHARP[(rootIndex + i) % 12])
}

// Qualidades preferidas ao reconhecer notas soltas: mais simples primeiro,
// para não sugerir "C6" quando "C" já explica as mesmas notas mais uma.
const RECOGNITION_QUALITY_ORDER = ['', 'm', 'dim', 'aug', 'sus2', 'sus4', '7', 'm7', 'maj7', '6', 'm6', '9']

/**
 * Tenta reconhecer um acorde a partir de um conjunto solto de notas (ex:
 * tocadas uma a uma no teclado), sem se importar com ordem ou oitava —
 * é o inverso de `notesInChord`. Retorna o primeiro acorde cujas notas
 * batem exatamente com as informadas, ou undefined se nenhuma bater.
 */
export function chordFromNotes(notes: string[]): string | undefined {
  const uniqueInput = new Set(
    notes
      .map((n) => normalizeToSharp(n))
      .filter((n) => (CHROMATIC_SHARP as readonly string[]).includes(n)),
  )
  if (uniqueInput.size < 2) return undefined

  for (const root of CHROMATIC_SHARP) {
    const rootIndex = CHROMATIC_SHARP.indexOf(root)
    for (const quality of RECOGNITION_QUALITY_ORDER) {
      const chordNotes = new Set<string>(
        QUALITY_INTERVALS[quality].map((i) => CHROMATIC_SHARP[(rootIndex + i) % 12]),
      )
      if (chordNotes.size !== uniqueInput.size) continue
      let matches = true
      for (const n of uniqueInput) {
        if (!chordNotes.has(n)) {
          matches = false
          break
        }
      }
      if (matches) return `${root}${quality}`
    }
  }
  return undefined
}
