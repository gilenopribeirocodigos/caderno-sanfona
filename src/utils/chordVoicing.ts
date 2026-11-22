import type { LyricLine } from '@/types'

/** Ocorrência exata de um acorde na letra (linha + palavra, e sílaba se a
 * palavra tiver acorde por sílaba — item 182/185). */
export interface ChordOccurrenceRef {
  lineIndex: number
  tokenIndex: number
  pieceIndex?: number
}

/** Inversão já salva especificamente nesta ocorrência do acorde (item 185),
 * se alguém escolheu "Salvar só este" em vez de "Salvar pra todos". */
export function inversionAtRef(lines: LyricLine[], ref: ChordOccurrenceRef): number | undefined {
  const token = lines[ref.lineIndex]?.tokens[ref.tokenIndex]
  if (!token) return undefined
  if (ref.pieceIndex !== undefined) return token.pieces?.[ref.pieceIndex]?.inversion
  return token.inversion
}

/** Marca (ou limpa) a inversão de uma ocorrência específica do acorde,
 * sem mexer no padrão da música (Song.chordVoicings). Quem chama precisa
 * salvar o resultado. */
export function withInversionAtRef(lines: LyricLine[], ref: ChordOccurrenceRef, inversion: number | undefined): LyricLine[] {
  return lines.map((line, li) => {
    if (li !== ref.lineIndex) return line
    const tokens = line.tokens.map((t, ti) => {
      if (ti !== ref.tokenIndex) return t
      if (ref.pieceIndex !== undefined && t.pieces) {
        const pieces = t.pieces.map((p, pi) => (pi === ref.pieceIndex ? { ...p, inversion } : p))
        return { ...t, pieces }
      }
      return { ...t, inversion }
    })
    return { ...line, tokens }
  })
}
