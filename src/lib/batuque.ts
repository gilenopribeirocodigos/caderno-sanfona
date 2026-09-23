import trianguloFechadoUrl from '@/assets/sounds/triangulo-fechado.wav'
import trianguloAbertoUrl from '@/assets/sounds/triangulo-aberto.wav'
import zabumbaMalletUrl from '@/assets/sounds/zabumba-mallet.wav'
import zabumbaMalletAbertoUrl from '@/assets/sounds/zabumba-mallet-aberto.wav'
import zabumbaBacalhauForteUrl from '@/assets/sounds/zabumba-bacalhau-forte.wav'
import zabumbaBacalhauSuaveUrl from '@/assets/sounds/zabumba-bacalhau-suave.wav'
import kickUrl from '@/assets/sounds/kick.wav'
import snareUrl from '@/assets/sounds/snare.wav'
import hihatUrl from '@/assets/sounds/hihat.wav'

// O triângulo e a zabumba têm dois (ou mais) toques fisicamente diferentes
// no instrumento de verdade — cada um vira uma "voz" própria aqui, com seu
// próprio som e sua própria posição no compasso. Isso é o que permite
// imitar a técnica real: abafar a maioria das notas do triângulo e deixar
// só o acento soar aberto; ou tocar a primeira zabumbada abafada e a
// segunda aberta, como descrito na literatura sobre baião.
export type BatuqueInstrument =
  | 'trianguloFechado'
  | 'trianguloAberto'
  | 'zabumbaMallet'
  | 'zabumbaMalletAberto'
  | 'zabumbaBacalhauForte'
  | 'zabumbaBacalhauSuave'
  | 'kick'
  | 'snare'
  | 'hihat'

export type InstrumentGroup = 'triangulo' | 'zabumba' | 'bateria'

export const INSTRUMENT_GROUPS: { id: InstrumentGroup; label: string }[] = [
  { id: 'triangulo', label: 'Triângulo' },
  { id: 'zabumba', label: 'Zabumba' },
  { id: 'bateria', label: 'Bateria' },
]

/** Uma variação de batida para um instrumento, dentro de um ritmo — cada
 * grupo (triângulo/zabumba/bateria) escolhe a sua independentemente,
 * igual ao eBatuque ("baião 1", "baião 2"...). O campo `source` diz de
 * onde veio: quando aponta pra uma referência bibliográfica real, é uma
 * reconstrução (a partir de descrição em texto, sem ver a partitura) de
 * um padrão publicado; quando diz "aproximação própria", fui eu que
 * inventei a partir da sensação geral do ritmo, sem uma fonte específica. */
export interface Variation {
  id: string
  label: string
  source: string
  hits: Partial<Record<BatuqueInstrument, boolean[]>>
}

export interface Rhythm {
  id: string
  label: string
  /** Semicolcheias por compasso (2/4 = 8 semicolcheias). */
  stepsPerBar: number
  defaultBpm: number
  variations: Record<InstrumentGroup, Variation[]>
}

const SOM_COMPRADO =
  'som real comprado pelo usuário — "BPL Vol. 02 (Baião and Côco)" (brazilianmusician/Gumroad), percussionista Firmino'

