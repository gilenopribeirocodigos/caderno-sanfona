import type { ChordNotation } from '@/types'
import { formatChordForDisplay } from '@/utils/chords'
import { colorMapForChords } from '@/utils/chordColors'
import VerticalKeyboard from './VerticalKeyboard'

interface ChordKeyboardsProps {
  chords: string[]
  activeChord?: string
  notation: ChordNotation
  /** Quando true, tocar num teclado define o acorde ativo (mesmo comportamento do baixo). */
  interactive?: boolean
  onSelectChord?: (chord: string) => void
}

/**
 * Um teclado pequeno por acorde da música, lado a lado (como num diagrama
 * de referência de cifras: cada acorde com seu próprio desenho). O acorde
 * tocado agora fica com destaque (contorno mais forte).
 */
export default function ChordKeyboards({
  chords,
  activeChord,
  notation,
  interactive = false,
  onSelectChord,
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
        return (
          <button
            key={chord}
            type="button"
            disabled={!canClick}
            onClick={() => canClick && onSelectChord!(chord)}
            title={canClick ? `Tocar acorde ${formatChordForDisplay(chord, notation)}` : undefined}
            className={`rounded-lg border-2 p-1.5 text-left ${
              isActive ? color.solid.split(' ')[0] : 'border-transparent'
            } ${canClick ? 'cursor-pointer hover:border-slate-900 dark:hover:border-slate-100' : ''}`}
          >
            <p className={`mb-0.5 text-center text-xs font-bold ${color.label}`}>
              {formatChordForDisplay(chord, notation)}
            </p>
            <VerticalKeyboard chord={chord} color={color} notation={notation} />
          </button>
        )
      })}
    </div>
  )
}
