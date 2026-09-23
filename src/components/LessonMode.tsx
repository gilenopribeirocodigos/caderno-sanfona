import { useEffect, useMemo, useRef, useState } from 'react'
import type { AccordionType, ChordNotation, Song } from '@/types'
import { buildLessonChunks } from '@/utils/lessonChunks'
import { uniqueChordsInSong } from '@/utils/chordpro'
import ChordSheet from './ChordSheet'
import ChordCard from './ChordCard'

interface LessonModeProps {
  song: Song
  notation: ChordNotation
  accordionType: AccordionType
  onExit: () => void
  onNextSong?: () => void
  onPreviousSong?: () => void
}

const SECONDS_OPTIONS = [5, 8, 10, 15, 20, 30]

/**
 * Modo Aula (item "ensinar alguém devagar"): mostra a letra em pedaços
 * pequenos, um de cada vez, em letra bem grande, com o teclado + baixo do
 * acorde do trecho sempre visíveis ao lado. Como as duas mãos ficam
 * ocupadas tocando sanfona (a mão do baixo, inclusive, presa na alça —
 * nunca livre pra tocar na tela), o avanço principal é automático por
 * tempo; "Anterior/Próximo" continuam disponíveis pra ajustar manualmente
 * quando alguém está livre pra tocar (ex: o professor). As mesmas teclas
 * de um pedal Bluetooth de "virar página" (seta, Page Up/Down) também
 * avançam — já funciona antes mesmo de existir um pedal de verdade.
 */
export default function LessonMode({ song, notation, accordionType, onExit, onNextSong, onPreviousSong }: LessonModeProps) {
  const chunks = useMemo(() => buildLessonChunks(song.chordData.lines ?? []), [song])
  const [chunkIndex, setChunkIndex] = useState(0)
  const [auto, setAuto] = useState(false)
  const [seconds, setSeconds] = useState(10)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  const chunk = chunks[chunkIndex]
  const chunkChords = useMemo(() => (chunk ? uniqueChordsInSong(chunk.lines) : []), [chunk])

  const isFirst = chunkIndex === 0
  const isLast = chunkIndex >= chunks.length - 1

  function next() {
    if (isLast) {
      onNextSong?.()
      return
    }
    setChunkIndex((i) => Math.min(chunks.length - 1, i + 1))
  }
  function previous() {
    if (isFirst) {
      onPreviousSong?.()
      return
    }
    setChunkIndex((i) => Math.max(0, i - 1))
  }

  useEffect(() => {
    setChunkIndex(0)
  }, [song.id])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      if (target?.matches('input, select, textarea, [contenteditable="true"]')) return
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault()
        next()
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        previous()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chunks.length, chunkIndex, onNextSong, onPreviousSong])

  useEffect(() => {
    if (!auto) return
    intervalRef.current = setInterval(() => {
      setChunkIndex((i) => {
        if (i >= chunks.length - 1) {
          setAuto(false)
          return i
        }
        return i + 1
      })
    }, seconds * 1000)
    return () => clearInterval(intervalRef.current)
  }, [auto, seconds, chunks.length])

  if (chunks.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-sm text-slate-500">
        <p>Essa música ainda não tem letra suficiente pro Modo Aula.</p>
        <button className="tap-target rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700" onClick={onExit}>
          Voltar
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface-alt">
      <div className="safe-top flex shrink-0 items-center justify-between border-b border-slate-200 bg-surface px-3 py-2 text-xs dark:border-slate-800">
        <div>
          <p className="font-semibold">🎓 Modo Aula — {song.title}</p>
          <p className="text-slate-500">
            Trecho {chunkIndex + 1} de {chunks.length}
            {chunk.section ? ` · ${chunk.section}` : ''}
          </p>
        </div>
        <button className="tap-target rounded-md border border-slate-300 px-2 py-1.5 dark:border-slate-700" onClick={onExit}>
          ✕ Sair
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center gap-6 overflow-y-auto p-4 md:justify-center">
        <div className="w-full max-w-xl">
          <ChordSheet lines={chunk.lines} notation={notation} fontSize={32} chordSize={26} />
        </div>
        {chunkChords.length > 0 && (
          <div className="flex flex-wrap justify-center gap-4">
            {chunkChords.map((c) => (
              <ChordCard key={c} chord={c} accordionType={accordionType} notation={notation} size="lg" />
            ))}
          </div>
        )}
      </div>

      <div className="safe-bottom flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-surface px-3 py-2 text-xs dark:border-slate-800">
        <div className="flex items-center gap-1">
          <button
            className="tap-target rounded-md border border-slate-300 px-3 py-2 text-sm disabled:opacity-30 dark:border-slate-700"
            disabled={isFirst && !onPreviousSong}
            onClick={previous}
          >
            {isFirst && onPreviousSong ? '◀ Música anterior' : '◀ Anterior'}
          </button>
          <button
            className="tap-target rounded-md border border-slate-300 px-3 py-2 text-sm disabled:opacity-30 dark:border-slate-700"
            disabled={isLast && !onNextSong}
            onClick={next}
          >
            {isLast && onNextSong ? 'Próxima música ▶' : 'Próximo ▶'}
          </button>
        </div>
        <div className="flex items-center gap-1">
          <select
            className="tap-target rounded-md border border-slate-300 px-1 py-1.5 dark:border-slate-700 dark:bg-slate-800"
            value={seconds}
            onChange={(e) => setSeconds(Number(e.target.value))}
            disabled={auto}
          >
            {SECONDS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}s por trecho
              </option>
            ))}
          </select>
          <button
            className={`tap-target rounded-md border px-3 py-2 font-medium ${
              auto ? 'border-red-400 text-red-500' : 'border-slate-300 dark:border-slate-700'
            }`}
            onClick={() => setAuto((a) => !a)}
          >
            {auto ? '⏸ Parar automático' : '▶ Automático'}
          </button>
        </div>
      </div>
    </div>
  )
}
