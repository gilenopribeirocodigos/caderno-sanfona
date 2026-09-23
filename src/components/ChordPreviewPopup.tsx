import type { AccordionType, ChordNotation } from '@/types'
import ChordCard from './ChordCard'

interface ChordPreviewPopupProps {
  chord: string
  x: number
  y: number
  accordionType: AccordionType
  notation: ChordNotation
  onClose: () => void
}

/** Ao tocar num acorde na letra (estilo Cifra Club): mostra rapidinho onde
 * apertar — teclado e os botões certos do baixo — sem editar nada. */
export default function ChordPreviewPopup({ chord, x, y, accordionType, notation, onClose }: ChordPreviewPopupProps) {
  const width = 260

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 rounded-xl border border-slate-200 bg-surface p-2.5 pt-4 shadow-2xl dark:border-slate-700 relative"
        style={{ left: Math.min(Math.max(8, x - width / 2), window.innerWidth - width - 8), top: y + 14, width }}
      >
        <button className="tap-target absolute right-1.5 top-1.5 text-xs text-slate-400" onClick={onClose}>
          ✕
        </button>
        <ChordCard chord={chord} accordionType={accordionType} notation={notation} />
      </div>
    </>
  )
}
