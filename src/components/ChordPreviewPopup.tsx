import type { AccordionType, ChordNotation } from '@/types'
import { formatChordForDisplay } from '@/utils/chords'
import { colorMapForChords } from '@/utils/chordColors'
import { chordLabelForRow, columnsFor, getHighlightedButtons, rowsFor } from '@/utils/accordion'
import VerticalKeyboard from './VerticalKeyboard'

interface ChordPreviewPopupProps {
  chord: string
  x: number
  y: number
  accordionType: AccordionType
  notation: ChordNotation
  onClose: () => void
}

/** Versão enxuta do baixo — só os 1-2 botões usados por ESSE acorde (não o
 * mapa inteiro do Stradella), do jeito que cabe numa consulta rápida. */
function MiniBassPreview({
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
    <div className="flex gap-3">
      {items.map(([rowIndex, h]) => {
        const rowName = rows[rowIndex]
        const label = chordLabelForRow(columns[h.col], rowName)
        return (
          <div key={rowIndex} className="flex flex-col items-center gap-1">
            <span className="text-[9px] uppercase text-slate-400">{rowName}</span>
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-bold"
              style={{ borderColor: color.hex, color: color.hex, backgroundColor: color.hexSoft }}
            >
              {formatChordForDisplay(label, notation)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/** Ao tocar num acorde na letra (estilo Cifra Club): mostra rapidinho onde
 * apertar — teclado e os botões certos do baixo — sem editar nada. */
export default function ChordPreviewPopup({ chord, x, y, accordionType, notation, onClose }: ChordPreviewPopupProps) {
  const color = colorMapForChords([chord]).get(chord)!
  const width = 220

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 flex flex-col gap-2 rounded-xl border border-slate-200 bg-surface p-2.5 shadow-2xl dark:border-slate-700"
        style={{ left: Math.min(Math.max(8, x - width / 2), window.innerWidth - width - 8), top: y + 14, width }}
      >
        <div className="flex items-center justify-between">
          <span className="text-base font-bold" style={{ color: color.hex }}>
            {formatChordForDisplay(chord, notation)}
          </span>
          <button className="tap-target text-xs text-slate-400" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="flex items-start justify-between gap-2">
          <div className="scale-90 origin-top-left">
            <VerticalKeyboard chord={chord} color={color} notation={notation} />
          </div>
          <MiniBassPreview chord={chord} accordionType={accordionType} notation={notation} color={color} />
        </div>
      </div>
    </>
  )
}
