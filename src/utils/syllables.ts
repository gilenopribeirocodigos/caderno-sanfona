/**
 * Separação silábica do português (item 182) — usada só para decidir ONDE
 * dentro de uma palavra um acorde pode ser ancorado (ex: "mo-RE-na"),
 * nunca pra exibir a palavra com hífen. Roda localmente (sem internet),
 * já que o app precisa funcionar offline no palco.
 *
 * Baseado nas regras ortográficas de separação silábica do português:
 * - dígrafos (ch, lh, nh) e encontros consonantais com l/r (pr, bl, tr...)
 *   não se separam.
 * - consoante dupla (rr, ss) e a maioria dos outros encontros consonantais
 *   se separam.
 * - ditongos/tritongos ficam juntos; hiato tentamos aproximar olhando
 *   vogais fortes repetidas (regra imperfeita, mas suficiente pra só
 *   posicionar o acorde — não precisa ser 100% linguisticamente exato).
 */

const VOWELS = new Set('aeiouáéíóúâêôãõàAEIOUÁÉÍÓÚÂÊÔÃÕÀ')
const DIGRAPHS = new Set(['ch', 'lh', 'nh', 'qu', 'gu'])
const INSEPARABLE_CLUSTERS = new Set([
  'pr', 'pl', 'br', 'bl', 'tr', 'tl', 'dr', 'cr', 'cl', 'fr', 'fl', 'gr', 'gl', 'vr', 'vl',
])

function isVowel(ch: string): boolean {
  return VOWELS.has(ch)
}

/** Marca o "u" de "qu"/"gu" antes de e/i (que, qui, gue, gui) como mudo —
 * não conta como vogal (ex: "va-QUEI-ro", não "va-que-i-ro"). */
function silentUMask(lower: string): boolean[] {
  const mask = new Array(lower.length).fill(false)
  for (let i = 0; i < lower.length - 2; i++) {
    const c = lower[i]
    if ((c === 'q' || c === 'g') && lower[i + 1] === 'u' && (lower[i + 2] === 'e' || lower[i + 2] === 'i')) {
      mask[i + 1] = true
    }
  }
  return mask
}

/** Separa uma única palavra (sem espaços) em sílabas. */
export function splitSyllables(word: string): string[] {
  if (word.length <= 1) return [word]

  const lower = word.toLowerCase()
  const mask = silentUMask(lower)
  const vowelAt = (idx: number) => isVowel(lower[idx]) && !mask[idx]
  const breaks: number[] = [] // índices onde começa uma nova sílaba (exceto 0)
  let i = 0
  while (i < word.length) {
    // Avança até o fim do núcleo vocálico atual (vogal + possíveis vogais do ditongo).
    if (vowelAt(i)) {
      i++
      // Ditongo: a vogal seguinte fica na mesma sílaba. Só avança UMA vez —
      // uma 3ª vogal seguida já é o núcleo da sílaba seguinte (ex: "a-BOI-AR",
      // não um "tritongo" gigante), tritongo de verdade (ex: "Paraguai") é raro
      // demais pra valer a complexidade extra aqui.
      if (i < word.length && vowelAt(i)) i++
      // Agora i está numa consoante (ou fim da palavra) — decide o corte
      // olhando o grupo de consoantes até a próxima vogal.
      const consStart = i
      while (i < word.length && !vowelAt(i)) i++
      const consCount = i - consStart
      const nextIsVowel = i < word.length

      if (!nextIsVowel) {
        // Consoante(s) final(is) da palavra — fica tudo na última sílaba.
        break
      }
      if (consCount === 0) {
        breaks.push(i)
      } else if (consCount === 1) {
        // Uma consoante só vai com a vogal seguinte: corta antes dela.
        breaks.push(consStart)
      } else {
        const pair = lower.slice(i - 2, i)
        if (DIGRAPHS.has(pair) || INSEPARABLE_CLUSTERS.has(pair)) {
          // Dígrafo ou encontro inseparável: tudo vai com a vogal seguinte.
          breaks.push(consStart)
        } else {
          // Dois encontros consonantais separáveis: corta no meio.
          breaks.push(i - 1)
        }
      }
    } else {
      i++
    }
  }

  if (breaks.length === 0) return [word]
  const syllables: string[] = []
  let start = 0
  for (const b of breaks) {
    syllables.push(word.slice(start, b))
    start = b
  }
  syllables.push(word.slice(start))
  return syllables.filter((s) => s.length > 0)
}

/** Índices (posição no texto original) onde cada sílaba começa. */
export function syllableOffsets(word: string): number[] {
  const syllables = splitSyllables(word)
  const offsets: number[] = []
  let pos = 0
  for (const s of syllables) {
    offsets.push(pos)
    pos += s.length
  }
  return offsets
}
