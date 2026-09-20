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

/** Notas que compõem um acorde, usadas nos diagramas de baixo/teclado (itens 60/70). */
export function notesInChord(chord: string): string[] {
  const parsed = parseChord(chord)
  if (!parsed) return []
  const rootIndex = CHROMATIC_SHARP.indexOf(parsed.root as (typeof CHROMATIC_SHARP)[number])
  if (rootIndex === -1) return []

  let intervals: number[]
  switch (parsed.quality) {
    case 'm':
      intervals = [0, 3, 7]
      break
    case '7':
      intervals = [0, 4, 7, 10]
      break
    case 'm7':
      intervals = [0, 3, 7, 10]
      break
    case 'maj7':
      intervals = [0, 4, 7, 11]
      break
    case 'dim':
      intervals = [0, 3, 6]
      break
    case 'aug':
      intervals = [0, 4, 8]
      break
    case 'sus2':
      intervals = [0, 2, 7]
      break
    case 'sus4':
      intervals = [0, 5, 7]
      break
    case '6':
      intervals = [0, 4, 7, 9]
      break
    case 'm6':
      intervals = [0, 3, 7, 9]
      break
    case '9':
      intervals = [0, 4, 7, 10, 14]
      break
    default:
      intervals = [0, 4, 7]
  }
  return intervals.map((i) => CHROMATIC_SHARP[(rootIndex + i) % 12])
}
