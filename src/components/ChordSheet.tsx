import { useRef, useState } from 'react'
import type { ChordNotation, LyricLine } from '@/types'
import { formatChordForDisplay } from '@/utils/chords'

interface ChordSheetProps {
  lines: LyricLine[]
  notation: ChordNotation
  fontSize: number
  chordSize: number
  /** Presente = modo edição: clicar numa palavra abre o seletor de acorde nela. */
  onWordClick?: (lineIndex: number, tokenIndex: number) => void
  /** Presente = permite arrastar um acorde existente para outra palavra (troca os dois). */
  onChordMove?: (from: WordRef, to: WordRef) => void
  /** Modo leitura: tocar num acorde já existente o marca como "atual" (Modo Sanfona Visual). */
  onChordTap?: (chord: string) => void
  /** Mostra um preview rápido (teclado + baixo) pertinho do toque — o `ref`
   * identifica exatamente qual ocorrência foi tocada (item 185), pra dar
   * pra salvar a inversão só pra ela, se quiser. */
  onChordPreview?: (chord: string, x: number, y: number, ref: WordRef) => void
  activeChord?: string
  /** false = só a letra, sem a linha de cifra acima — mais compacto (item 179). */
  showChords?: boolean
}

export interface WordRef {
  lineIndex: number
  tokenIndex: number
  /** Presente quando a palavra tem acorde(s) por sílaba (item 182/185). */
  pieceIndex?: number
}

const DRAG_THRESHOLD = 8

