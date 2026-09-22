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

const VISIBLE_COLUMNS = ['Contra', 'Baixo', 'Maior', 'Menor', 'Sétima', 'Diminuto']
const COLUMN_LABELS: Record<string, string> = {
  Contra: '3ª',
  Baixo: 'B',
  Maior: 'M',
  Menor: 'm',
  Sétima: '7',
  Diminuto: '°',
}
const COLUMN_SHIFT = 6

/**
 * Mapa físico dos baixos da mão esquerda (itens 55-67, 1123-1157): cada
 * coluna vertical representa uma fileira real do Stradella. O pequeno
 * deslocamento entre colunas reproduz a diagonal dos botões do instrumento.
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
        Fileiras: Contrabaixo · Fundamental · Maior · Menor · Sétima{columns.includes('Diminuto') ? ' · Diminuto' : ''}
      </p>
      <div className="max-h-80 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="min-w-max p-2">
          <div className="mb-1 flex gap-1.5 text-center text-[9px] font-semibold text-slate-400">
            {columns.map((col) => (
              <div key={col} className="w-9" title={col === 'Contra' ? 'Contrabaixo (terça maior)' : col}>
                {COLUMN_LABELS[col]}
              </div>
            ))}
          </div>
          <div className="flex items-start gap-1.5 pb-8">
            {columns.map((col, columnIndex) => (
              <div
                key={col}
                style={{ paddingTop: columnIndex * COLUMN_SHIFT }}
                className="flex w-9 shrink-0 flex-col gap-1.5"
              >
                {notes.map((note, noteIndex) => {
                  const chord = col === 'Baixo' ? note : chordLabelForRow(note, col)
                  const rowIndex = rowIndexByName.get(col)
                  const owner = cellOwner.get(`${rowIndex}-${noteIndex}`)
                  const color = owner ? colorByChord.get(owner) : undefined
                  const isActive = owner === activeChord
                  const canClick = interactive && col !== 'Baixo' && onSelectChord
                  return (
                    <button
                      key={`${note}-${noteIndex}`}
                      type="button"
                      disabled={!canClick}
                      onClick={() => canClick && onSelectChord!(chord)}
                      title={`${col}: ${formatChordForDisplay(chord, notation)}${owner ? ` (acorde ${formatChordForDisplay(owner, notation)})` : ''}`}
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-[9px] font-bold transition-colors ${
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
