import trianguloFechadoUrl from '@/assets/sounds/triangulo-fechado.wav'
import trianguloAbertoUrl from '@/assets/sounds/triangulo-aberto.wav'
import zabumbaMalletUrl from '@/assets/sounds/zabumba-mallet.wav'
import zabumbaMalletAbertoUrl from '@/assets/sounds/zabumba-mallet-aberto.wav'
import zabumbaBacalhauForteUrl from '@/assets/sounds/zabumba-bacalhau-forte.wav'
import zabumbaBacalhauSuaveUrl from '@/assets/sounds/zabumba-bacalhau-suave.wav'
import agogoGraveUrl from '@/assets/sounds/agogo-grave.wav'
import agogoAgudoUrl from '@/assets/sounds/agogo-agudo.wav'
import blockGraveUrl from '@/assets/sounds/block-grave.wav'
import blockAgudoUrl from '@/assets/sounds/block-agudo.wav'
import ganzaUrl from '@/assets/sounds/ganza.wav'
import kickUrl from '@/assets/sounds/kick.wav'
import snareUrl from '@/assets/sounds/snare.wav'
import hihatUrl from '@/assets/sounds/hihat.wav'
import trianguloLoopBaiao100M1Url from '@/assets/sounds/triangulo-loop-baiao-100-m1.wav'
import trianguloLoopBaiao100M2Url from '@/assets/sounds/triangulo-loop-baiao-100-m2.wav'
import trianguloLoopBaiao120M1Url from '@/assets/sounds/triangulo-loop-baiao-120-m1.wav'
import trianguloLoopBaiao120M2Url from '@/assets/sounds/triangulo-loop-baiao-120-m2.wav'
import zabumbaLoop120_01bMUrl from '@/assets/sounds/zabumba-loop-baiao-120-01-bM.wav'
import zabumbaLoop120_01tMUrl from '@/assets/sounds/zabumba-loop-baiao-120-01-tM.wav'
import zabumbaLoop120_02bMUrl from '@/assets/sounds/zabumba-loop-baiao-120-02-bM.wav'
import zabumbaLoop120_02tMUrl from '@/assets/sounds/zabumba-loop-baiao-120-02-tM.wav'
import zabumbaLoop120_03bMUrl from '@/assets/sounds/zabumba-loop-baiao-120-03-bM.wav'
import zabumbaLoop120_03tMUrl from '@/assets/sounds/zabumba-loop-baiao-120-03-tM.wav'
import zabumbaLoop100_04bMUrl from '@/assets/sounds/zabumba-loop-baiao-100-04-bM.wav'
import zabumbaLoop100_04tMUrl from '@/assets/sounds/zabumba-loop-baiao-100-04-tM.wav'
import zabumbaLoop100_05bMUrl from '@/assets/sounds/zabumba-loop-baiao-100-05-bM.wav'
import zabumbaLoop100_05tMUrl from '@/assets/sounds/zabumba-loop-baiao-100-05-tM.wav'
import zabumbaLoop100_06bMUrl from '@/assets/sounds/zabumba-loop-baiao-100-06-bM.wav'
import zabumbaLoop100_06tMUrl from '@/assets/sounds/zabumba-loop-baiao-100-06-tM.wav'
import agogoLoopBaiao100Url from '@/assets/sounds/agogo-loop-baiao-100.wav'
import agogoLoopBaiao120Url from '@/assets/sounds/agogo-loop-baiao-120.wav'
import ganzaLoopBaiao100Url from '@/assets/sounds/ganza-loop-baiao-100.wav'
import ganzaLoopBaiao120Url from '@/assets/sounds/ganza-loop-baiao-120.wav'

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
  | 'agogoAgudo'
  | 'agogoGrave'
  | 'blockAgudo'
  | 'blockGrave'
  | 'ganza'
  | 'kick'
  | 'snare'
  | 'hihat'

export type InstrumentGroup = 'triangulo' | 'zabumba' | 'agogo' | 'block' | 'ganza' | 'bateria'

