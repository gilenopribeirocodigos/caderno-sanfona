import type { ChordNotation } from '@/types'
import { formatChordForDisplay } from '@/utils/chords'
import { colorMapForChords } from '@/utils/chordColors'
import VerticalKeyboard from './VerticalKeyboard'

interface ChordKeyboardsProps {
  chords: string[]
  activeChord?: string
  notation: ChordNotation
}

/**
 * Um teclado pequeno por acorde da música, lado a lado (como num diagrama
 * de referência de cifras: cada acorde com seu próprio desenho). O acorde
 * tocado agora fica com destaque (contorno mais forte).
 */
export default function ChordKeyboards({ chords, activeChord, notation }: ChordKeyboardsProps) {
  const colorByChord = colorMapForChords(chords)

  if (chords.length === 0) {
    return <p className="text-xs text-slate-400">Nenhum acorde na música ainda.</p>
  }

  return (
    <div className="flex flex-wrap gap-3">
      {chords.map((chord) => {
        const color = colorByChord.get(chord)!
        const isActive = chord === activeChord
        return (
          <div
            key={chord}
            className={`rounded-lg border-2 p-1.5 ${isActive ? color.solid.split(' ')[0] : 'border-transparent'}`}
          >
            <p className={`mb-0.5 text-center text-xs font-bold ${color.label}`}>
              {formatChordForDisplay(chord, notation)}
            </p>
            <VerticalKeyboard chord={chord} color={color} notation={notation} />
          </div>
        )
      })}
    </div>
  )
}
