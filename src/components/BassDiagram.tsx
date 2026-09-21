import type { AccordionType, ChordNotation } from '@/types'
import { formatChordForDisplay } from '@/utils/chords'
import { chordLabelForRow, columnsFor, getHighlightedButtons, rowsFor } from '@/utils/accordion'
import { colorMapForChords } from '@/utils/chordColors'

interface BassDiagramProps {
  accordionType: AccordionType
  activeChord?: string
  /** Todos os acordes usados na música (não só o atual) — cada um com sua própria cor. */
  songChords?: string[]
  notation: ChordNotation
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
 * na tela (leitura vertical) e cada linha de botões é deslocada
 * diagonalmente da anterior, lembrando o layout físico real do instrumento.
 * Os nomes das notas ficam numa coluna fixa que nunca sai da tela.
 *
 * Cada acorde da música ganha sua própria cor (mesma cor usada no teclado),
 * para diferenciar rapidamente qual botão pertence a qual acorde quando a
 * música usa vários. O acorde tocado agora aparece preenchido; os demais,
 * com contorno na cor deles.
 */
export default function BassDiagram({
  accordionType,
  activeChord,
  songChords = [],
  notation,
  interactive = false,
  onSelectChord,
}: BassDiagramProps) {
  const notes = columnsFor(accordionType)
  const availableRows = rowsFor(accordionType)
  const columns = VISIBLE_COLUMNS.filter((c) => (availableRows as readonly string[]).includes(c))
  const rowIndexByName = new Map(availableRows.map((name, i) => [name, i]))
  const colorByChord = colorMapForChords(songChords)

  // Para cada célula (linha de função x nota), decide a qual acorde da
  // música ela pertence — o acorde ativo tem prioridade quando duas cores
  // disputam o mesmo botão de baixo (nota compartilhada entre acordes).
  const cellOwner = new Map<string, string>()
  songChords.forEach((chord) => {
    getHighlightedButtons(chord, accordionType).forEach((h) => {
      const key = `${h.row}-${h.col}`
      if (chord === activeChord || !cellOwner.has(key)) cellOwner.set(key, chord)
    })
  })

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
              {formatChordForDisplay(note, notation)}
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
                  const rowIndex = rowIndexByName.get(col)
                  const owner = cellOwner.get(`${rowIndex}-${noteIndex}`)
                  const color = owner ? colorByChord.get(owner) : undefined
                  const isActive = owner === activeChord
                  const canClick = interactive && col !== 'Baixo' && onSelectChord
                  return (
                    <button
                      key={col}
                      type="button"
                      disabled={!canClick}
                      onClick={() => canClick && onSelectChord!(chord)}
                      title={`${col}: ${formatChordForDisplay(chord, notation)}${owner ? ` (acorde ${formatChordForDisplay(owner, notation)})` : ''}`}
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-colors ${
                        color
                          ? isActive
                            ? color.solid
                            : color.tint
                          : 'border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300'
                      } ${canClick ? 'cursor-pointer hover:border-slate-900 dark:hover:border-slate-100' : ''}`}
                    >
                      {formatChordForDisplay(chord, notation)}
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
