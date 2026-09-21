import { useState } from 'react'
import type { AccordionType } from '@/types'
import BassDiagram from './BassDiagram'
import VerticalKeyboard from './VerticalKeyboard'

interface AccordionVisualPanelProps {
  activeChord?: string
  accordionType: AccordionType
  onChangeAccordionType: (type: AccordionType) => void
  /** Deixa o usuário tocar direto no baixo para escolher o acorde, sem depender da letra. */
  onSelectChord?: (chord: string) => void
}

type ViewMode = 'both' | 'bass' | 'keyboard'

/** Modo Sanfona Visual (itens 13, 61-62, 72-75): baixos + teclado, com opção de ocultar partes. */
export default function AccordionVisualPanel({
  activeChord,
  accordionType,
  onChangeAccordionType,
  onSelectChord,
}: AccordionVisualPanelProps) {
  const [view, setView] = useState<ViewMode>('both')
  const [interactive, setInteractive] = useState(false)

  return (
    <div className="rounded-lg bg-surface p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">
          {activeChord ? `Acorde: ${activeChord}` : 'Toque num acorde da letra para ver aqui'}
        </p>
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
              title="Tocar direto no diagrama para escolher o acorde"
            >
              {interactive ? '✓ Tocar no diagrama' : 'Tocar no diagrama'}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-4">
        {(view === 'both' || view === 'bass') && (
          <BassDiagram
            accordionType={accordionType}
            activeChord={activeChord}
            interactive={interactive}
            onSelectChord={onSelectChord}
          />
        )}
        {(view === 'both' || view === 'keyboard') && <VerticalKeyboard activeChord={activeChord} />}
      </div>
    </div>
  )
}
