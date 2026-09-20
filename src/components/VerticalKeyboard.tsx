import { notesInChord } from '@/utils/chords'

interface VerticalKeyboardProps {
  activeChord?: string
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

const WHITE_KEY_W = 56
const WHITE_KEY_H = 30
const BLACK_KEY_W = 34
const BLACK_KEY_H = 20

/**
 * Teclado vertical da mão direita (itens 68-71, 1195-1224): teclas brancas
 * e pretas na vertical (mais natural para a sanfona do que um piano
 * deitado), destacando as notas do acorde atual.
 */
export default function VerticalKeyboard({ activeChord, octaves = 2 }: VerticalKeyboardProps) {
  const activeNotes = new Set(notesInChord(activeChord ?? ''))
  const whiteKeys = Array.from({ length: octaves }).flatMap(() => WHITE_SEQUENCE)

  const height = whiteKeys.length * WHITE_KEY_H
  const width = WHITE_KEY_W + 24

  const blackKeys: { note: string; y: number }[] = []
  whiteKeys.forEach((note, i) => {
    const sharp = SHARP_AFTER[note]
    if (sharp && i < whiteKeys.length - 1) {
      blackKeys.push({ note: sharp, y: (i + 1) * WHITE_KEY_H - BLACK_KEY_H / 2 })
    }
  })

  return (
    <svg width={width} height={height} role="img" aria-label="Teclado vertical da mão direita">
      {whiteKeys.map((note, i) => {
        const active = activeNotes.has(note)
        return (
          <g key={i}>
            <rect
              x={0}
              y={i * WHITE_KEY_H}
              width={WHITE_KEY_W}
              height={WHITE_KEY_H}
              fill={active ? '#f59e0b' : '#fff'}
              stroke="#94a3b8"
            />
            <text
              x={8}
              y={i * WHITE_KEY_H + WHITE_KEY_H / 2}
              dominantBaseline="central"
              fontSize={11}
              fill={active ? '#fff' : '#334155'}
            >
              {note}
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
              fill={active ? '#f59e0b' : '#1e293b'}
            />
            <text
              x={6}
              y={y + BLACK_KEY_H / 2}
              dominantBaseline="central"
              fontSize={9}
              fill="#fff"
            >
              {note}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
