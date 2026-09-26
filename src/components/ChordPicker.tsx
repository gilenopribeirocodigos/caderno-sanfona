import { useState } from 'react'
import type { ChordNotation } from '@/types'
import {
  COMMON_CHORD_QUALITIES,
  COMMON_ROOTS,
  formatChordForDisplay,
  quickPaletteForKey,
} from '@/utils/chords'

interface ChordPickerProps {
  title: string
  currentKey: string
  notation: ChordNotation
  currentChord?: string
  onSelect: (chord: string) => void
  onRemove?: () => void
  onClose: () => void
  /** Texto da palavra clicada — quando presente, mostra um campo pra
   * corrigir ou apagar a palavra direto aqui, sem precisar do Modo texto. */
  wordText?: string
  onWordTextChange?: (text: string) => void
  onWordDelete?: () => void
}

/**
 * Seletor de acordes (item 8-10): mostra primeiro a paleta rápida da
 * tonalidade atual (graus I, ii, iii, IV, V, vi), com opção de expandir
 * para todos os acordes. Aparece como painel inferior, mais confiável
 * para toque em celular do que um popover flutuante.
 */
export default function ChordPicker({
  title,
  currentKey,
  notation,
  currentChord,
  onSelect,
  onRemove,
  onClose,
  wordText,
  onWordTextChange,
  onWordDelete,
}: ChordPickerProps) {
  const [showAll, setShowAll] = useState(false)
  const quickChords = quickPaletteForKey(currentKey)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="safe-bottom w-full max-w-2xl rounded-t-2xl bg-surface p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-500">{title}</h3>
          <button className="tap-target text-sm text-slate-500" onClick={onClose}>
            Fechar
          </button>
        </div>

        {onWordTextChange && (
          <div className="mb-3 flex items-center gap-2">
            <input
              type="text"
              className="tap-target min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              value={wordText ?? ''}
              placeholder="Palavra"
              aria-label="Editar palavra"
              onChange={(e) => onWordTextChange(e.target.value)}
            />
            {onWordDelete && (
              <button
                className="tap-target shrink-0 rounded-md border border-red-300 px-3 py-2 text-sm text-red-500"
                onClick={onWordDelete}
              >
                Apagar palavra
              </button>
            )}
          </div>
        )}

        {!showAll ? (
          <>
            <p className="mb-2 text-xs text-slate-400">Acordes prováveis do tom {currentKey}</p>
            <div className="grid grid-cols-3 gap-2">
              {quickChords.map(({ label, chord }) => (
                <button
                  key={chord}
                  className={`tap-target rounded-lg border px-2 py-3 text-sm font-medium ${
                    chord === currentChord
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                  onClick={() => onSelect(chord)}
                >
                  <span className="block text-xs text-slate-400">{label}</span>
                  {formatChordForDisplay(chord, notation)}
                </button>
              ))}
            </div>
            <button
              className="tap-target mt-3 w-full rounded-lg border border-slate-300 py-2 text-sm dark:border-slate-700"
              onClick={() => setShowAll(true)}
            >
              Todos os acordes
            </button>
          </>
        ) : (
          <>
            <p className="mb-2 text-xs text-slate-400">Todos os acordes</p>
            <div className="max-h-80 overflow-y-auto">
              {COMMON_ROOTS.map((root) => (
                <div key={root} className="mb-2 flex flex-wrap gap-1.5">
                  {COMMON_CHORD_QUALITIES.map((quality) => {
                    const chord = `${root}${quality}`
                    return (
                      <button
                        key={chord}
                        className={`tap-target rounded-md border px-2 py-1.5 text-xs font-medium ${
                          chord === currentChord
                            ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                            : 'border-slate-300 dark:border-slate-700'
                        }`}
                        onClick={() => onSelect(chord)}
                      >
                        {formatChordForDisplay(chord, notation)}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
            <button
              className="tap-target mt-2 w-full rounded-lg border border-slate-300 py-2 text-sm dark:border-slate-700"
              onClick={() => setShowAll(false)}
            >
              Voltar à paleta rápida
            </button>
          </>
        )}

        {currentChord && onRemove && (
          <button
            className="tap-target mt-3 w-full rounded-lg border border-red-300 py-2 text-sm text-red-500"
            onClick={onRemove}
          >
            Remover acorde
          </button>
        )}
      </div>
    </div>
  )
}
