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

// Só os instrumentos com groove real gravado aparecem — sem opção de
// padrão programado (a pedido). Escolhe sempre a variação com BPM mais
// próximo do andamento atual.
function pickClosestLoopOption(options: ReturnType<typeof loopOptionsFor>, bpm: number) {
  return options.reduce((best, option) => {
    const bestDistance = Math.abs(best.bpm - bpm)
    const optionDistance = Math.abs(option.bpm - bpm)
    return optionDistance < bestDistance ? option : best
  }, options[0])
}

function realGrooveGroups(rhythmId: string): InstrumentGroup[] {
  return INSTRUMENT_GROUPS.filter((g) => loopOptionsFor(rhythmId, g.id).length > 0).map((g) => g.id)
}

function defaultLoopChoice(rhythmId: string, bpm: number): Partial<Record<InstrumentGroup, string>> {
  const choice: Partial<Record<InstrumentGroup, string>> = {}
  for (const id of realGrooveGroups(rhythmId)) {
    choice[id] = pickClosestLoopOption(loopOptionsFor(rhythmId, id), bpm).id
  }
  return choice
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
  // Grupo -> id da opção de loop gravado tocando agora. Só existe pra quem
  // tem groove real — esses são os únicos instrumentos exibidos.
  const [loopChoice, setLoopChoice] = useState<Partial<Record<InstrumentGroup, string>>>(() =>
    defaultLoopChoice(rhythmId, songBpm ?? rhythm.defaultBpm),
  )
  const [groups, setGroups] = useState<Set<InstrumentGroup>>(
    () => new Set(realGrooveGroups(rhythmId).filter((id) => id === 'triangulo' || id === 'zabumba')),
  )
  const [playing, setPlaying] = useState(false)
  const [beats, setBeats] = useState<Partial<Record<InstrumentGroup, number>>>({})
  const [showSettings, setShowSettings] = useState(false)
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
    const bpm = songBpm ?? next.defaultBpm
    setLoopChoice(defaultLoopChoice(id, bpm))
    // Só ficam ligados os instrumentos que ainda têm groove real no ritmo novo.
    setGroups((prev) => new Set(realGrooveGroups(id).filter((g) => prev.has(g))))
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

  function setVolume(id: InstrumentGroup, volume: number) {
    setGroupSettings((prev) => ({ ...prev, [id]: { ...prev[id], volume } }))
    engineRef.current?.setGroupVolume(id, volume)
  }

  function setLoopOption(id: InstrumentGroup, optionId: string) {
    setLoopChoice((prev) => ({ ...prev, [id]: optionId }))
    const option = loopOptionsFor(rhythmId, id).find((o) => o.id === optionId)
    if (option) engineRef.current?.setLoopUrl(id, option.url)
  }



  function syncBatuque() {
    engineRef.current?.syncActiveGroups()
    setBeats({})
  }


  // Todo instrumento exibido toca groove real (loop gravado) — não existe
  // mais BPM "livre" pra combinar num intervalo.
  const tempoLabel = 'Loop gravado'

  return (
    <div className="shrink-0 border-t border-slate-200 bg-surface px-3 py-2 text-xs dark:border-slate-800">
      <div className="flex flex-wrap items-center gap-2">
        <button
          className={`tap-target shrink-0 rounded-md border px-2 py-1 font-medium ${
            playing ? 'border-red-400 text-red-500' : 'border-slate-300 dark:border-slate-700'
          }`}
          onClick={toggle}
        >
          {playing ? '⏸ Parar batuque' : '🥁 Tocar batuque'}
        </button>

        <select
          aria-label="Ritmo do batuque"
          className="tap-target min-w-0 flex-1 rounded-md border border-slate-300 px-1 py-1 dark:border-slate-700 dark:bg-slate-800 sm:flex-none"
          value={rhythmId}
          onChange={(e) => changeRhythm(e.target.value)}
        >
          {RHYTHMS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>

        <button className="tap-target shrink-0 rounded-md border border-slate-300 px-2 py-1 dark:border-slate-700" onClick={() => setShowSettings(true)} aria-label={`Ajustes do batuque, ${tempoLabel}`}>
          {tempoLabel}<span className="hidden sm:inline"> · Ajustes</span><span aria-hidden="true" className="sm:hidden"> ⚙</span>
        </button>

        <button
          className="tap-target shrink-0 rounded-md border border-slate-300 px-2 py-1 disabled:opacity-40 dark:border-slate-700"
          disabled={!playing || groups.size < 2}
          onClick={syncBatuque}
          title="Realinha somente os instrumentos que já estão ligados"
        >
          <span className="sm:hidden">Sinc</span><span className="hidden sm:inline">Sincronizar</span>
        </button>
      </div>

      {showSettings && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 sm:items-center" onClick={() => setShowSettings(false)}>
        <div role="dialog" aria-modal="true" aria-label="Ajustes do batuque" className="safe-bottom flex max-h-[75dvh] w-full max-w-2xl flex-col rounded-t-2xl bg-surface shadow-2xl sm:max-h-[85dvh] sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-2 dark:border-slate-800">
            <div><p className="font-semibold">Ajustes do batuque</p><p className="text-slate-500">{rhythm.label} · {tempoLabel}</p></div>
            <button className="tap-target rounded-md border border-slate-300 px-3 dark:border-slate-700" onClick={() => setShowSettings(false)}>Fechar</button>
          </div>
          <div className="min-h-0 overflow-y-auto p-3">

      {/* Cada instrumento liga/desliga por conta própria, com seu próprio
          groove real e volume — totalmente independentes um do outro (a
          pedido: sim, isso significa que eles podem sair de sincronia
          entre si ao longo do tempo). Só aparecem os instrumentos que têm
          loop gravado de verdade pro ritmo atual. */}
      <div className="flex flex-col gap-2">
        {INSTRUMENT_GROUPS.filter((g) => loopOptionsFor(rhythmId, g.id).length > 0).map((g) => {
          const loopOptions = loopOptionsFor(rhythmId, g.id)
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

                <span className="tap-target shrink-0 rounded-md border border-amber-500 bg-amber-500 px-2 py-1 text-[11px] text-white">
                  🎙 Groove real
                </span>

                {playing && groups.has(g.id) && (
                  <span
                    className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-brand)]"
                    style={{ opacity: (beats[g.id] ?? 0) % (rhythm.stepsPerBar / 2) === 0 ? 1 : 0.25 }}
                  />
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={g.id === 'zabumba' ? 1.5 : 1}
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
            </div>
          )
        })}
      </div>
          </div>
        </div>
      </div>}
    </div>
  )
}
