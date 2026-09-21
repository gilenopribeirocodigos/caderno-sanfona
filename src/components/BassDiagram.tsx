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
const ROW_HEIGHT = 44
const ROW_SHIFT = 16 // px de deslocamento por linha, para lembrar o layout diagonal real da sanfona

/**
 * Mapa dos baixos da mão esquerda (itens 55-67, 1123-1157): as notas descem
 * na tela (leitura vertical, sem depender de rolar a página toda de lado) e
 * cada linha de botões é deslocada diagonalmente da anterior, lembrando o
 * layout físico real do instrumento. Os nomes das notas ficam numa coluna
 * fixa que nunca sai da tela, mesmo quando a área dos botões rola de lado.
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
    <div>
      <p className="mb-1 text-[10px] text-slate-400">
        Ordem em cada botão: Baixo · Maior · Menor · Sétima{columns.includes('Diminuto') ? ' · Diminuto' : ''}
      </p>
      <div className="flex max-h-80 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex shrink-0 flex-col border-r border-slate-200 bg-surface dark:border-slate-700">
          {notes.map((note) => (
            <div
              key={note}
              style={{ height: ROW_HEIGHT }}
              className="flex w-10 items-center justify-center border-b border-slate-100 text-xs font-semibold text-slate-500 dark:border-slate-800"
            >
              {note}
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <div className="flex flex-col py-1">
            {notes.map((note, noteIndex) => (
              <div
                key={note}
                style={{ height: ROW_HEIGHT, marginLeft: noteIndex * ROW_SHIFT }}
                className="flex shrink-0 items-center gap-1.5 pr-4"
              >
                {columns.map((col) => {
                  const chord = col === 'Baixo' ? note : chordLabelForRow(note, col)
                  const hit = isHighlighted(noteIndex, col)
                  const kind = col === 'Baixo' ? 'bass' : 'chord'
                  const canClick = interactive && col !== 'Baixo' && onSelectChord
                  return (
                    <button
                      key={col}
                      type="button"
                      disabled={!canClick}
                      onClick={() => canClick && onSelectChord!(chord)}
                      title={`${col}: ${chord}`}
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition-colors ${
                        hit
                          ? kind === 'bass'
                            ? 'border-sky-600 bg-sky-600 text-white'
                            : 'border-amber-500 bg-amber-500 text-white'
                          : 'border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300'
                      } ${canClick ? 'cursor-pointer hover:border-slate-900 dark:hover:border-slate-100' : ''}`}
                    >
                      {chord}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