/** Renderiza letra + cifras (itens 164-176): acorde acima da palavra correspondente. */
export default function ChordSheet({
  lines,
  notation,
  fontSize,
  chordSize,
  onWordClick,
  onChordMove,
  onChordTap,
  onChordPreview,
  activeChord,
  showChords = true,
}: ChordSheetProps) {
  const [dragChord, setDragChord] = useState<string | null>(null)
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)
  const [dropTarget, setDropTarget] = useState<WordRef | null>(null)
  const dragState = useRef<{
    from: WordRef
    chord: string
    startX: number
    startY: number
    moved: boolean
  } | null>(null)

  function findWordRefAt(x: number, y: number): WordRef | null {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-li]')
    if (!el) return null
    const li = Number(el.dataset.li)
    const ti = Number(el.dataset.ti)
    if (Number.isNaN(li) || Number.isNaN(ti)) return null
    return { lineIndex: li, tokenIndex: ti }
  }

  function handlePointerDown(e: React.PointerEvent, li: number, ti: number, chord?: string) {
    if (!onChordMove || !chord) return
    dragState.current = { from: { lineIndex: li, tokenIndex: ti }, chord, startX: e.clientX, startY: e.clientY, moved: false }
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  function handlePointerMove(e: PointerEvent) {
    const state = dragState.current
    if (!state) return
    const dx = e.clientX - state.startX
    const dy = e.clientY - state.startY
    if (!state.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      state.moved = true
      setDragChord(state.chord)
    }
    if (state.moved) {
      setDragPos({ x: e.clientX, y: e.clientY })
      setDropTarget(findWordRefAt(e.clientX, e.clientY))
    }
  }

  function handlePointerUp(e: PointerEvent) {
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', handlePointerUp)
    const state = dragState.current
    dragState.current = null
    if (state?.moved) {
      const target = findWordRefAt(e.clientX, e.clientY)
      if (target && onChordMove) onChordMove(state.from, target)
    }
    setDragChord(null)
    setDragPos(null)
    setDropTarget(null)
  }

  return (
    <div className={`flex flex-col ${showChords ? 'gap-3' : 'gap-1'}`}>
      {dragChord && dragPos && (
        <div
          className="pointer-events-none fixed z-50 rounded bg-slate-900 px-2 py-1 text-sm font-bold text-white shadow-lg dark:bg-slate-100 dark:text-slate-900"
          style={{ left: dragPos.x + 12, top: dragPos.y - 12 }}
        >
          {formatChordForDisplay(dragChord, notation)}
        </div>
      )}
      {lines.map((line, li) => {
        if (line.section !== undefined) {
          return (
            <h4 key={li} className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-400">
              {line.section}
            </h4>
          )
        }
        if (line.tokens.length === 0) {
          return <div key={li} className={showChords ? 'h-2' : 'h-1'} />
        }
        return (
          <div key={li} className="flex flex-wrap items-end gap-x-1 gap-y-1">
            {line.tokens.map((token, ti) => {
              const clickable = showChords && Boolean(onWordClick || ((onChordTap || onChordPreview) && token.chord))
              const isDropTarget = dropTarget?.lineIndex === li && dropTarget?.tokenIndex === ti
              return (
                <span
                  key={ti}
                  data-li={li}
                  data-ti={ti}
                  onPointerDown={(e) => showChords && handlePointerDown(e, li, ti, token.chord)}
                  onClick={(e) => {
                    if (!showChords || dragState.current?.moved) return
                    if (onWordClick) {
                      onWordClick(li, ti)
                      return
                    }
                    const pieceEl = (e.target as HTMLElement).closest<HTMLElement>('[data-pi]')
                    const pieceIndex = pieceEl ? Number(pieceEl.dataset.pi) : undefined
                    const chord = pieceIndex !== undefined ? token.pieces?.[pieceIndex]?.chord : token.chord
                    if (chord) {
                      onChordTap?.(chord)
                      onChordPreview?.(chord, e.clientX, e.clientY, { lineIndex: li, tokenIndex: ti, pieceIndex })
                    }
                  }}
                  className={`flex flex-col items-start ${clickable ? 'cursor-pointer touch-none' : ''} ${
                    onWordClick ? 'rounded px-0.5 hover:bg-surface-alt' : ''
                  } ${isDropTarget ? 'bg-emerald-200 dark:bg-emerald-800' : ''}`}
                >
                  {showChords && !token.pieces && (
                  <span
                    style={{ fontSize: chordSize }}
                    className={`font-bold leading-tight ${
                      token.chord && token.chord === activeChord
                        ? 'rounded bg-amber-400 px-1 text-slate-900'
                        : 'text-sky-600 dark:text-sky-400'
                    }`}
                  >
                    {token.chord ? formatChordForDisplay(token.chord, notation) : ' '}
                    {token.inversion !== undefined && (
                      <sup className="ml-0.5 text-[8px] text-amber-500" title="Inversão diferente só aqui">●</sup>
                    )}
                  </span>
                  )}
                  {!token.pieces && (
                    <span style={{ fontSize }} className="leading-tight">
                      {token.text || ' '}
                    </span>
                  )}
                  {token.pieces && (
                    <span className="flex items-end">
                      {token.pieces.map((piece, pi) => (
                        <span key={pi} data-pi={pi} className="flex flex-col items-start">
                          {showChords && (
                            <span
                              style={{ fontSize: chordSize }}
                              className={`font-bold leading-tight ${
                                piece.chord && piece.chord === activeChord
                                  ? 'rounded bg-amber-400 px-1 text-slate-900'
                                  : 'text-sky-600 dark:text-sky-400'
                              }`}
                            >
                              {piece.chord ? formatChordForDisplay(piece.chord, notation) : ' '}
                              {piece.inversion !== undefined && (
                                <sup className="ml-0.5 text-[8px] text-amber-500" title="Inversão diferente só aqui">●</sup>
                              )}
                            </span>
                          )}
                          <span style={{ fontSize }} className="leading-tight">
                            {piece.text}
                          </span>
                        </span>
                      ))}
                    </span>
                  )}
                </span>
              )
            })}
          </div>
        )
      })}
      {onChordMove && (
        <p className="text-xs text-slate-400">
          Dica: segure e arraste um acorde para movê-lo para outra palavra.
        </p>
      )}
    </div>
  )
}
