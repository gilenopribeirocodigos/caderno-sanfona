import type { ChordNotation } from '@/types'
import { formatChordForDisplay } from '@/utils/chords'
import { colorMapForChords } from '@/utils/chordColors'
import VerticalKeyboard from './VerticalKeyboard'

interface ChordKeyboardsProps {
  chords: string[]
  /** Acordes que realmente estão na música (para diferenciar de uma "prévia"). */
  realChords?: string[]
  activeChord?: string
  notation: ChordNotation
  /** Quando true, tocar num teclado define o acorde ativo (mesmo comportamento do baixo). */
  interactive?: boolean
  onSelectChord?: (chord: string) => void
  /** Presente = mostra um "×" no cartão de prévia para voltar aos acordes da música. */
  onDismissPreview?: () => void
}

/**
 * Um teclado pequeno por acorde da música, lado a lado (como num diagrama
 * de referência de cifras: cada acorde com seu próprio desenho). O acorde
 * tocado agora fica com destaque (contorno mais forte).
 */
export default function ChordKeyboards({
  chords,
  realChords,
  activeChord,
  notation,
  interactive = false,
  onSelectChord,
  onDismissPreview,
}: ChordKeyboardsProps) {
  const colorByChord = colorMapForChords(chords)

  if (chords.length === 0) {
    return <p className="text-xs text-slate-400">Nenhum acorde na música ainda.</p>
  }

  const canClick = interactive && Boolean(onSelectChord)

  return (
    <div className="flex flex-wrap gap-3">
      {chords.map((chord) => {
        const color = colorByChord.get(chord)!
        const isActive = chord === activeChord
        const isPreview = realChords ? !realChords.includes(chord) : false
        return (
          <div key={chord} className="relative">
            <button
              type="button"
              disabled={!canClick}
              onClick={() => canClick && onSelectChord!(chord)}
              title={canClick ? `Tocar acorde ${formatChordForDisplay(chord, notation)}` : undefined}
              className={`rounded-lg border-2 p-1.5 text-left ${
                isPreview ? 'border-dashed' : ''
              } ${isActive ? color.solid.split(' ')[0] : isPreview ? 'border-slate-300 dark:border-slate-600' : 'border-transparent'} ${
                canClick ? 'cursor-pointer hover:border-slate-900 dark:hover:border-slate-100' : ''
              }`}
            >
              <p className={`mb-0.5 text-center text-xs font-bold ${color.label}`}>
                {formatChordForDisplay(chord, notation)}
                {isPreview && <span className="ml-1 font-normal text-slate-400">(prévia)</span>}
              </p>
              <VerticalKeyboard chord={chord} color={color} notation={notation} />
            </button>
            {isPreview && onDismissPreview && (
              <button
                type="button"
                aria-label="Voltar aos acordes da música"
                title="Voltar aos acordes da música"
                onClick={onDismissPreview}
                className="tap-target absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-white shadow hover:bg-slate-900"
              >
                ×
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
