import type { ChordNotation } from '@/types'
import { formatChordForDisplay, notesInChord } from '@/utils/chords'

interface VerticalKeyboardProps {
  activeChord?: string
  notation: ChordNotation
  octaves?: number
}

const WHITE_SEQUENCE = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
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

const WHITE_KEY_W = 76
const WHITE_KEY_H = 34
const BLACK_KEY_W = 48
const BLACK_KEY_H = 22
const CORNER = 6

/**
 * Teclado vertical da mão direita (itens 68-71, 1195-1224): teclas brancas
 * e pretas na vertical (mais natural para a sanfona do que um piano
 * deitado), com desenho de piano de verdade e destaque das notas do
 * acorde atual (cor + marcador).
 */
// Uma oitava só: marcar a mesma nota repetida em várias oitavas confundia
// mais do que ajudava — o objetivo é indicar UM lugar claro para apertar.
export default function VerticalKeyboard({ activeChord, notation, octaves = 1 }: VerticalKeyboardProps) {
  const activeNotes = new Set(notesInChord(activeChord ?? ''))
  const whiteKeys = Array.from({ length: octaves }).flatMap(() => WHITE_SEQUENCE)

  const height = whiteKeys.length * WHITE_KEY_H
  const width = WHITE_KEY_W + 6

  const blackKeys: { note: string; y: number }[] = []
  whiteKeys.forEach((note, i) => {
    const sharp = SHARP_AFTER[note]
    if (sharp && i < whiteKeys.length - 1) {
      blackKeys.push({ note: sharp, y: (i + 1) * WHITE_KEY_H - BLACK_KEY_H / 2 })
    }
  })

  return (
    <svg width={width} height={height + 4} role="img" aria-label="Teclado vertical da mão direita">
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
              fill={active ? '#fde68a' : '#ffffff'}
              stroke="#94a3b8"
              strokeWidth={1}
            />
            {active && (
              <circle cx={WHITE_KEY_W - 14} cy={i * WHITE_KEY_H + WHITE_KEY_H / 2} r={6} fill="#d97706" />
            )}
            <text
              x={10}
              y={i * WHITE_KEY_H + WHITE_KEY_H / 2}
              dominantBaseline="central"
              fontSize={12}
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
              fill={active ? '#d97706' : '#0f172a'}
            />
            {active && <circle cx={BLACK_KEY_W - 10} cy={y + BLACK_KEY_H / 2} r={4} fill="#fde68a" />}
            <text x={6} y={y + BLACK_KEY_H / 2} dominantBaseline="central" fontSize={9} fontWeight={600} fill="#fff">
              {formatChordForDisplay(note, notation)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
