import type { AccordionType, ChordNotation } from '@/types'
import { formatChordForDisplay } from '@/utils/chords'
import { colorMapForChords, type ChordColor } from '@/utils/chordColors'
import { chordLabelForRow, columnsFor, getHighlightedButtons, rowsFor } from '@/utils/accordion'
import VerticalKeyboard from './VerticalKeyboard'

/** Quantos botões vizinhos mostrar acima/abaixo do botão certo, em cada
 * fileira — dá pra ver a posição dele no meio dos outros, sem mostrar o
 * mapa inteiro do Stradella (que tem 20 por fileira). */
const NEIGHBOR_WINDOW = 2
const COLUMN_SHIFT = 4

/** Versão enxuta do baixo, mas em contexto: mostra o botão certo junto com
 * alguns vizinhos (acima/abaixo, na mesma fileira), como no instrumento de
 * verdade, pra dar pra achar a posição — não só os botões soltos. */
export function MiniBassPreview({
  chord,
  accordionType,
  notation,
  color,
}: {
  chord: string
  accordionType: AccordionType
  notation: ChordNotation
  color: { hex: string; hexSoft: string }
}) {
  const highlights = getHighlightedButtons(chord, accordionType)
  const rows = rowsFor(accordionType)
  const columns = columnsFor(accordionType)

  // Ignora repetições do mesmo botão nas pontas do instrumento (o
  // Stradella de 120 baixos repete notas ali) — só a primeira de cada função.
  const byRow = new Map<number, (typeof highlights)[number]>()
  for (const h of highlights) if (!byRow.has(h.row)) byRow.set(h.row, h)
  const items = [...byRow.entries()].sort((a, b) => a[0] - b[0])

  if (items.length === 0) return null

  return (
    <div className="flex gap-2.5">
      {items.map(([rowIndex, h], colPos) => {
        const rowName = rows[rowIndex]
        const start = Math.max(0, h.col - NEIGHBOR_WINDOW)
        const end = Math.min(columns.length - 1, h.col + NEIGHBOR_WINDOW)
        const windowCols: number[] = []
        for (let i = start; i <= end; i++) windowCols.push(i)
        return (
          <div
            key={rowIndex}
            className="flex flex-col items-center gap-1"
            style={{ paddingTop: colPos * COLUMN_SHIFT }}
          >
            <span className="text-[9px] uppercase text-slate-400">{rowName}</span>
            <div className="flex flex-col gap-1">
              {windowCols.map((colIndex) => {
                const label = chordLabelForRow(columns[colIndex], rowName)
                const isTarget = colIndex === h.col
                return (
                  <span
                    key={colIndex}
                    className={`flex h-7 w-7 items-center justify-center rounded-full border text-[9px] font-bold ${
                      isTarget ? '' : 'border-slate-300 text-slate-400 dark:border-slate-600 dark:text-slate-500'
                    }`}
                    style={isTarget ? { borderColor: color.hex, color: color.hex, backgroundColor: color.hexSoft, borderWidth: 2 } : undefined}
                  >
                    {formatChordForDisplay(label, notation)}
                  </span>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface ChordCardProps {
  chord: string
  accordionType: AccordionType
  notation: ChordNotation
  color?: ChordColor
  /** "lg" pro Modo Aula (letra maior, sem escala reduzida no teclado). */
  size?: 'sm' | 'lg'
}

/** Cartão reutilizável (nome + teclado + baixo) pra "onde apertar" de um
 * acorde — usado no balão de preview rápido (ChordPreviewPopup) e no
 * Modo Aula, sempre com o mesmo desenho compacto. */
export default function ChordCard({ chord, accordionType, notation, color, size = 'sm' }: ChordCardProps) {
  const resolvedColor = color ?? colorMapForChords([chord]).get(chord)!
  return (
    <div className="flex flex-col gap-1">
      <span className={size === 'lg' ? 'text-xl font-bold' : 'text-base font-bold'} style={{ color: resolvedColor.hex }}>
        {formatChordForDisplay(chord, notation)}
      </span>
      <div className="flex items-start gap-2">
        <div className={size === 'lg' ? undefined : 'scale-90 origin-top-left'}>
          <VerticalKeyboard chord={chord} color={resolvedColor} notation={notation} />
        </div>
        <MiniBassPreview chord={chord} accordionType={accordionType} notation={notation} color={resolvedColor} />
      </div>
    </div>
  )
}
