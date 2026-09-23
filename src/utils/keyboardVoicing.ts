import { notesInChord } from './chords'

// Ordem cromática descendente (do agudo pro grave), como as teclas ficam
// dispostas verticalmente no desenho: nunca tem tecla preta entre Mi-Fá
// nem entre Si-Dó (item "teclado vertical").
const CHROMATIC_DESC = ['B', 'A#', 'A', 'G#', 'G', 'F#', 'F', 'E', 'D#', 'D', 'C#', 'C']

export interface KeyboardKey {
  note: string
  /** 0 = tecla mais aguda mostrada, cresce pra grave (2 oitavas = 0-23). */
  chromaticIndex: number
  isWhite: boolean
}

const TWO_OCTAVE_KEYS: KeyboardKey[] = []
for (let octave = 0; octave < 2; octave++) {
  CHROMATIC_DESC.forEach((note, i) => {
    TWO_OCTAVE_KEYS.push({ note, chromaticIndex: octave * 12 + i, isWhite: !note.includes('#') })
  })
}

/**
 * Escolhe, pra cada nota do acorde, qual das duas oitavas mostradas fica
 * mais perto das outras — em vez de fixar sempre a mesma oitava, o que às
 * vezes deixava notas do mesmo acorde em pontas opostas do desenho (ex:
 * Lá maior = A, C#, E — o Mi podia cair longe do Lá, mesmo existindo uma
 * posição mais perto dele no instrumento de verdade). Testa as poucas
 * combinações possíveis (no máximo 2^5, pros acordes com mais notas) e
 * fica com a de menor distância entre a nota mais aguda e a mais grave
 * escolhidas.
 */
function closestVoicing(chord: string | undefined): Map<string, number> {
  const notes = Array.from(new Set(notesInChord(chord ?? '')))
  const result = new Map<string, number>()
  if (notes.length === 0) return result

  const options = notes.map((note) => TWO_OCTAVE_KEYS.filter((k) => k.note === note).map((k) => k.chromaticIndex))
  if (options.some((o) => o.length === 0)) return result

  let best = options.map((o) => o[0])
  let bestSpread = Math.max(...best) - Math.min(...best)

  function recurse(i: number, current: number[]) {
    if (i === options.length) {
      const spread = Math.max(...current) - Math.min(...current)
      if (spread < bestSpread) {
        bestSpread = spread
        best = [...current]
      }
      return
    }
    for (const idx of options[i]) {
      current.push(idx)
      recurse(i + 1, current)
      current.pop()
    }
  }
  recurse(0, [])

  notes.forEach((note, i) => result.set(note, best[i]))
  return result
}

export interface KeyboardLayout {
  /** Teclas brancas visíveis, já na ordem de cima pra baixo. */
  whiteKeys: KeyboardKey[]
  /** Teclas pretas visíveis, cada uma com a posição (linha, dentro de
   * `whiteKeys`) da tecla branca imediatamente abaixo dela. */
  blackKeys: (KeyboardKey & { belowWhiteRow: number })[]
  /** Nota → posição cromática escolhida (a ocorrência "certa" a destacar). */
  active: Map<string, number>
}

/**
 * Janela de teclas a desenhar para um acorde: só a faixa necessária pra
 * cobrir as notas já escolhidas pela "digitação mais próxima" (mais uma
 * pequena margem de contexto), em vez de sempre as 2 oitavas inteiras —
 * mantém o desenho pequeno mesmo aproximando as notas.
 */
export function keyboardLayoutForChord(chord: string | undefined, margin = 1): KeyboardLayout {
  const active = closestVoicing(chord)
  if (active.size === 0) {
    return { whiteKeys: TWO_OCTAVE_KEYS.filter((k) => k.isWhite).slice(0, 7), blackKeys: [], active }
  }

  const indices = [...active.values()]
  const min = Math.max(0, Math.min(...indices) - margin)
  const max = Math.min(TWO_OCTAVE_KEYS.length - 1, Math.max(...indices) + margin)

  const whiteKeys = TWO_OCTAVE_KEYS.filter((k) => k.isWhite && k.chromaticIndex >= min && k.chromaticIndex <= max)
  const whiteRowByIndex = new Map(whiteKeys.map((k, row) => [k.chromaticIndex, row]))

  const blackKeys = TWO_OCTAVE_KEYS.filter((k) => !k.isWhite && k.chromaticIndex >= min && k.chromaticIndex <= max)
    .map((k) => {
      const belowWhiteRow = whiteRowByIndex.get(k.chromaticIndex + 1)
      return belowWhiteRow === undefined ? null : { ...k, belowWhiteRow }
    })
    .filter((k): k is KeyboardKey & { belowWhiteRow: number } => k !== null)

  return { whiteKeys, blackKeys, active }
}
