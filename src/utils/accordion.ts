import { CHROMATIC_SHARP, parseChord } from './chords'
import type { AccordionType } from '@/types'

/**
 * Fundamentais do Stradella de 120 baixos, de cima para baixo no
 * instrumento. Há 20 posições físicas; as oito das extremidades repetem
 * notas enarmônicas para manter as tonalidades usuais perto do centro.
 * Lendo de baixo para cima, cada botão avança uma quinta.
 */
const ROOTS_120_TOP_TO_BOTTOM = [
  'A#', 'D#', 'G#', 'C#', 'F#', 'B', 'E', 'A', 'D', 'G',
  'C', 'F', 'A#', 'D#', 'G#', 'C#', 'F#', 'B', 'E', 'A',
]

export const BASS_ROWS_120 = ['Contra', 'Baixo', 'Maior', 'Menor', 'Sétima', 'Diminuto'] as const
export const BASS_ROWS_80 = ['Contra', 'Baixo', 'Maior', 'Menor', 'Sétima'] as const

export function columnsFor(type: AccordionType): string[] {
  if (type === '120') return ROOTS_120_TOP_TO_BOTTOM
  if (type === '96' || type === '80') return ROOTS_120_TOP_TO_BOTTOM.slice(2, 18)
  if (type === '48') return ROOTS_120_TOP_TO_BOTTOM.slice(4, 16)
  return ROOTS_120_TOP_TO_BOTTOM.slice(7, 13)
}

export function rowsFor(type: AccordionType): readonly string[] {
  if (type === '120' || type === '96') return BASS_ROWS_120
  if (type === '80') return BASS_ROWS_80
  if (type === '48') return ['Baixo', 'Maior', 'Menor', 'Sétima'] as const
  return ['Baixo', 'Maior'] as const
}

export interface HighlightedButton {
  row: number
  col: number
  kind: 'bass' | 'chord'
}

/** Determina quais botões do baixo destacar para o acorde atual (itens 58, 66-67). */
export function getHighlightedButtons(
  chord: string | undefined,
  type: AccordionType,
): HighlightedButton[] {
  if (!chord) return []
  const parsed = parseChord(chord)
  if (!parsed) return []

  const columns = columnsFor(type)
  const rows = rowsFor(type)
  const matchingColumns = columns
    .map((root, col) => ({ root, col }))
    .filter(({ root }) => root === parsed.root)
    .map(({ col }) => col)
  if (matchingColumns.length === 0) return []

  const bassRow = rows.indexOf('Baixo')
  const highlights: HighlightedButton[] = matchingColumns.map((col) => ({
    row: bassRow,
    col,
    kind: 'bass',
  }))

  let chordRowName: (typeof BASS_ROWS_120)[number] = 'Maior'
  if (parsed.quality === 'm' || parsed.quality === 'm6') chordRowName = 'Menor'
  else if (parsed.quality === 'dim') chordRowName = 'Diminuto'
  else if (parsed.quality.includes('7') || parsed.quality === '9') chordRowName = 'Sétima'

  const chordRow = rows.indexOf(chordRowName)
  if (chordRow !== -1) {
    matchingColumns.forEach((col) => highlights.push({ row: chordRow, col, kind: 'chord' }))
  }

  return highlights
}

export function chordLabelForRow(root: string, rowName: string): string {
  switch (rowName) {
    case 'Maior':
      return root
    case 'Menor':
      return `${root}m`
    case 'Sétima':
      return `${root}7`
    case 'Diminuto':
      return `${root}°`
    case 'Contra': {
      const rootIndex = CHROMATIC_SHARP.indexOf(root as (typeof CHROMATIC_SHARP)[number])
      return rootIndex === -1 ? root : CHROMATIC_SHARP[(rootIndex + 4) % 12]
    }
    default:
      return root
  }
}
