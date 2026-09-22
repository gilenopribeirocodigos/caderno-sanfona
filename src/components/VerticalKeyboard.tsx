import type { ChordNotation } from '@/types'
import { formatChordForDisplay, notesInChord } from '@/utils/chords'
import type { ChordColor } from '@/utils/chordColors'

interface VerticalKeyboardProps {
  chord?: string
  color: ChordColor
  notation: ChordNotation
}

// O teclado é desenhado de cima para baixo. No instrumento, as notas sobem
// de baixo para cima: Dó, Ré, Mi, Fá, Sol, Lá, Si.
const WHITE_SEQUENCE_TOP_TO_BOTTOM = ['B', 'A', 'G', 'F', 'E', 'D', 'C']
// Sustenidos existentes após cada nota branca (nenhum entre E-F e B-C).
const SHARP_AFTER: Record<string, string | null> = {
  C: 'C#',
  D: 'D#',
  E: null,
  F: 'F#',
  G: 'G#',
  A: 'A#',
  B: null,
}

const WHITE_KEY_W = 64
const WHITE_KEY_H = 30
const BLACK_KEY_W = 40
const BLACK_KEY_H = 20
const CORNER = 6

/**
 * Teclado vertical da mão direita para UM acorde (itens 68-71, 1195-1224):
 * teclas brancas e pretas na vertical, com uma oitava só (marca uma única
 * vez cada nota, o suficiente para indicar onde apertar). Usado em conjunto
 * com um teclado por acorde da música (ver ChordKeyboards).
 */
export default function VerticalKeyboard({ chord, color, notation }: VerticalKeyboardProps) {
  const activeNotes = new Set(notesInChord(chord ?? ''))
  const whiteKeys = WHITE_SEQUENCE_TOP_TO_BOTTOM

  const height = whiteKeys.length * WHITE_KEY_H
  const width = WHITE_KEY_W + 6

  const blackKeys: { note: string; y: number }[] = []
  whiteKeys.forEach((_note, i) => {
    const lowerWhiteKey = whiteKeys[i + 1]
    const sharp = lowerWhiteKey ? SHARP_AFTER[lowerWhiteKey] : null
    if (sharp) {
      blackKeys.push({ note: sharp, y: (i + 1) * WHITE_KEY_H - BLACK_KEY_H / 2 })
    }
  })

  return (
    <svg width={width} height={height + 4} role="img" aria-label={`Teclado do acorde ${chord ?? ''}`}>
      {whiteKeys.map((note, i) => {
        const active = activeNotes.has(note)
        return (
          <g key={i}>
            <rect
              x={0.5}
              y={i * WHITE_KEY_H + 0.5}
              width={WHITE_KEY_W - 1}
              height={WHITE_KEY_H - 1}
              rx={i === whiteKeys.length - 1 ? CORNER : 0}
              fill={active ? color.hexSoft : '#ffffff'}
              stroke={active ? color.hex : '#94a3b8'}
              strokeWidth={active ? 1.5 : 1}
            />
            {active && (
              <circle cx={WHITE_KEY_W - 13} cy={i * WHITE_KEY_H + WHITE_KEY_H / 2} r={5.5} fill={color.hex} />
            )}
            <text
              x={8}
              y={i * WHITE_KEY_H + WHITE_KEY_H / 2}
              dominantBaseline="central"
              fontSize={11}
              fontWeight={active ? 700 : 400}
              fill="#334155"
            >
              {formatChordForDisplay(note, notation)}
            </text>
          </g>
        )
      })}
      {blackKeys.map(({ note, y }, i) => {
        const active = activeNotes.has(note)
        return (
          <g key={i}>
            <rect
              x={0}
              y={y}
              width={BLACK_KEY_W}
              height={BLACK_KEY_H}
              rx={2}
              fill={active ? color.hex : '#0f172a'}
            />
            {active && <circle cx={BLACK_KEY_W - 9} cy={y + BLACK_KEY_H / 2} r={3.5} fill={color.hexSoft} />}
            <text x={5} y={y + BLACK_KEY_H / 2} dominantBaseline="central" fontSize={8.5} fontWeight={600} fill="#fff">
              {formatChordForDisplay(note, notation)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
