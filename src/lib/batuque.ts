import zabumbaBassUrl from '@/assets/sounds/zabumba-bass.mp3'
import zabumbaSlapUrl from '@/assets/sounds/zabumba-slap.mp3'
import trianguloUrl from '@/assets/sounds/triangulo.mp3'
import kickUrl from '@/assets/sounds/kick.wav'
import snareUrl from '@/assets/sounds/snare.wav'
import hihatUrl from '@/assets/sounds/hihat.wav'

export type BatuqueInstrument = 'zabumbaBass' | 'zabumbaSlap' | 'triangulo' | 'kick' | 'snare' | 'hihat'
export type InstrumentGroup = 'triangulo' | 'zabumba' | 'bateria'

export const INSTRUMENT_GROUPS: { id: InstrumentGroup; label: string }[] = [
  { id: 'triangulo', label: 'Triângulo' },
  { id: 'zabumba', label: 'Zabumba' },
  { id: 'bateria', label: 'Bateria' },
]

/** Uma variação de batida para um instrumento, dentro de um ritmo — cada
 * grupo (triângulo/zabumba/bateria) escolhe a sua independentemente,
 * igual ao eBatuque ("baião 1", "baião 2"...). */
export interface Variation {
  id: string
  label: string
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

// Variações de partida comuns a esses dois ritmos (a base do forró
// nordestino). Não são partituras oficiais — é o feijão-com-arroz de cada
// ritmo, dá pra ajustar depois. A zabumba tem dois toques (grave, com a
// baqueta grossa, e agudo/seco, com a fina) que se revezam; o triângulo
// marca a subdivisão por cima; a bateria (bumbo/caixa/chimbau) segue o
// mesmo desenho, para quem preferir esse timbre.
export const RHYTHMS: Rhythm[] = [
  {
    id: 'baiao',
    label: 'Baião',
    stepsPerBar: 8,
    defaultBpm: 100,
    variations: {
      triangulo: [
        { id: 't1', label: 'Corrido (semicolcheias)', hits: { triangulo: [true, true, true, true, true, true, true, true] } },
        { id: 't2', label: 'Simples (colcheias)', hits: { triangulo: [true, false, true, false, true, false, true, false] } },
        { id: 't3', label: 'Com quebra', hits: { triangulo: [true, true, false, true, true, true, false, true] } },
      ],
      zabumba: [
        {
          id: 'z1',
          label: 'Padrão',
          hits: {
            zabumbaBass: [true, false, false, false, true, false, false, false],
            zabumbaSlap: [false, false, true, false, false, true, false, true],
          },
        },
        {
          id: 'z2',
          label: 'Sincopada',
          hits: {
            zabumbaBass: [true, false, false, false, true, false, false, false],
            zabumbaSlap: [false, false, false, true, false, false, true, true],
          },
        },
        {
          id: 'z3',
          label: 'Enxuta',
          hits: {
            zabumbaBass: [true, false, false, false, true, false, false, false],
            zabumbaSlap: [false, false, false, false, false, true, false, false],
          },
        },
      ],
      bateria: [
        {
          id: 'b1',
          label: 'Padrão',
          hits: {
            kick: [true, false, false, false, true, false, false, false],
            snare: [false, false, false, false, false, false, false, true],
            hihat: [true, true, true, true, true, true, true, true],
          },
        },
        {
          id: 'b2',
          label: 'Com abertura',
          hits: {
            kick: [true, false, false, false, true, false, false, false],
            snare: [false, false, false, true, false, false, true, false],
            hihat: [true, false, true, false, true, false, true, false],
          },
        },
        {
          id: 'b3',
          label: 'Minimalista',
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
        { id: 't1', label: 'Padrão (colcheias)', hits: { triangulo: [true, false, true, false, true, false, true, false] } },
        { id: 't2', label: 'Cheio (semicolcheias)', hits: { triangulo: [true, true, true, true, true, true, true, true] } },
        { id: 't3', label: 'Só nos tempos', hits: { triangulo: [true, false, false, false, true, false, false, false] } },
      ],
      zabumba: [
        {
          id: 'z1',
          label: 'Padrão',
          hits: {
            zabumbaBass: [true, false, false, false, true, false, false, false],
            zabumbaSlap: [false, false, false, false, false, false, true, false],
          },
        },
        {
          id: 'z2',
          label: 'Resposta antecipada',
          hits: {
            zabumbaBass: [true, false, false, false, true, false, false, false],
            zabumbaSlap: [false, false, false, false, false, true, false, false],
          },
        },
        {
          id: 'z3',
          label: 'Mais preenchida',
          hits: {
            zabumbaBass: [true, false, false, false, true, false, false, false],
            zabumbaSlap: [false, false, true, false, false, false, true, false],
          },
        },
      ],
      bateria: [
        {
          id: 'b1',
          label: 'Padrão',
          hits: {
            kick: [true, false, false, false, true, false, false, false],
            snare: [false, false, false, false, false, false, true, false],
            hihat: [true, false, true, false, true, false, true, false],
          },
        },
        {
          id: 'b2',
          label: 'Com chimbau cheio',
          hits: {
            kick: [true, false, false, false, true, false, false, false],
            snare: [false, false, false, false, false, false, true, false],
            hihat: [true, true, true, true, true, true, true, true],
          },
        },
        {
          id: 'b3',
          label: 'Minimalista',
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
  zabumbaBass: zabumbaBassUrl,
  zabumbaSlap: zabumbaSlapUrl,
  triangulo: trianguloUrl,
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

// Agenda os toques com antecedência (lookahead) em vez de tocar cada som
// no momento exato via setTimeout — setTimeout sozinho atrasa/tranca
// quando a aba fica em segundo plano ou a thread principal ocupada,
// resultando num ritmo "capenga". O relógio real de tempo é o do próprio
// AudioContext (currentTime), preciso mesmo sob essas condições.
const LOOKAHEAD_MS = 25
const SCHEDULE_AHEAD_S = 0.1

export class BatuqueEngine {
  private ctx: AudioContext | null = null
  private buffers: Partial<Record<BatuqueInstrument, AudioBuffer>> = {}
  private gain: GainNode | null = null
  private timerId: ReturnType<typeof setInterval> | null = null
  private nextStepTime = 0
  private currentStep = 0
  private rhythm: Rhythm = RHYTHMS[0]
  private selection: VariationSelection = defaultSelection(RHYTHMS[0])
  private bpm = 100
  private enabledGroups: Set<InstrumentGroup> = new Set(['triangulo', 'zabumba'])
  private onStep?: (step: number) => void

  get isPlaying(): boolean {
    return this.timerId !== null
  }

  async start(
    rhythm: Rhythm,
    selection: VariationSelection,
    bpm: number,
    volume: number,
    enabledGroups: Set<InstrumentGroup>,
    onStep?: (step: number) => void,
  ): Promise<void> {
    this.stop()
    this.rhythm = rhythm
    this.selection = selection
    this.bpm = bpm
    this.enabledGroups = enabledGroups
    this.onStep = onStep

    if (!this.ctx) this.ctx = new AudioContext()
    if (this.ctx.state === 'suspended') await this.ctx.resume()
    await this.loadBuffers()

    this.gain = this.ctx.createGain()
    this.gain.gain.value = volume
    this.gain.connect(this.ctx.destination)

    this.currentStep = 0
    this.nextStepTime = this.ctx.currentTime + 0.05
    this.timerId = setInterval(() => this.scheduler(), LOOKAHEAD_MS)
  }

  setBpm(bpm: number): void {
    this.bpm = bpm
  }

  setVolume(volume: number): void {
    if (this.gain) this.gain.gain.value = volume
  }

  setRhythm(rhythm: Rhythm): void {
    this.rhythm = rhythm
  }

  setSelection(selection: VariationSelection): void {
    this.selection = selection
  }

  setEnabledGroups(groups: Set<InstrumentGroup>): void {
    this.enabledGroups = groups
  }

  stop(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId)
      this.timerId = null
    }
    this.gain?.disconnect()
    this.gain = null
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

  private stepDurationSeconds(): number {
    // 4 semicolcheias por semínima (tempo/BPM contado em semínimas).
    return 60 / this.bpm / 4
  }

  private scheduler(): void {
    if (!this.ctx) return
    while (this.nextStepTime < this.ctx.currentTime + SCHEDULE_AHEAD_S) {
      this.scheduleStep(this.currentStep, this.nextStepTime)
      this.nextStepTime += this.stepDurationSeconds()
      this.currentStep = (this.currentStep + 1) % this.rhythm.stepsPerBar
    }
  }

  private scheduleStep(step: number, time: number): void {
    for (const group of INSTRUMENT_GROUPS.map((g) => g.id)) {
      if (!this.enabledGroups.has(group)) continue
      const variation = this.rhythm.variations[group].find((v) => v.id === this.selection[group])
      if (!variation) continue
      for (const [instrument, hits] of Object.entries(variation.hits) as [BatuqueInstrument, boolean[]][]) {
        if (!hits[step]) continue
        const buffer = this.buffers[instrument]
        if (!buffer || !this.ctx || !this.gain) continue
        const source = this.ctx.createBufferSource()
        source.buffer = buffer
        source.connect(this.gain)
        source.start(time)
      }
    }
    if (this.onStep && this.ctx) {
      const delayMs = Math.max(0, (time - this.ctx.currentTime) * 1000)
      setTimeout(() => this.onStep?.(step), delayMs)
    }
  }
}