export const RHYTHMS: Rhythm[] = [
  {
    id: 'baiao',
    label: 'Baião',
    stepsPerBar: 8,
    defaultBpm: 100,
    variations: {
      triangulo: [
        {
          id: 't1',
          label: 'Corrido (semicolcheias)',
          source: `Padrão: That Drum Blog, "A forró primer pt. 2" ("all four subdivisions on the hi-hat"). Som: ${SOM_COMPRADO} — fechado nas semicolcheias comuns, aberto no acento do tempo forte.`,
          hits: {
            trianguloFechado: [false, true, true, true, false, true, true, true],
            trianguloAberto: [true, false, false, false, true, false, false, false],
          },
        },
        {
          id: 't2',
          label: '"1 e & " com acento aberto',
          source: `Padrão: That Drum Blog, mesma fonte (toca 1-e-&, fecha no "a"). Som: ${SOM_COMPRADO} — acento aberto no "&".`,
          hits: {
            trianguloFechado: [true, true, false, false, true, true, false, false],
            trianguloAberto: [false, false, true, false, false, false, true, false],
          },
        },
        {
          id: 't3',
          label: 'Com quebra (simples)',
          source: `Padrão: aproximação própria. Som: ${SOM_COMPRADO}`,
          hits: {
            trianguloFechado: [false, true, false, true, true, true, false, true],
            trianguloAberto: [true, false, false, false, false, false, false, false],
          },
        },
      ],
      zabumba: [
        {
          id: 'z1',
          label: 'Padrão',
          source: `Padrão: That Drum Blog — "the first stroke is muted, while the second is open" (a 1ª zabumbada abafada, a 2ª aberta). Som: ${SOM_COMPRADO}`,
          hits: {
            zabumbaMallet: [true, false, false, false, false, false, false, false],
            zabumbaMalletAberto: [false, false, false, false, true, false, false, false],
            zabumbaBacalhauForte: [false, false, false, false, false, false, false, true],
            zabumbaBacalhauSuave: [false, false, true, false, false, true, false, false],
          },
        },
        {
          id: 'z2',
          label: 'Sincopada',
          source: `Padrão: aproximação própria. Som: ${SOM_COMPRADO} — bacalhau forte no par sincopado final`,
          hits: {
            zabumbaMallet: [true, false, false, false, false, false, false, false],
            zabumbaMalletAberto: [false, false, false, false, true, false, false, false],
            zabumbaBacalhauForte: [false, false, false, false, false, false, true, true],
            zabumbaBacalhauSuave: [false, false, false, true, false, false, false, false],
          },
        },
        {
          id: 'z3',
          label: 'Enxuta',
          source: `Padrão: aproximação própria. Som: ${SOM_COMPRADO}`,
          hits: {
            zabumbaMallet: [true, false, false, false, false, false, false, false],
            zabumbaMalletAberto: [false, false, false, false, true, false, false, false],
            zabumbaBacalhauForte: [false, false, false, false, false, true, false, false],
          },
        },
      ],
      bateria: [
        {
          id: 'b1',
          label: 'Padrão',
          source: 'aproximação própria, adaptação bumbo=zabumba/caixa=bacalhau/chimbal=triângulo (sons CC0, sem correspondente comprado)',
          hits: {
            kick: [true, false, false, false, true, false, false, false],
            snare: [false, false, false, false, false, false, false, true],
            hihat: [true, true, true, true, true, true, true, true],
          },
        },
        {
          id: 'b2',
          label: 'Com abertura',
          source: 'aproximação própria',
          hits: {
            kick: [true, false, false, false, true, false, false, false],
            snare: [false, false, false, true, false, false, true, false],
            hihat: [true, false, true, false, true, false, true, false],
          },
        },
        {
          id: 'b3',
          label: 'Minimalista',
          source: 'aproximação própria',
          hits: {
            kick: [true, false, false, false, true, false, false, false],
            snare: [false, false, false, false, false, false, true, false],
            hihat: [true, false, false, false, true, false, false, false],
          },
        },
      ],
    },
  },
  {
    id: 'xote',
    label: 'Xote',
    stepsPerBar: 8,
    defaultBpm: 80,
    variations: {
      triangulo: [
        {
          id: 't1',
          label: 'Colcheias (condução simples)',
          source: `Padrão: Garanhão & Barsalini (2023), análise de Cleber Almeida em "Siri na Lata": "condução de chimbal em colcheias". Som: ${SOM_COMPRADO} — aberto nos tempos fortes, fechado nos contratempos`,
          hits: {
            trianguloFechado: [false, false, true, false, false, false, true, false],
            trianguloAberto: [true, false, false, false, true, false, false, false],
          },
        },
        {
          id: 't2',
          label: 'Nos tempos',
          source: `Padrão: Santos (2013) via Garanhão & Barsalini (2023). Som: ${SOM_COMPRADO} — aberto, por ser o toque de acento`,
          hits: { trianguloAberto: [true, false, false, false, true, false, false, false] },
        },
        {
          id: 't3',
          label: 'No contratempo',
          source: `Padrão: Gomes (2005) via Garanhão & Barsalini (2023). Som: ${SOM_COMPRADO} — fechado, contratempo mais discreto`,
          hits: { trianguloFechado: [false, false, true, false, false, false, true, false] },
        },
      ],
      zabumba: [
        {
          id: 'z1',
          label: 'Padrão (Gomes)',
          source: `Padrão: Gomes (2005) via Garanhão & Barsalini (2023): "semínima no primeiro tempo, duas colcheias no segundo". Som: ${SOM_COMPRADO}`,
          hits: {
            zabumbaMallet: [true, false, false, false, true, false, true, false],
            zabumbaBacalhauForte: [false, false, false, false, false, false, false, false],
            zabumbaBacalhauSuave: [false, false, false, false, false, false, true, false],
          },
        },
        {
          id: 'z2',
          label: 'Levada invertida (Cleber Almeida)',
          source: `Padrão: Garanhão & Barsalini (2023): "dois bumbos (colcheias) no primeiro tempo e semínima no segundo". Som: ${SOM_COMPRADO}`,
          hits: {
            zabumbaMallet: [true, false, true, false, true, false, false, false],
            zabumbaBacalhauSuave: [false, false, false, false, false, true, false, false],
          },
        },
        {
          id: 'z3',
          label: 'Mais preenchida',
          source: `Padrão: aproximação própria. Som: ${SOM_COMPRADO}`,
          hits: {
            zabumbaMallet: [true, false, false, false, true, false, true, false],
            zabumbaBacalhauForte: [false, false, true, false, false, false, false, false],
            zabumbaBacalhauSuave: [false, false, false, false, false, false, true, false],
          },
        },
      ],
      bateria: [
        {
          id: 'b1',
          label: 'Padrão',
          source: 'aproximação própria, adaptação bumbo=zabumba/caixa=bacalhau/chimbal=triângulo (sons CC0, sem correspondente comprado)',
          hits: {
            kick: [true, false, false, false, true, false, true, false],
            snare: [false, false, false, false, false, false, true, false],
            hihat: [true, false, true, false, true, false, true, false],
          },
        },
        {
          id: 'b2',
          label: 'Com chimbau cheio',
          source: 'aproximação própria',
          hits: {
            kick: [true, false, false, false, true, false, true, false],
            snare: [false, false, false, false, false, false, true, false],
            hihat: [true, true, true, true, true, true, true, true],
          },
        },
        {
          id: 'b3',
          label: 'Minimalista',
          source: 'aproximação própria',
          hits: {
            kick: [true, false, false, false, true, false, false, false],
            snare: [false, false, false, false, false, false, true, false],
            hihat: [true, false, false, false, true, false, false, false],
          },
        },
      ],
    },
  },
]