export const INSTRUMENT_GROUPS: { id: InstrumentGroup; label: string }[] = [
  { id: 'triangulo', label: 'Triângulo' },
  { id: 'zabumba', label: 'Zabumba' },
  { id: 'agogo', label: 'Agogô' },
  { id: 'block', label: 'Block' },
  { id: 'ganza', label: 'Ganzá' },
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
      agogo: [
        {
          id: 'a1',
          label: 'Corrido (alternando)',
          source: `Padrão: aproximação própria, inspirada na descrição de Garanhão & Barsalini (2023) sobre o agogô no xote ("mantendo a mesma sequência de altura, agudo e grave"). Som: ${SOM_COMPRADO}`,
          hits: {
            agogoAgudo: [true, false, true, false, true, false, true, false],
            agogoGrave: [false, true, false, true, false, true, false, true],
          },
        },
        {
          id: 'a2',
          label: 'Nos tempos',
          source: `Padrão: aproximação própria. Som: ${SOM_COMPRADO}`,
          hits: {
            agogoAgudo: [true, false, false, false, false, false, false, false],
            agogoGrave: [false, false, false, false, true, false, false, false],
          },
        },
        {
          id: 'a3',
          label: 'Sincopado',
          source: `Padrão: aproximação própria. Som: ${SOM_COMPRADO}`,
          hits: {
            agogoAgudo: [false, false, false, true, false, false, false, false],
            agogoGrave: [false, false, false, false, false, false, true, true],
          },
        },
      ],
      block: [
        {
          id: 'bl1',
          label: 'Clave simples',
          source: `Padrão: aproximação própria. Som: ${SOM_COMPRADO}`,
          hits: {
            blockGrave: [true, false, false, false, false, false, false, false],
            blockAgudo: [false, false, false, false, true, false, false, false],
          },
        },
        {
          id: 'bl2',
          label: 'Síncopa',
          source: `Padrão: aproximação própria. Som: ${SOM_COMPRADO}`,
          hits: { blockAgudo: [false, false, true, false, false, true, false, true] },
        },
        {
          id: 'bl3',
          label: 'Alternado (colcheias)',
          source: `Padrão: aproximação própria. Som: ${SOM_COMPRADO}`,
          hits: {
            blockGrave: [true, false, false, false, true, false, false, false],
            blockAgudo: [false, false, true, false, false, false, true, false],
          },
        },
      ],
      ganza: [
        {
          id: 'g1',
          label: 'Contínuo (semicolcheias)',
          source: `Padrão: aproximação própria. Som: ${SOM_COMPRADO}`,
          hits: { ganza: [true, true, true, true, true, true, true, true] },
        },
        {
          id: 'g2',
          label: 'Colcheias',
          source: `Padrão: aproximação própria. Som: ${SOM_COMPRADO}`,
          hits: { ganza: [true, false, true, false, true, false, true, false] },
        },
        {
          id: 'g3',
          label: 'Só nos tempos',
          source: `Padrão: aproximação própria. Som: ${SOM_COMPRADO}`,
          hits: { ganza: [true, false, false, false, true, false, false, false] },
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
      agogo: [
        {
          id: 'a1',
          label: 'Nos tempos (Santos, 2013)',
          source: `Padrão: Santos (2013) via Garanhão & Barsalini (2023): agogô "toca os tempos", mantendo a sequência agudo-grave. Som: ${SOM_COMPRADO}`,
          hits: {
            agogoAgudo: [true, false, false, false, false, false, false, false],
            agogoGrave: [false, false, false, false, true, false, false, false],
          },
        },
        {
          id: 'a2',
          label: 'No contratempo (Gomes, 2005)',
          source: `Padrão: Gomes (2005) via Garanhão & Barsalini (2023): agogô "executa os contratempos", mantendo a sequência agudo-grave. Som: ${SOM_COMPRADO}`,
          hits: {
            agogoAgudo: [false, false, true, false, false, false, false, false],
            agogoGrave: [false, false, false, false, false, false, true, false],
          },
        },
        {
          id: 'a3',
          label: 'Corrido (colcheias)',
          source: `Padrão: aproximação própria, combinando as duas citações acima numa condução mais cheia. Som: ${SOM_COMPRADO}`,
          hits: {
            agogoAgudo: [true, false, false, false, true, false, false, false],
            agogoGrave: [false, false, true, false, false, false, true, false],
          },
        },
      ],
      block: [
        {
          id: 'bl1',
          label: 'Clave simples',
          source: `Padrão: aproximação própria. Som: ${SOM_COMPRADO}`,
          hits: {
            blockGrave: [true, false, false, false, false, false, false, false],
            blockAgudo: [false, false, false, false, true, false, false, false],
          },
        },
        {
          id: 'bl2',
          label: 'Colcheias alternando',
          source: `Padrão: aproximação própria. Som: ${SOM_COMPRADO}`,
          hits: {
            blockGrave: [true, false, false, false, true, false, false, false],
            blockAgudo: [false, false, true, false, false, false, true, false],
          },
        },
        {
          id: 'bl3',
          label: 'Minimalista',
          source: `Padrão: aproximação própria. Som: ${SOM_COMPRADO}`,
          hits: { blockGrave: [true, false, false, false, false, false, false, false] },
        },
      ],
      ganza: [
        {
          id: 'g1',
          label: 'Colcheias',
          source: `Padrão: aproximação própria. Som: ${SOM_COMPRADO}`,
          hits: { ganza: [true, false, true, false, true, false, true, false] },
        },
        {
          id: 'g2',
          label: 'Contínuo (semicolcheias)',
          source: `Padrão: aproximação própria. Som: ${SOM_COMPRADO}`,
          hits: { ganza: [true, true, true, true, true, true, true, true] },
        },
        {
          id: 'g3',
          label: 'Só nos tempos',
          source: `Padrão: aproximação própria. Som: ${SOM_COMPRADO}`,
          hits: { ganza: [true, false, false, false, true, false, false, false] },
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

// "Groove real": em vez de eu programar cada nota, toca o loop gravado de
// verdade pelo percussionista, repetindo sem costura. Só existe para quem
// já tem loop comprado (hoje: triângulo no baião) — o BPM fica preso ao
// andamento em que o loop foi gravado (não dá pra esticar sem perder
// qualidade), então a escolha aqui é entre os andamentos disponíveis, não
// um ajuste livre.
export interface LoopOption {
  id: string
  label: string
  bpm: number
  url: string
}

const LOOP_OPTIONS: Partial<Record<string, Partial<Record<InstrumentGroup, LoopOption[]>>>> = {
  baiao: {
    triangulo: [
      { id: 'loop100m1', label: '100 BPM (mic 1)', bpm: 100, url: trianguloLoopBaiao100M1Url },
      { id: 'loop100m2', label: '100 BPM (mic 2)', bpm: 100, url: trianguloLoopBaiao100M2Url },
      { id: 'loop120m1', label: '120 BPM (mic 1)', bpm: 120, url: trianguloLoopBaiao120M1Url },
      { id: 'loop120m2', label: '120 BPM (mic 2)', bpm: 120, url: trianguloLoopBaiao120M2Url },
    ],
    // Zabumba 1-6 = 120 BPM, Zabumba 7-12 = 100 BPM (cada número é uma
    // variação/take diferente tocada pelo percussionista; dentro de cada
    // uma, dois microfones — bM grave, tM agudo — contam como dois números
    // separados, a pedido, pra não esconder nenhum arquivo comprado).
    zabumba: [
      { id: 'zloop1', label: 'Zabumba 1', bpm: 120, url: zabumbaLoop120_01bMUrl },
      { id: 'zloop2', label: 'Zabumba 2', bpm: 120, url: zabumbaLoop120_01tMUrl },
      { id: 'zloop3', label: 'Zabumba 3', bpm: 120, url: zabumbaLoop120_02bMUrl },
      { id: 'zloop4', label: 'Zabumba 4', bpm: 120, url: zabumbaLoop120_02tMUrl },
      { id: 'zloop5', label: 'Zabumba 5', bpm: 120, url: zabumbaLoop120_03bMUrl },
      { id: 'zloop6', label: 'Zabumba 6', bpm: 120, url: zabumbaLoop120_03tMUrl },
      { id: 'zloop7', label: 'Zabumba 7', bpm: 100, url: zabumbaLoop100_04bMUrl },
      { id: 'zloop8', label: 'Zabumba 8', bpm: 100, url: zabumbaLoop100_04tMUrl },
      { id: 'zloop9', label: 'Zabumba 9', bpm: 100, url: zabumbaLoop100_05bMUrl },
      { id: 'zloop10', label: 'Zabumba 10', bpm: 100, url: zabumbaLoop100_05tMUrl },
      { id: 'zloop11', label: 'Zabumba 11', bpm: 100, url: zabumbaLoop100_06bMUrl },
      { id: 'zloop12', label: 'Zabumba 12', bpm: 100, url: zabumbaLoop100_06tMUrl },
    ],
    agogo: [
      { id: 'aloop100', label: '100 BPM', bpm: 100, url: agogoLoopBaiao100Url },
      { id: 'aloop120', label: '120 BPM', bpm: 120, url: agogoLoopBaiao120Url },
    ],
    ganza: [
      { id: 'gloop100', label: '100 BPM', bpm: 100, url: ganzaLoopBaiao100Url },
      { id: 'gloop120', label: '120 BPM', bpm: 120, url: ganzaLoopBaiao120Url },
    ],
  },
}

export function loopOptionsFor(rhythmId: string, group: InstrumentGroup): LoopOption[] {
  return LOOP_OPTIONS[rhythmId]?.[group] ?? []
}

const SAMPLE_URLS: Record<BatuqueInstrument, string> = {
  trianguloFechado: trianguloFechadoUrl,
  trianguloAberto: trianguloAbertoUrl,
  zabumbaMallet: zabumbaMalletUrl,
  zabumbaMalletAberto: zabumbaMalletAbertoUrl,
  zabumbaBacalhauForte: zabumbaBacalhauForteUrl,
  zabumbaBacalhauSuave: zabumbaBacalhauSuaveUrl,
  agogoAgudo: agogoAgudoUrl,
  agogoGrave: agogoGraveUrl,
  blockAgudo: blockAgudoUrl,
  blockGrave: blockGraveUrl,
  ganza: ganzaUrl,
  kick: kickUrl,
  snare: snareUrl,
  hihat: hihatUrl,
}

export type VariationSelection = Record<InstrumentGroup, string>

export function defaultSelection(rhythm: Rhythm): VariationSelection {
  return Object.fromEntries(
    INSTRUMENT_GROUPS.map((g) => [g.id, rhythm.variations[g.id][0].id]),
  ) as VariationSelection
}

export interface GroupSettings {
  bpm: number
  volume: number
}

export function defaultGroupSettings(rhythm: Rhythm): Record<InstrumentGroup, GroupSettings> {
  return Object.fromEntries(
    INSTRUMENT_GROUPS.map((g) => [g.id, { bpm: rhythm.defaultBpm, volume: 0.8 }]),
  ) as Record<InstrumentGroup, GroupSettings>
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
  private loopBufferCache = new Map<string, AudioBuffer>()
  private groupGains: Partial<Record<InstrumentGroup, GainNode>> = {}
  private groupClocks: Partial<Record<InstrumentGroup, GroupClock>> = {}
  private loopSources: Partial<Record<InstrumentGroup, AudioBufferSourceNode>> = {}
  private loopUrls: Partial<Record<InstrumentGroup, string>> = {}
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
    loopUrls: Partial<Record<InstrumentGroup, string>>,
    onStep?: (group: InstrumentGroup, step: number) => void,
  ): Promise<void> {
    this.stop()
    this.rhythm = rhythm
    this.selection = selection
    this.enabledGroups = enabledGroups
    this.groupSettings = groupSettings
    this.loopUrls = loopUrls
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
    const previous = this.enabledGroups
    this.enabledGroups = groups
    if (this.timerId !== null) {
      for (const group of previous) {
        if (!groups.has(group)) this.teardownGroup(group)
      }
      for (const group of groups) this.ensureGroupRunning(group)
    }
  }

  /** Liga/desliga o "groove real" pra um instrumento — url null volta pro
   * modo programado (padrão de batida escolhido). Reinicia esse
   * instrumento na hora, se já estiver tocando. */
  setLoopUrl(group: InstrumentGroup, url: string | null): void {
    if (url) this.loopUrls[group] = url
    else delete this.loopUrls[group]
    if (this.timerId !== null && this.enabledGroups.has(group)) {
      this.teardownGroup(group)
      this.ensureGroupRunning(group)
    }
  }

  stop(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId)
      this.timerId = null
    }
    for (const group of new Set([
      ...(Object.keys(this.groupGains) as InstrumentGroup[]),
      ...(Object.keys(this.loopSources) as InstrumentGroup[]),
    ])) {
      this.teardownGroup(group)
    }
  }

  private teardownGroup(group: InstrumentGroup): void {
    const loopSource = this.loopSources[group]
    if (loopSource) {
      loopSource.stop()
      loopSource.disconnect()
      delete this.loopSources[group]
    }
    delete this.groupClocks[group]
    const gain = this.groupGains[group]
    if (gain) {
      gain.disconnect()
      delete this.groupGains[group]
    }
  }

  private ensureGroupRunning(group: InstrumentGroup): void {
    if (!this.ctx || this.groupClocks[group] || this.loopSources[group]) return
    const gain = this.ctx.createGain()
    gain.gain.value = this.groupSettings[group].volume
    gain.connect(this.ctx.destination)
    this.groupGains[group] = gain

    const loopUrl = this.loopUrls[group]
    if (loopUrl) {
      this.startLoopSource(group, loopUrl, gain)
    } else {
      this.groupClocks[group] = { nextStepTime: this.ctx.currentTime + 0.05, currentStep: 0 }
    }
  }

  private async startLoopSource(group: InstrumentGroup, url: string, gain: GainNode): Promise<void> {
    const buffer = await this.loadLoopBuffer(url)
    // O grupo pode ter sido desligado/reconfigurado enquanto o áudio
    // carregava — não inicia um loop "fantasma" nesse caso.
    if (!this.ctx || this.groupGains[group] !== gain) return
    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true
    source.connect(gain)
    source.start()
    this.loopSources[group] = source
  }

  private async loadLoopBuffer(url: string): Promise<AudioBuffer> {
    const cached = this.loopBufferCache.get(url)
    if (cached) return cached
    const res = await fetch(url)
    const arrayBuffer = await res.arrayBuffer()
    const buffer = await this.ctx!.decodeAudioData(arrayBuffer)
    this.loopBufferCache.set(url, buffer)
    return buffer
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
