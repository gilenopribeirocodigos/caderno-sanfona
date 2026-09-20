import type { ChordNotation, LyricLine } from '@/types'
import { formatChordForDisplay } from '@/utils/chords'

interface ChordSheetProps {
  lines: LyricLine[]
  notation: ChordNotation
  fontSize: number
  chordSize: number
  /** Presente = modo edição: clicar numa palavra abre o seletor de acorde nela. */
  onWordClick?: (lineIndex: number, tokenIndex: number) => void
  /** Modo leitura: tocar num acorde já existente o marca como "atual" (Modo Sanfona Visual). */
  onChordTap?: (chord: string) => void
  activeChord?: string
}

/** Renderiza letra + cifras (itens 164-176): acorde acima da palavra correspondente. */
export default function ChordSheet({
  lines,
  notation,
  fontSize,
  chordSize,
  onWordClick,
  onChordTap,
  activeChord,
}: ChordSheetProps) {
  return (
    <div className="flex flex-col gap-3">
      {lines.map((line, li) => {
        if (line.section !== undefined) {
          return (
            <h4
              key={li}
              className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-400"
            >
              {line.section}
            </h4>
          )
        }
        if (line.tokens.length === 0) {
          return <div key={li} className="h-2" />
        }
        return (
          <div key={li} className="flex flex-wrap items-end gap-x-1 gap-y-1">
            {line.tokens.map((token, ti) => {
              const clickable = Boolean(onWordClick || (onChordTap && token.chord))
              return (
                <span
                  key={ti}
                  onClick={() => {
                    if (onWordClick) onWordClick(li, ti)
                    else if (onChordTap && token.chord) onChordTap(token.chord)
                  }}
                  className={`flex flex-col items-start ${clickable ? 'cursor-pointer' : ''} ${
                    onWordClick ? 'rounded px-0.5 hover:bg-surface-alt' : ''
                  }`}
                >
                  <span
                    style={{ fontSize: chordSize }}
                    className={`font-bold leading-tight ${
                      token.chord === activeChord
                        ? 'rounded bg-amber-400 px-1 text-slate-900'
                        : 'text-sky-600 dark:text-sky-400'
                    }`}
                  >
                    {token.chord ? formatChordForDisplay(token.chord, notation) : ' '}
                  </span>
                  <span style={{ fontSize }} className="leading-tight">
                    {token.text || ' '}
                  </span>
                </span>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