export function rhythmForLabel(label: string | undefined): Rhythm {
  const found = RHYTHMS.find((r) => r.label.toLowerCase() === label?.toLowerCase())
  return found ?? RHYTHMS[0]
}

const SAMPLE_URLS: Record<BatuqueInstrument, string> = {
  trianguloFechado: trianguloFechadoUrl,
  trianguloAberto: trianguloAbertoUrl,
  zabumbaMallet: zabumbaMalletUrl,
  zabumbaMalletAberto: zabumbaMalletAbertoUrl,
  zabumbaBacalhauForte: zabumbaBacalhauForteUrl,
  zabumbaBacalhauSuave: zabumbaBacalhauSuaveUrl,
  kick: kickUrl,
  snare: snareUrl,
  hihat: hihatUrl,
}

export type VariationSelection = Record<InstrumentGroup, string>

export function defaultSelection(rhythm: Rhythm): VariationSelection {
  return {
    triangulo: rhythm.variations.triangulo[0].id,
    zabumba: rhythm.variations.zabumba[0].id,
    bateria: rhythm.variations.bateria[0].id,
  }
}

export interface GroupSettings {
  bpm: number
  volume: number
}

export function defaultGroupSettings(rhythm: Rhythm): Record<InstrumentGroup, GroupSettings> {
  return {
    triangulo: { bpm: rhythm.defaultBpm, volume: 0.8 },
    zabumba: { bpm: rhythm.defaultBpm, volume: 0.8 },
    bateria: { bpm: rhythm.defaultBpm, volume: 0.8 },
  }
}

// Agenda os toques com antecedência (lookahead) em vez de tocar cada som
// no momento exato via setTimeout — setTimeout sozinho atrasa/tranca
// quando a aba fica em segundo plano ou a thread principal ocupada,
// resultando num ritmo "capenga". O relógio real de tempo é o do próprio
// AudioContext (currentTime), preciso mesmo sob essas condições. Cada
// grupo de instrumento tem seu próprio relógio (currentStep/nextStepTime)
// porque, a pedido, o BPM de cada um pode ser diferente — o que significa
// que eles vão de fato saindo de sincronia um com o outro ao longo do
// tempo, de propósito.
const LOOKAHEAD_MS = 25
const SCHEDULE_AHEAD_S = 0.1

interface GroupClock {
  nextStepTime: number
  currentStep: number
}

export class BatuqueEngine {
  private ctx: AudioContext | null = null
  private buffers: Partial<Record<BatuqueInstrument, AudioBuffer>> = {}
  private groupGains: Partial<Record<InstrumentGroup, GainNode>> = {}
  private groupClocks: Partial<Record<InstrumentGroup, GroupClock>> = {}
  private timerId: ReturnType<typeof setInterval> | null = null
  private rhythm: Rhythm = RHYTHMS[0]
  private selection: VariationSelection = defaultSelection(RHYTHMS[0])
  private enabledGroups: Set<InstrumentGroup> = new Set(['triangulo', 'zabumba'])
  private groupSettings: Record<InstrumentGroup, GroupSettings> = defaultGroupSettings(RHYTHMS[0])
  private onStep?: (group: InstrumentGroup, step: number) => void

