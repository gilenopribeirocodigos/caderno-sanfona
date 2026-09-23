import type { ChordNotation } from '@/types'
import { formatChordForDisplay } from '@/utils/chords'
import type { ChordColor } from '@/utils/chordColors'
import { keyboardLayoutForChord } from '@/utils/keyboardVoicing'

interface VerticalKeyboardProps {
  chord?: string
  color: ChordColor
  notation: ChordNotation
}

const WHITE_KEY_W = 64
const WHITE_KEY_H = 30
const BLACK_KEY_W = 40
const BLACK_KEY_H = 20
const CORNER = 6
const Y_PAD = BLACK_KEY_H / 2

/**
 * Teclado vertical da mão direita para UM acorde (itens 68-71, 1195-1224):
 * teclas brancas e pretas na vertical, só a faixa (de até 2 oitavas) que
 * cobre as notas do acorde na posição mais próxima uma da outra — não
 * sempre a mesma oitava fixa, que às vezes deixava notas do mesmo acorde
 * bem longe umas das outras no desenho (ver keyboardVoicing.ts). Usado
 * em conjunto com um teclado por acorde da música (ver ChordKeyboards).
 */
export default function VerticalKeyboard({ chord, color, notation }: VerticalKeyboardProps) {
  const { whiteKeys, blackKeys, active } = keyboardLayoutForChord(chord)

  const height = whiteKeys.length * WHITE_KEY_H + BLACK_KEY_H
  const width = WHITE_KEY_W + 6

  return (
    <svg width={width} height={height} role="img" aria-label={`Teclado do acorde ${chord ?? ''}`}>
      {whiteKeys.map((key, i) => {
        const isActive = active.get(key.note) === key.chromaticIndex
        const y = i * WHITE_KEY_H + Y_PAD
        return (
          <g key={key.chromaticIndex}>
            <rect
              x={0.5}
              y={y + 0.5}
              width={WHITE_KEY_W - 1}
              height={WHITE_KEY_H - 1}
              rx={i === whiteKeys.length - 1 ? CORNER : 0}
              fill={isActive ? color.hexSoft : '#ffffff'}
              stroke={isActive ? color.hex : '#94a3b8'}
              strokeWidth={isActive ? 1.5 : 1}
            />
            {isActive && <circle cx={WHITE_KEY_W - 13} cy={y + WHITE_KEY_H / 2} r={5.5} fill={color.hex} />}
            <text x={8} y={y + WHITE_KEY_H / 2} dominantBaseline="central" fontSize={11} fontWeight={isActive ? 700 : 400} fill="#334155">
              {formatChordForDisplay(key.note, notation)}
            </text>
          </g>
        )
      })}
      {blackKeys.map((key) => {
        const isActive = active.get(key.note) === key.chromaticIndex
        const y = key.belowWhiteRow * WHITE_KEY_H - BLACK_KEY_H / 2 + Y_PAD
        return (
          <g key={key.chromaticIndex}>
            <rect x={0} y={y} width={BLACK_KEY_W} height={BLACK_KEY_H} rx={2} fill={isActive ? color.hex : '#0f172a'} />
            {isActive && <circle cx={BLACK_KEY_W - 9} cy={y + BLACK_KEY_H / 2} r={3.5} fill={color.hexSoft} />}
            <text x={5} y={y + BLACK_KEY_H / 2} dominantBaseline="central" fontSize={8.5} fontWeight={600} fill="#fff">
              {formatChordForDisplay(key.note, notation)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
