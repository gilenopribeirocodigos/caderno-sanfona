import { useEffect, useRef, useState } from 'react'
import {
  BatuqueEngine,
  defaultSelection,
  INSTRUMENT_GROUPS,
  RHYTHMS,
  rhythmForLabel,
  type InstrumentGroup,
  type VariationSelection,
} from '@/lib/batuque'

interface BatuqueControlProps {
  /** Ritmo e BPM da música, usados só para já vir com o padrão certo marcado. */
  songRhythm?: string
  songBpm?: number
}

/** Metrônomo + Batuque (item 76): toca zabumba, triângulo e/ou bateria no ritmo escolhido, junto com o Modo Tocar. */
export default function BatuqueControl({ songRhythm, songBpm }: BatuqueControlProps) {
  const [rhythmId, setRhythmId] = useState(() => rhythmForLabel(songRhythm).id)
  const rhythm = RHYTHMS.find((r) => r.id === rhythmId) ?? RHYTHMS[0]
  const [selection, setSelection] = useState<VariationSelection>(() => defaultSelection(rhythm))
  const [bpm, setBpm] = useState(songBpm ?? rhythm.defaultBpm)
  const [volume, setVolume] = useState(0.8)
  const [groups, setGroups] = useState<Set<InstrumentGroup>>(new Set(['triangulo', 'zabumba']))
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
    engineRef.current?.setRhythm(rhythm)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rhythmId])

  useEffect(() => {
    engineRef.current?.setSelection(selection)
  }, [selection])

  useEffect(() => {
    engineRef.current?.setEnabledGroups(groups)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups])

  function changeRhythm(id: string) {
    setRhythmId(id)
    const next = RHYTHMS.find((r) => r.id === id) ?? RHYTHMS[0]
    setSelection(defaultSelection(next))
  }

  async function toggle() {
    const engine = engineRef.current!
    if (playing) {
      engine.stop()
      setPlaying(false)
    } else {
      await engine.start(rhythm, selection, bpm, volume, groups, setBeat)
      setPlaying(true)
    }
  }

  function toggleGroup(id: InstrumentGroup) {
    setGroups((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-2 border-t border-slate-200 bg-surface px-3 py-2 text-xs dark:border-slate-800">
      <div className="flex flex-wrap items-center gap-2">
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
          value={rhythmId}
          onChange={(e) => changeRhythm(e.target.value)}
        >
          {RHYTHMS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
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
            style={{ opacity: beat % (rhythm.stepsPerBar / 2) === 0 ? 1 : 0.25 }}
          />
        )}
      </div>

      {/* Cada instrumento liga/desliga por conta própria, igual ao
          eBatuque — e cada um tem suas próprias variações de batida
          dentro do ritmo escolhido, pra combinar como preferir. */}
      <div className="flex flex-col gap-1">
        {INSTRUMENT_GROUPS.map((g) => (
          <div key={g.id} className="flex items-center gap-1">
            <button
              className={`tap-target w-24 shrink-0 rounded-md border px-2 py-1 ${
                groups.has(g.id)
                  ? 'border-[var(--color-brand)] bg-[var(--color-brand)] text-white'
                  : 'border-slate-300 text-slate-500 dark:border-slate-700 dark:text-slate-400'
              }`}
              onClick={() => toggleGroup(g.id)}
            >
              {g.label}
            </button>
            <select
              className="tap-target flex-1 rounded-md border border-slate-300 px-1 py-1 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800"
              disabled={!groups.has(g.id)}
              value={selection[g.id]}
              onChange={(e) => setSelection((prev) => ({ ...prev, [g.id]: e.target.value }))}
            >
              {rhythm.variations[g.id].map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}
