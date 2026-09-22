import { useEffect, useRef, useState } from 'react'
import { BATUQUE_PATTERNS, BatuqueEngine, patternForRhythm } from '@/lib/batuque'

interface BatuqueControlProps {
  /** Ritmo e BPM da música, usados só para já vir com o padrão certo marcado. */
  songRhythm?: string
  songBpm?: number
}

/** Metrônomo + Batuque (item 76): toca zabumba e triângulo no ritmo escolhido, junto com o Modo Tocar. */
export default function BatuqueControl({ songRhythm, songBpm }: BatuqueControlProps) {
  const [patternId, setPatternId] = useState(() => patternForRhythm(songRhythm).id)
  const pattern = BATUQUE_PATTERNS.find((p) => p.id === patternId) ?? BATUQUE_PATTERNS[0]
  const [bpm, setBpm] = useState(songBpm ?? pattern.defaultBpm)
  const [volume, setVolume] = useState(0.8)
  const [playing, setPlaying] = useState(false)
  const [beat, setBeat] = useState(0)
  const engineRef = useRef<BatuqueEngine>()

  if (!engineRef.current) engineRef.current = new BatuqueEngine()

  // Sai da tela (ex: troca de música) sempre para o som — nunca deixar
  // tocando "fantasma" em segundo plano sem controle visível.
  useEffect(() => () => engineRef.current?.stop(), [])

  useEffect(() => {
    engineRef.current?.setBpm(bpm)
  }, [bpm])

  useEffect(() => {
    engineRef.current?.setVolume(volume)
  }, [volume])

  useEffect(() => {
    engineRef.current?.setPattern(pattern)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patternId])

  async function toggle() {
    const engine = engineRef.current!
    if (playing) {
      engine.stop()
      setPlaying(false)
    } else {
      await engine.start(pattern, bpm, volume, setBeat)
      setPlaying(true)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 bg-surface px-3 py-2 text-xs dark:border-slate-800">
      <button
        className={`tap-target rounded-md border px-3 py-1 font-medium ${
          playing ? 'border-red-400 text-red-500' : 'border-slate-300 dark:border-slate-700'
        }`}
        onClick={toggle}
      >
        {playing ? '⏸ Parar batuque' : '🥁 Tocar batuque'}
      </button>

      <select
        className="tap-target rounded-md border border-slate-300 px-1 py-1 dark:border-slate-700 dark:bg-slate-800"
        value={patternId}
        onChange={(e) => setPatternId(e.target.value)}
      >
        {BATUQUE_PATTERNS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-1">
        <button
          className="tap-target rounded-md border border-slate-300 px-2 py-1 dark:border-slate-700"
          onClick={() => setBpm((b) => Math.max(40, b - 4))}
        >
          −
        </button>
        <span className="w-14 text-center font-medium">{bpm} BPM</span>
        <button
          className="tap-target rounded-md border border-slate-300 px-2 py-1 dark:border-slate-700"
          onClick={() => setBpm((b) => Math.min(220, b + 4))}
        >
          +
        </button>
      </div>

      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={volume}
        onChange={(e) => setVolume(Number(e.target.value))}
        className="w-16"
        aria-label="Volume do batuque"
      />

      {playing && (
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-brand)]"
          style={{ opacity: beat % (pattern.stepsPerBar / 2) === 0 ? 1 : 0.25 }}
        />
      )}
    </div>
  )
}