  get isPlaying(): boolean {
    return this.timerId !== null
  }

  async start(
    rhythm: Rhythm,
    selection: VariationSelection,
    enabledGroups: Set<InstrumentGroup>,
    groupSettings: Record<InstrumentGroup, GroupSettings>,
    onStep?: (group: InstrumentGroup, step: number) => void,
  ): Promise<void> {
    this.stop()
    this.rhythm = rhythm
    this.selection = selection
    this.enabledGroups = enabledGroups
    this.groupSettings = groupSettings
    this.onStep = onStep

    if (!this.ctx) this.ctx = new AudioContext()
    if (this.ctx.state === 'suspended') await this.ctx.resume()
    await this.loadBuffers()

    for (const group of enabledGroups) this.ensureGroupRunning(group)

    this.timerId = setInterval(() => this.scheduler(), LOOKAHEAD_MS)
  }

  setGroupBpm(group: InstrumentGroup, bpm: number): void {
    this.groupSettings[group].bpm = bpm
  }

  setGroupVolume(group: InstrumentGroup, volume: number): void {
    this.groupSettings[group].volume = volume
    const gain = this.groupGains[group]
    if (gain) gain.gain.value = volume
  }

  setRhythm(rhythm: Rhythm): void {
    this.rhythm = rhythm
  }

  setSelection(selection: VariationSelection): void {
    this.selection = selection
  }

  setEnabledGroups(groups: Set<InstrumentGroup>): void {
    this.enabledGroups = groups
    if (this.timerId !== null) {
      for (const group of groups) this.ensureGroupRunning(group)
    }
  }

  stop(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId)
      this.timerId = null
    }
    for (const gain of Object.values(this.groupGains)) gain?.disconnect()
    this.groupGains = {}
    this.groupClocks = {}
  }

  private ensureGroupRunning(group: InstrumentGroup): void {
    if (!this.ctx || this.groupClocks[group]) return
    const gain = this.ctx.createGain()
    gain.gain.value = this.groupSettings[group].volume
    gain.connect(this.ctx.destination)
    this.groupGains[group] = gain
    this.groupClocks[group] = { nextStepTime: this.ctx.currentTime + 0.05, currentStep: 0 }
  }

  private async loadBuffers(): Promise<void> {
    if (!this.ctx) return
    const entries = Object.entries(SAMPLE_URLS) as [BatuqueInstrument, string][]
    await Promise.all(
      entries.map(async ([instrument, url]) => {
        if (this.buffers[instrument]) return
        const res = await fetch(url)
        const arrayBuffer = await res.arrayBuffer()
        this.buffers[instrument] = await this.ctx!.decodeAudioData(arrayBuffer)
      }),
    )
  }

  private stepDurationSeconds(group: InstrumentGroup): number {
    // 4 semicolcheias por semínima (tempo/BPM contado em semínimas).
    return 60 / this.groupSettings[group].bpm / 4
  }

  private scheduler(): void {
    if (!this.ctx) return
    for (const group of this.enabledGroups) {
      const clock = this.groupClocks[group]
      if (!clock) continue
      const stepDuration = this.stepDurationSeconds(group)
      while (clock.nextStepTime < this.ctx.currentTime + SCHEDULE_AHEAD_S) {
        this.scheduleStep(group, clock.currentStep, clock.nextStepTime)
        clock.nextStepTime += stepDuration
        clock.currentStep = (clock.currentStep + 1) % this.rhythm.stepsPerBar
      }
    }
  }

  private scheduleStep(group: InstrumentGroup, step: number, time: number): void {
    const gain = this.groupGains[group]
    const variation = this.rhythm.variations[group].find((v) => v.id === this.selection[group])
    if (gain && variation) {
      for (const [instrument, hits] of Object.entries(variation.hits) as [BatuqueInstrument, boolean[]][]) {
        if (!hits[step]) continue
        const buffer = this.buffers[instrument]
        if (!buffer || !this.ctx) continue
        const source = this.ctx.createBufferSource()
        source.buffer = buffer
        source.connect(gain)
        source.start(time)
      }
    }
    if (this.onStep && this.ctx) {
      const delayMs = Math.max(0, (time - this.ctx.currentTime) * 1000)
      setTimeout(() => this.onStep?.(group, step), delayMs)
    }
  }
}
