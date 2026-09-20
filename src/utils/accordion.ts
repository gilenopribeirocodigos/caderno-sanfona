import { CHROMATIC_SHARP, parseChord } from './chords'
import type { AccordionType } from '@/types'

/** Colunas do baixo em ordem de quintas (ciclo de quintas), como num mapa real de sanfona. */
function fifthsOrder(): string[] {
  const order: string[] = []
  let index = CHROMATIC_SHARP.indexOf('F')
  for (let i = 0; i < 12; i++) {
    order.push(CHROMATIC_SHARP[index])
    index = (index + 7) % 12
  }
  return order
}

const FULL_COLUMNS = fifthsOrder()

export const BASS_ROWS_120 = ['Contra', 'Baixo', 'Maior', 'Menor', 'Sétima', 'Diminuto'] as const
export const BASS_ROWS_80 = ['Contra', 'Baixo', 'Maior', 'Menor', 'Sétima'] as const

export function columnsFor(type: AccordionType): string[] {
  if (type === '120' || type === '96') return FULL_COLUMNS
  if (type === '80' || type === '48') return FULL_COLUMNS.slice(0, 7)
  return FULL_COLUMNS.slice(0, 4)
}

export function rowsFor(type: AccordionType): readonly string[] {
  return type === '120' ? BASS_ROWS_120 : BASS_ROWS_80
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
  const col = columns.indexOf(parsed.root)
  if (col === -1) return []

  const bassRow = rows.indexOf('Baixo')
  const highlights: HighlightedButton[] = [{ row: bassRow, col, kind: 'bass' }]

  let chordRowName: (typeof BASS_ROWS_120)[number] = 'Maior'
  if (parsed.quality === 'm' || parsed.quality === 'm6') chordRowName = 'Menor'
  else if (parsed.quality === 'dim') chordRowName = 'Diminuto'
  else if (parsed.quality.includes('7') || parsed.quality === '9') chordRowName = 'Sétima'

  const chordRow = rows.indexOf(chordRowName)
  if (chordRow !== -1) highlights.push({ row: chordRow, col, kind: 'chord' })

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
    case 'Contra':
      return ''
    default:
      return root
  }
}
