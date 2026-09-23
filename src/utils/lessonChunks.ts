import type { LyricLine } from '@/types'

export interface LessonChunk {
  section?: string
  lines: LyricLine[]
}

// Tamanho máximo de cada pedaço (em linhas de letra) — grande o bastante
// pra caber uma frase inteira, pequeno o bastante pra caber em letra
// grande na tela sem precisar rolar.
const MAX_LINES_PER_CHUNK = 4

/**
 * Divide a letra em pedaços pequenos pro Modo Aula: uma seção existente
 * (Verso, Refrão...) vira um ou mais pedaços, quebrando em blocos de até
 * `MAX_LINES_PER_CHUNK` linhas quando for grande demais. Músicas sem
 * seção marcada também são quebradas nesse mesmo tamanho de bloco.
 */
export function buildLessonChunks(lines: LyricLine[]): LessonChunk[] {
  const chunks: LessonChunk[] = []
  let currentSection: string | undefined
  let buffer: LyricLine[] = []

  function flush() {
    if (buffer.length === 0) return
    chunks.push({ section: currentSection, lines: buffer })
    buffer = []
  }

  for (const line of lines) {
    if (line.section !== undefined) {
      flush()
      currentSection = line.section
      continue
    }
    if (line.tokens.length === 0) continue // linha em branco só separa visualmente
    buffer.push(line)
    if (buffer.length >= MAX_LINES_PER_CHUNK) flush()
  }
  flush()

  return chunks
}
