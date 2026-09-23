import type { ChordNotation, LyricLine, Song } from '@/types'
import { formatChordForDisplay } from './chords'

const SECTION_PREFIX = '## '

/** Nome de arquivo seguro a partir do título (sem barras, dois-pontos etc). */
function safeFilename(name: string): string {
  return name.trim().replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim() || 'musica'
}

function downloadBlob(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Converte a música pro formato ChordPro padrão (item de Exportar/Backup),
 * reconhecido por outros programas de cifra — não é exatamente o texto
 * interno (que usa "## Seção"), mas o formato real com diretivas {title},
 * {artist}, {key} e comentários {c: ...} pra seção. */
export function songToChordPro(song: Song): string {
  const directives = [`{title: ${song.title}}`]
  if (song.artist) directives.push(`{artist: ${song.artist}}`)
  directives.push(`{key: ${song.preferredKey}}`)
  if (song.bpm) directives.push(`{tempo: ${song.bpm}}`)

  const body = song.chordData.chordProSource
    .split('\n')
    .map((line) => (line.startsWith(SECTION_PREFIX) ? `{c: ${line.slice(SECTION_PREFIX.length).trim()}}` : line))
    .join('\n')

  return `${directives.join('\n')}\n\n${body}\n`
}

function padTo(s: string, len: number): string {
  return s.length >= len ? s : s + ' '.repeat(len - s.length)
}

/** Uma linha de letra vira 1 ou 2 linhas de texto puro: a linha de acordes
 * (posicionados acima de onde a palavra começa) e a linha da letra —
 * o formato "cifra" tradicional, para ler impresso sem o app. */
function lineToPlainText(line: LyricLine, notation: ChordNotation): string[] {
  if (line.section !== undefined) return ['', line.section.toUpperCase()]
  if (line.tokens.length === 0) return ['']

  let lyricLine = ''
  let chordLine = ''
  let hasChord = false
  line.tokens.forEach((token, i) => {
    if (token.chord) {
      hasChord = true
      chordLine = padTo(chordLine, lyricLine.length) + formatChordForDisplay(token.chord, notation)
    }
    lyricLine += token.text
    if (i < line.tokens.length - 1) lyricLine += ' '
  })

  return hasChord ? [chordLine.trimEnd(), lyricLine] : [lyricLine]
}

function songHeader(song: Song): string {
  const parts = [song.title]
  if (song.artist) parts.push(`— ${song.artist}`)
  let header = parts.join(' ')
  header += `\nTom: ${song.preferredKey}`
  if (song.rhythm) header += ` · Ritmo: ${song.rhythm}`
  if (song.bpm) header += ` · ${song.bpm} BPM`
  return header
}

/** Texto puro pra imprimir/ler sem o app — cifra tradicional (acorde em
 * cima da palavra), sem marcação nenhuma. */
export function songToPlainText(song: Song, notation: ChordNotation): string {
  const lines = song.chordData.lines.flatMap((line) => lineToPlainText(line, notation))
  return `${songHeader(song)}\n${'─'.repeat(32)}\n\n${lines.join('\n')}\n`
}

export function downloadSongChordPro(song: Song): void {
  downloadBlob(`${safeFilename(song.title)}.cho`, songToChordPro(song), 'text/plain;charset=utf-8')
}

export function downloadSongText(song: Song, notation: ChordNotation): void {
  downloadBlob(`${safeFilename(song.title)}.txt`, songToPlainText(song, notation), 'text/plain;charset=utf-8')
}

export function downloadNotebookChordPro(name: string, songs: Song[]): void {
  const content = songs.map((s) => songToChordPro(s)).join('\n\n---\n\n')
  downloadBlob(`${safeFilename(name)}.cho`, content, 'text/plain;charset=utf-8')
}

export function downloadNotebookText(name: string, songs: Song[], notation: ChordNotation): void {
  const content = songs.map((s) => songToPlainText(s, notation)).join('\n\n\n')
  downloadBlob(`${safeFilename(name)}.txt`, content, 'text/plain;charset=utf-8')
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Uma música em HTML pronto pra impressão — acorde acima da palavra,
 * igual à tela, mas sem menu/barra do app. */
function songToPrintHtml(song: Song, notation: ChordNotation): string {
  const lines = song.chordData.lines
    .map((line) => {
      if (line.section !== undefined) return `<h4>${escapeHtml(line.section)}</h4>`
      if (line.tokens.length === 0) return '<div class="gap"></div>'
      const words = line.tokens
        .map(
          (t) =>
            `<span class="word"><span class="chord">${t.chord ? escapeHtml(formatChordForDisplay(t.chord, notation)) : '&nbsp;'}</span><span class="lyric">${escapeHtml(t.text) || '&nbsp;'}</span></span>`,
        )
        .join('')
      return `<div class="line">${words}</div>`
    })
    .join('\n')

  const meta = [
    `Tom ${song.preferredKey}`,
    song.rhythm,
    song.bpm ? `${song.bpm} BPM` : undefined,
  ]
    .filter(Boolean)
    .join(' · ')

  return `
    <section class="song">
      <h1>${escapeHtml(song.title)}</h1>
      ${song.artist ? `<p class="artist">${escapeHtml(song.artist)}</p>` : ''}
      <p class="meta">${escapeHtml(meta)}</p>
      ${lines}
    </section>
  `
}

const PRINT_STYLES = `
  body { font-family: system-ui, sans-serif; color: #0f172a; margin: 2rem; }
  .song { break-after: page; }
  .song:last-child { break-after: auto; }
  h1 { font-size: 1.4rem; margin: 0 0 0.1rem; }
  .artist { margin: 0 0 0.2rem; color: #475569; }
  .meta { margin: 0 0 1rem; font-size: 0.85rem; color: #64748b; }
  h4 { margin: 0.8rem 0 0.2rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
  .gap { height: 0.5rem; }
  .line { display: flex; flex-wrap: wrap; gap: 0.15rem 0.3rem; margin-bottom: 0.2rem; }
  .word { display: flex; flex-direction: column; align-items: flex-start; }
  .chord { font-weight: bold; font-size: 0.85em; color: #0369a1; line-height: 1.1; }
  .lyric { line-height: 1.2; }
  @media print {
    body { margin: 1cm; }
  }
`

/** Abre uma aba nova só com a(s) música(s), formatadas pra impressão, e
 * chama o diálogo de imprimir do navegador — de lá dá pra "Salvar como
 * PDF" (evita adicionar uma biblioteca de PDF só pra isso). */
export function printSongs(songs: Song[], notation: ChordNotation, docTitle: string): void {
  const win = window.open('', '_blank')
  if (!win) return
  const body = songs.map((s) => songToPrintHtml(s, notation)).join('\n')
  win.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>${escapeHtml(docTitle)}</title>
<style>${PRINT_STYLES}</style>
</head>
<body>${body}</body>
</html>`)
  win.document.close()
  win.onload = () => {
    win.focus()
    win.print()
  }
}
