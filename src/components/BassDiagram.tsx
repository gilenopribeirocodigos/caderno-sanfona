import { Fragment } from 'react'
import type { AccordionType } from '@/types'
import { chordLabelForRow, columnsFor, getHighlightedButtons, rowsFor } from '@/utils/accordion'

interface BassDiagramProps {
  accordionType: AccordionType
  activeChord?: string
  /** Quando true, tocar num botão de acorde define o acorde ativo (item "marcar direto no baixo"). */
  interactive?: boolean
  onSelectChord?: (chord: string) => void
}

// Colunas funcionais mostradas: "Contra" fica de fora (item auxiliar, sem
// destaque próprio) para manter a grade limpa e focada no que é acionável.
const VISIBLE_COLUMNS = ['Baixo', 'Maior', 'Menor', 'Sétima', 'Diminuto']

/**
 * Mapa vertical dos baixos da mão esquerda (itens 55-67): cada nota numa
 * linha, as funções (baixo/maior/menor/sétima) nas colunas — leitura de
 * cima para baixo, igual à maioria dos mapas de referência de sanfona, e
 * sem precisar rolar a tela de lado.
 */
export default function BassDiagram({
  accordionType,
  activeChord,
  interactive = false,
  onSelectChord,
}: BassDiagramProps) {
  const notes = columnsFor(accordionType)
  const availableRows = rowsFor(accordionType)
  const columns = VISIBLE_COLUMNS.filter((c) => (availableRows as readonly string[]).includes(c))
  const highlights = getHighlightedButtons(activeChord, accordionType)
  const rowIndexByName = new Map(availableRows.map((name, i) => [name, i]))

  function isHighlighted(noteIndex: number, columnName: string) {
    const rowIndex = rowIndexByName.get(columnName)
    return highlights.some((h) => h.row === rowIndex && h.col === noteIndex)
  }

  return (
    <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
      <div
        className="grid"
        style={{ gridTemplateColumns: `44px repeat(${columns.length}, minmax(52px, 1fr))` }}
      >
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-surface dark:border-slate-700" />
        {columns.map((col) => (
          <div
            key={col}
            className="sticky top-0 z-10 border-b border-slate-200 bg-surface px-1 py-1.5 text-center text-[10px] font-semibold text-slate-500 dark:border-slate-700"
          >
            {col}
          </div>
        ))}

        {notes.map((note, noteIndex) => (
          <Fragment key={note}>
            <div className="flex items-center justify-center border-b border-slate-100 text-xs font-semibold text-slate-500 dark:border-slate-800">
              {note}
            </div>
            {columns.map((col) => {
              const chord = col === 'Baixo' ? note : chordLabelForRow(note, col)
              const hit = isHighlighted(noteIndex, col)
              const kind = col === 'Baixo' ? 'bass' : 'chord'
              const canClick = interactive && col !== 'Baixo' && onSelectChord
              return (
                <div
                  key={col}
                  className="flex items-center justify-center border-b border-slate-100 py-1 dark:border-slate-800"
                >
                  <button
                    type="button"
                    disabled={!canClick}
                    onClick={() => canClick && onSelectChord!(chord)}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border text-[10px] font-bold transition-colors ${
                      hit
                        ? kind === 'bass'
                          ? 'border-sky-600 bg-sky-600 text-white'
                          : 'border-amber-500 bg-amber-500 text-white'
                        : 'border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300'
                    } ${canClick ? 'cursor-pointer hover:border-slate-900 dark:hover:border-slate-100' : ''}`}
                  >
                    {chord}
                  </button>
                </div>
              )
            })}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
