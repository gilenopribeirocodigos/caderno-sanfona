import type { ChordNotation } from '@/types'
import { formatChordForDisplay } from '@/utils/chords'

interface NoteBuilderKeyboardProps {
  selectedNotes: Set<string>
  notation: ChordNotation
  onToggleNote: (note: string) => void
}

// O teclado é desenhado de cima para baixo. No instrumento, as notas sobem
// de baixo para cima: Dó, Ré, Mi, Fá, Sol, Lá, Si.
const WHITE_SEQUENCE_TOP_TO_BOTTOM = ['B', 'A', 'G', 'F', 'E', 'D', 'C']
// Sustenidos existentes após cada nota branca (nenhum entre E-F e B-C).
const SHARP_AFTER: Record<string, string | null> = {
  C: 'C#', D: 'D#', E: null, F: 'F#', G: 'G#', A: 'A#', B: null,
}

const WHITE_KEY_W = 88
const WHITE_KEY_H = 44
const BLACK_KEY_W = 54
const BLACK_KEY_H = 26
const CORNER = 8

/**
 * Teclado grande e tocável, uma nota de cada vez — para "montar" um
 * acorde tocando as próprias notas, como se faz de verdade num teclado
 * (diferente dos mini-teclados prontos por acorde em ChordKeyboards).
 * Cada tecla tocada aqui liga/desliga aquela nota em `selectedNotes`;
 * quem chama decide o que fazer quando o conjunto formar um acorde
 * conhecido (ver `chordFromNotes`).
 */
export default function NoteBuilderKeyboard({ selectedNotes, notation, onToggleNote }: NoteBuilderKeyboardProps) {
  const whiteKeys = WHITE_SEQUENCE_TOP_TO_BOTTOM
  const height = whiteKeys.length * WHITE_KEY_H
  const width = WHITE_KEY_W + 8

  const blackKeys: { note: string; y: number }[] = []
  whiteKeys.forEach((_note, i) => {
    const lowerWhiteKey = whiteKeys[i + 1]
    const sharp = lowerWhiteKey ? SHARP_AFTER[lowerWhiteKey] : null
    if (sharp) {
      blackKeys.push({ note: sharp, y: (i + 1) * WHITE_KEY_H - BLACK_KEY_H / 2 })
    }
  })

  return (
    <svg width={width} height={height + 4} role="group" aria-label="Teclado para montar acorde tocando as notas">
      {whiteKeys.map((note, i) => {
        const active = selectedNotes.has(note)
        return (
          <g key={note} onClick={() => onToggleNote(note)} className="cursor-pointer">
            <rect
              x={0.5}
              y={i * WHITE_KEY_H + 0.5}
              width={WHITE_KEY_W - 1}
              height={WHITE_KEY_H - 1}
              rx={i === whiteKeys.length - 1 ? CORNER : 0}
              fill={active ? 'var(--color-gold)' : '#ffffff'}
              stroke={active ? '#7a5a12' : '#94a3b8'}
              strokeWidth={active ? 2 : 1}
            />
            <text
              x={12}
              y={i * WHITE_KEY_H + WHITE_KEY_H / 2}
              dominantBaseline="central"
              fontSize={15}
              fontWeight={active ? 700 : 400}
              fill="#334155"
            >
              {formatChordForDisplay(note, notation)}
            </text>
          </g>
        )
      })}
      {blackKeys.map(({ note, y }) => {
        const active = selectedNotes.has(note)
        return (
          <g key={note} onClick={() => onToggleNote(note)} className="cursor-pointer">
            <rect
              x={0}
              y={y}
              width={BLACK_KEY_W}
              height={BLACK_KEY_H}
              rx={3}
              fill={active ? 'var(--color-gold)' : '#0f172a'}
            />
            <text
              x={7}
              y={y + BLACK_KEY_H / 2}
              dominantBaseline="central"
              fontSize={12}
              fontWeight={600}
              fill={active ? '#4a0f24' : '#fff'}
            >
              {formatChordForDisplay(note, notation)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
