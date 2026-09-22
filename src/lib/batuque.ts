import zabumbaBassUrl from '@/assets/sounds/zabumba-bass.mp3'
import zabumbaSlapUrl from '@/assets/sounds/zabumba-slap.mp3'
import trianguloUrl from '@/assets/sounds/triangulo.mp3'
import kickUrl from '@/assets/sounds/kick.wav'
import snareUrl from '@/assets/sounds/snare.wav'
import hihatUrl from '@/assets/sounds/hihat.wav'

export type BatuqueInstrument = 'zabumbaBass' | 'zabumbaSlap' | 'triangulo' | 'kick' | 'snare' | 'hihat'

// Os seis instrumentos se agrupam em três "trilhas" que a pessoa liga e
// desliga por conta própria — igual ao eBatuque, onde dá pra tocar só com
// triângulo, só com zabumba, só com bateria, ou com a combinação que quiser.
export type InstrumentGroup = 'triangulo' | 'zabumba' | 'bateria'

export const INSTRUMENT_GROUPS: { id: InstrumentGroup; label: string }[] = [
  { id: 'triangulo', label: 'Triângulo' },
  { id: 'zabumba', label: 'Zabumba' },
  { id: 'bateria', label: 'Bateria' },
]

const INSTRUMENT_GROUP: Record<BatuqueInstrument, InstrumentGroup> = {
  triangulo: 'triangulo',
  zabumbaBass: 'zabumba',
  zabumbaSlap: 'zabumba',
  kick: 'bateria',
  snare: 'bateria',
  hihat: 'bateria',
}

export interface BatuquePattern {
  id: string
  label: string
  /** Semicolcheias por compasso (2/4 = 8 semicolcheias). */
  stepsPerBar: number
  defaultBpm: number
  /** Um booleano por passo, por instrumento — true = toca nesse passo. */
  hits: Record<BatuqueInstrument, boolean[]>
}

// Padrões de partida comuns a esses dois ritmos (a base do forró
// nordestino). Não são partituras oficiais — é o feijão-com-arroz de cada
// ritmo, dá pra ajustar depois. A zabumba tem dois toques (grave, com a
// baqueta grossa, e agudo/seco, com a fina) que se revezam; o triângulo
// marca a subdivisão por cima. A "bateria" segue o mesmo desenho rítmico
// (bumbo com a zabumba grave, caixa no acento da zabumba aguda, chimbau
// junto com o triângulo), para quem preferir esse timbre.
const BAIAO_BASS = [true, false, false, false, true, false, false, false]
const BAIAO_TRIANGULO = [true, true, true, true, true, true, true, true]
const XOTE_BASS = [true, false, false, false, true, false, false, false]
const XOTE_TRIANGULO = [true, false, true, false, true, false, true, false]

export const BATUQUE_PATTERNS: BatuquePattern[] = [
  {
    id: 'baiao',
    label: 'Baião',
    stepsPerBar: 8,
    defaultBpm: 100,
    hits: {
      zabumbaBass: BAIAO_BASS,
      zabumbaSlap: [false, false, true, false, false, true, false, true],
      triangulo: BAIAO_TRIANGULO,
      kick: BAIAO_BASS,
      snare: [false, false, false, false, false, false, false, true],
      hihat: BAIAO_TRIANGULO,
    },
  },
  {
    id: 'xote',
    label: 'Xote',
    stepsPerBar: 8,
    defaultBpm: 80,
    hits: {
      zabumbaBass: XOTE_BASS,
      zabumbaSlap: [false, false, false, false, false, false, true, false],
      triangulo: XOTE_TRIANGULO,
      kick: XOTE_BASS,
      snare: [false, false, false, false, false, false, true, false],
      hihat: XOTE_TRIANGULO,
    },
  },
]

export function patternForRhythm(rhythm: string | undefined): BatuquePattern {
  const found = BATUQUE_PATTERNS.find((p) => p.label.toLowerCase() === rhythm?.toLowerCase())
  return found ?? BATUQUE_PATTERNS[0]
}

const SAMPLE_URLS: Record<BatuqueInstrument, string> = {
  zabumbaBass: zabumbaBassUrl,
  zabumbaSlap: zabumbaSlapUrl,
  triangulo: trianguloUrl,
  kick: kickUrl,
  snare: snareUrl,
  hihat: hihatUrl,
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
  private pattern: BatuquePattern = BATUQUE_PATTERNS[0]
  private bpm = 100
  private enabledGroups: Set<InstrumentGroup> = new Set(['triangulo', 'zabumba'])
  private onStep?: (step: number) => void

  get isPlaying(): boolean {
    return this.timerId !== null
  }

  async start(
    pattern: BatuquePattern,
    bpm: number,
    volume: number,
    enabledGroups: Set<InstrumentGroup>,
    onStep?: (step: number) => void,
  ): Promise<void> {
    this.stop()
    this.pattern = pattern
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

  setPattern(pattern: BatuquePattern): void {
    this.pattern = pattern
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
      this.currentStep = (this.currentStep + 1) % this.pattern.stepsPerBar
    }
  }

  private scheduleStep(step: number, time: number): void {
    for (const instrument of Object.keys(this.pattern.hits) as BatuqueInstrument[]) {
      if (!this.enabledGroups.has(INSTRUMENT_GROUP[instrument])) continue
      if (!this.pattern.hits[instrument][step]) continue
      const buffer = this.buffers[instrument]
      if (!buffer || !this.ctx || !this.gain) continue
      const source = this.ctx.createBufferSource()
      source.buffer = buffer
      source.connect(this.gain)
      source.start(time)
    }
    if (this.onStep && this.ctx) {
      const delayMs = Math.max(0, (time - this.ctx.currentTime) * 1000)
      setTimeout(() => this.onStep?.(step), delayMs)
    }
  }
}
