import { useEffect, useRef, useState } from 'react'
import {
  BatuqueEngine,
  defaultGroupSettings,
  defaultSelection,
  INSTRUMENT_GROUPS,
  loopOptionsFor,
  RHYTHMS,
  rhythmForLabel,
  type GroupSettings,
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
  const [groupSettings, setGroupSettings] = useState<Record<InstrumentGroup, GroupSettings>>(() => {
    const base = defaultGroupSettings(rhythm)
    if (songBpm) for (const g of INSTRUMENT_GROUPS) base[g.id].bpm = songBpm
    return base
  })
  // Grupo -> id da opção de loop escolhida ("groove real"); ausente = usa o
  // padrão programado normalmente. Só existe pra quem tem loop comprado.
  const [loopChoice, setLoopChoice] = useState<Partial<Record<InstrumentGroup, string>>>({})
  const [groups, setGroups] = useState<Set<InstrumentGroup>>(new Set(['triangulo', 'zabumba']))
  const [playing, setPlaying] = useState(false)
  const [beats, setBeats] = useState<Partial<Record<InstrumentGroup, number>>>({})
  const [showSources, setShowSources] = useState(false)
  const engineRef = useRef<BatuqueEngine>()

  if (!engineRef.current) engineRef.current = new BatuqueEngine()

  function loopUrlsFor(choice: Partial<Record<InstrumentGroup, string>>): Partial<Record<InstrumentGroup, string>> {
    const urls: Partial<Record<InstrumentGroup, string>> = {}
    for (const g of INSTRUMENT_GROUPS) {
      const optionId = choice[g.id]
      if (!optionId) continue
      const option = loopOptionsFor(rhythmId, g.id).find((o) => o.id === optionId)
      if (option) urls[g.id] = option.url
    }
    return urls
  }

  // Sai da tela (ex: troca de música) sempre para o som — nunca deixar
  // tocando "fantasma" em segundo plano sem controle visível.
  useEffect(() => () => engineRef.current?.stop(), [])

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
    setGroupSettings(defaultGroupSettings(next))
    setLoopChoice({})
  }

  function onStep(group: InstrumentGroup, step: number) {
    setBeats((prev) => ({ ...prev, [group]: step }))
  }

  async function toggle() {
    const engine = engineRef.current!
    if (playing) {
      engine.stop()
      setPlaying(false)
    } else {
      await engine.start(rhythm, selection, groups, groupSettings, loopUrlsFor(loopChoice), onStep)
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

  function setBpm(id: InstrumentGroup, bpm: number) {
    setGroupSettings((prev) => ({ ...prev, [id]: { ...prev[id], bpm } }))
    engineRef.current?.setGroupBpm(id, bpm)
  }

  function setVolume(id: InstrumentGroup, volume: number) {
    setGroupSettings((prev) => ({ ...prev, [id]: { ...prev[id], volume } }))
    engineRef.current?.setGroupVolume(id, volume)
  }

  function toggleLoopMode(id: InstrumentGroup) {
    const options = loopOptionsFor(rhythmId, id)
    if (options.length === 0) return
    setLoopChoice((prev) => {
      const next = { ...prev }
      if (next[id]) {
        delete next[id]
        engineRef.current?.setLoopUrl(id, null)
      } else {
        next[id] = options[0].id
        engineRef.current?.setLoopUrl(id, options[0].url)
      }
      return next
    })
  }

  function setLoopOption(id: InstrumentGroup, optionId: string) {
    setLoopChoice((prev) => ({ ...prev, [id]: optionId }))
    const option = loopOptionsFor(rhythmId, id).find((o) => o.id === optionId)
    if (option) engineRef.current?.setLoopUrl(id, option.url)
  }

  const currentVariation = (id: InstrumentGroup) => rhythm.variations[id].find((v) => v.id === selection[id])

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

        <button
          className="tap-target rounded-md border border-slate-300 px-2 py-1 text-slate-500 dark:border-slate-700 dark:text-slate-400"
          onClick={() => setShowSources((v) => !v)}
          title="Mostra de onde veio cada variação, pra você conferir a fonte"
        >
          {showSources ? 'Ocultar fontes' : 'De onde veio?'}
        </button>
      </div>

      {/* Cada instrumento liga/desliga por conta própria, com sua própria
          variação de batida, BPM e volume — totalmente independentes um
          do outro (a pedido: sim, isso significa que eles podem sair de
          sincronia entre si ao longo do tempo). Quem tem loop comprado
          ganha a opção extra "Groove real". */}
      <div className="flex flex-col gap-2">
        {INSTRUMENT_GROUPS.map((g) => {
          const loopOptions = loopOptionsFor(rhythmId, g.id)
          const usingLoop = Boolean(loopChoice[g.id])
          return (
            <div key={g.id} className="flex flex-col gap-1 rounded-md border border-slate-200 p-2 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
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

                {usingLoop ? (
                  <select
                    className="tap-target flex-1 rounded-md border border-slate-300 px-1 py-1 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800"
                    disabled={!groups.has(g.id)}
                    value={loopChoice[g.id]}
                    onChange={(e) => setLoopOption(g.id, e.target.value)}
                  >
                    {loopOptions.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : (
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
                )}

                {loopOptions.length > 0 && (
                  <button
                    className={`tap-target shrink-0 rounded-md border px-2 py-1 text-[11px] ${
                      usingLoop
                        ? 'border-amber-500 bg-amber-500 text-white'
                        : 'border-slate-300 text-slate-500 dark:border-slate-700 dark:text-slate-400'
                    }`}
                    disabled={!groups.has(g.id)}
                    onClick={() => toggleLoopMode(g.id)}
                    title="Toca o loop gravado de verdade pelo percussionista, em vez do padrão programado (BPM fica preso ao andamento do loop)"
                  >
                    🎙 Groove real
                  </button>
                )}

                {playing && groups.has(g.id) && (
                  <span
                    className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-brand)]"
                    style={{ opacity: (beats[g.id] ?? 0) % (rhythm.stepsPerBar / 2) === 0 ? 1 : 0.25 }}
                  />
                )}
              </div>

              {!usingLoop && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      className="tap-target rounded-md border border-slate-300 px-2 py-0.5 dark:border-slate-700"
                      disabled={!groups.has(g.id)}
                      onClick={() => setBpm(g.id, Math.max(40, groupSettings[g.id].bpm - 4))}
                    >
                      −
                    </button>
                    <span className="w-16 text-center">{groupSettings[g.id].bpm} BPM</span>
                    <button
                      className="tap-target rounded-md border border-slate-300 px-2 py-0.5 dark:border-slate-700"
                      disabled={!groups.has(g.id)}
                      onClick={() => setBpm(g.id, Math.min(220, groupSettings[g.id].bpm + 4))}
                    >
                      +
                    </button>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={groupSettings[g.id].volume}
                    disabled={!groups.has(g.id)}
                    onChange={(e) => setVolume(g.id, Number(e.target.value))}
                    className="w-16 disabled:opacity-40"
                    aria-label={`Volume do ${g.label}`}
                  />
                </div>
              )}
              {usingLoop && (
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={groupSettings[g.id].volume}
                    disabled={!groups.has(g.id)}
                    onChange={(e) => setVolume(g.id, Number(e.target.value))}
                    className="w-16 disabled:opacity-40"
                    aria-label={`Volume do ${g.label}`}
                  />
                  <span className="text-[10px] text-slate-400">
                    loop gravado — BPM preso ao andamento escolhido acima
                  </span>
                </div>
              )}

              {showSources && !usingLoop && (
                <p className="text-[10px] italic text-slate-400">{currentVariation(g.id)?.source}</p>
              )}
              {showSources && usingLoop && (
                <p className="text-[10px] italic text-slate-400">
                  Loop real comprado — "BPL Vol. 02 (Baião and Côco)" (brazilianmusician/Gumroad), percussionista
                  Firmino.
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
