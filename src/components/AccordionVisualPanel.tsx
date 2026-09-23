import { useMemo, useState } from 'react'
import type { AccordionType, ChordNotation } from '@/types'
import { chordFromNotes, formatChordForDisplay, notesInChord } from '@/utils/chords'
import BassDiagram from './BassDiagram'
import ChordKeyboards from './ChordKeyboards'
import ChordPicker from './ChordPicker'
import NoteBuilderKeyboard from './NoteBuilderKeyboard'
import AccordionArt from './AccordionArt'

interface AccordionVisualPanelProps {
  activeChord?: string
  /** Todos os acordes da música, marcados junto (discretamente) com o atual. */
  songChords?: string[]
  accordionType: AccordionType
  notation: ChordNotation
  /** Tom da música, usado só para sugerir acordes prováveis no seletor. */
  currentKey?: string
  onChangeAccordionType: (type: AccordionType) => void
  /** Deixa o usuário tocar direto no baixo para escolher o acorde, sem depender da letra. */
  onSelectChord?: (chord: string) => void
}

type ViewMode = 'both' | 'bass' | 'keyboard'

/** Modo Sanfona Visual (itens 13, 61-62, 72-75): baixos + teclado, com opção de ocultar partes. */
export default function AccordionVisualPanel({
  activeChord,
  songChords = [],
  accordionType,
  notation,
  currentKey = 'C',
  onChangeAccordionType,
  onSelectChord,
}: AccordionVisualPanelProps) {
  const [view, setView] = useState<ViewMode>('both')
  const [interactive, setInteractive] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [building, setBuilding] = useState(false)
  const [builderNotes, setBuilderNotes] = useState<Set<string>>(new Set())

  const notes = activeChord ? notesInChord(activeChord) : []
  const builtChord = building ? chordFromNotes([...builderNotes]) : undefined

  // Garante que o acorde ativo sempre tenha uma cor e apareça no teclado,
  // mesmo quando ele vem do modo interativo e não está (ainda) na música.
  const displayChords = useMemo(() => {
    if (!activeChord || songChords.includes(activeChord)) return songChords
    return [...songChords, activeChord]
  }, [songChords, activeChord])

  function toggleBuilderNote(note: string) {
    setBuilderNotes((prev) => {
      const next = new Set(prev)
      if (next.has(note)) next.delete(note)
      else next.add(note)
      const resolved = chordFromNotes([...next])
      if (resolved && onSelectChord) onSelectChord(resolved)
      return next
    })
  }

  function clearPreview() {
    setBuilderNotes(new Set())
    if (onSelectChord) onSelectChord(songChords[0] ?? '')
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-surface p-3 shadow-sm dark:border-slate-700">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <AccordionArt animated={Boolean(activeChord)} className="h-8 w-auto shrink-0 sm:h-11" />
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight">
              {activeChord ? (
                <>
                  Acorde: <strong>{formatChordForDisplay(activeChord, notation)}</strong>
                  {!songChords.includes(activeChord) && (
                    <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-normal text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                      prévia — não está na música
                    </span>
                  )}
                </>
              ) : (
                'Toque num acorde da letra para ver aqui'
              )}
            </p>
            {notes.length > 0 && (
              <p className="text-xs text-slate-500">
                Notas: {notes.map((n) => formatChordForDisplay(n, notation)).join(' · ')}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-1 text-xs">
          <select
            className="tap-target rounded-md border border-slate-300 px-1.5 py-1 dark:border-slate-700 dark:bg-slate-800"
            value={accordionType}
            onChange={(e) => onChangeAccordionType(e.target.value as AccordionType)}
          >
            <option value="80">80 baixos</option>
            <option value="120">120 baixos</option>
          </select>
          {(['both', 'bass', 'keyboard'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              className={`tap-target rounded-md border px-2 py-1 ${
                view === mode
                  ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
              onClick={() => setView(mode)}
            >
              {mode === 'both' ? 'Ambos' : mode === 'bass' ? 'Baixos' : 'Teclado'}
            </button>
          ))}
          {onSelectChord && (
            <button
              className={`tap-target rounded-md border px-2 py-1 ${
                interactive
                  ? 'border-emerald-600 bg-emerald-600 text-white'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
              onClick={() => setInteractive((v) => !v)}
              title="Tocar num acorde já usado na música para marcá-lo como atual"
            >
              {interactive ? '✓ Tocar no diagrama' : 'Tocar no diagrama'}
            </button>
          )}
          {onSelectChord && (
            <button
              className="tap-target rounded-md border border-slate-300 px-2 py-1 dark:border-slate-700"
              onClick={() => setPickerOpen(true)}
              title="Ver qualquer acorde nos diagramas, mesmo um que não esteja na música"
            >
              Outro acorde...
            </button>
          )}
          {onSelectChord && (view === 'both' || view === 'keyboard') && (
            <button
              className={`tap-target rounded-md border px-2 py-1 ${
                building
                  ? 'border-emerald-600 bg-emerald-600 text-white'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
              onClick={() => setBuilding((v) => !v)}
              title="Tocar as notas uma a uma no teclado para montar/reconhecer um acorde"
            >
              {building ? '✓ Montar acorde' : 'Montar acorde'}
            </button>
          )}
        </div>
      </div>
      {interactive && onSelectChord && !building && (
        <p className="-mt-1 mb-2 text-[10px] text-slate-400">
          Cada desenho abaixo é um acorde já usado nesta música — toque em
          qualquer um deles para marcá-lo como atual. Para ver um acorde que
          não está na música (ex: Ré menor), use "Outro acorde..." ou
          "Montar acorde" acima.
        </p>
      )}

      <div className="flex flex-wrap items-start gap-4">
        {(view === 'both' || view === 'bass') && (
          <div>
            <BassDiagram
              accordionType={accordionType}
              activeChord={activeChord}
              songChords={displayChords}
              notation={notation}
              interactive={interactive}
              onSelectChord={onSelectChord}
            />
            <p className="mt-1 max-w-xs text-[10px] text-slate-400">
              Cada acorde da música tem sua cor. Preenchido = acorde atual.
              O botão de acorde já toca as notas todas de uma vez, num único
              toque — é assim que a sanfona funciona (não dá para "montar"
              um acorde botão por botão no baixo, só escolher um já pronto).
            </p>
          </div>
        )}
        {(view === 'both' || view === 'keyboard') && (
          <div className="flex flex-col gap-3">
            <ChordKeyboards
              chords={displayChords}
              realChords={songChords}
              activeChord={activeChord}
              notation={notation}
              interactive={interactive}
              onSelectChord={onSelectChord}
              onDismissPreview={onSelectChord ? clearPreview : undefined}
            />
            {building && (
              <div className="rounded-lg border border-dashed border-emerald-500 p-2">
                <p className="mb-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  {builderNotes.size === 0
                    ? 'Toque nas notas para montar um acorde — ele aparece ali em cima assim que for reconhecido.'
                    : builtChord
                      ? (
                        <>
                          Reconhecido: <strong>{formatChordForDisplay(builtChord, notation)}</strong> — já apareceu ali em cima, com "(prévia)".
                        </>
                      )
                      : 'Ainda não forma um acorde conhecido.'}
                </p>
                <NoteBuilderKeyboard
                  selectedNotes={builderNotes}
                  notation={notation}
                  onToggleNote={toggleBuilderNote}
                />
                <button
                  className="tap-target mt-1 rounded-md border border-slate-300 px-2 py-1 text-xs dark:border-slate-700"
                  onClick={() => setBuilderNotes(new Set())}
                >
                  Limpar
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {pickerOpen && onSelectChord && (
        <ChordPicker
          title="Ver outro acorde nos diagramas"
          currentKey={currentKey}
          notation={notation}
          currentChord={activeChord}
          onSelect={(chord) => {
            onSelectChord(chord)
            setPickerOpen(false)
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  )
}
