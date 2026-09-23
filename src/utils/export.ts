import type { AccordionType, ChordNotation, LyricLine, Song } from '@/types'
import { formatChordForDisplay } from './chords'
import { chordLabelForRow, columnsFor, getHighlightedButtons, rowsFor } from './accordion'
import { colorMapForChords, type ChordColor } from './chordColors'
import { uniqueChordsInSong } from './chordpro'
import { keyboardLayoutForChord } from './keyboardVoicing'

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

// Réplica compacta (em SVG puro) do VerticalKeyboard.tsx, pra usar na
// impressão — não dá pra reaproveitar o componente React fora da tela.
// Usa a mesma lógica de "oitava mais próxima" (keyboardVoicing.ts).
const KB_WHITE_W = 54
const KB_WHITE_H = 15
const KB_BLACK_W = 34
const KB_BLACK_H = 11
const KB_Y_PAD = KB_BLACK_H / 2

function keyboardSvg(chord: string, notation: ChordNotation, hex: string, hexSoft: string): string {
  const { whiteKeys, blackKeys, active } = keyboardLayoutForChord(chord)
  const height = whiteKeys.length * KB_WHITE_H + KB_BLACK_H
  const width = KB_WHITE_W + 4

  const whiteRects = whiteKeys.map((key, i) => {
    const isActive = active.get(key.note) === key.chromaticIndex
    const y = i * KB_WHITE_H + KB_Y_PAD
    return `<rect x="0.5" y="${y + 0.5}" width="${KB_WHITE_W - 1}" height="${KB_WHITE_H - 1}" fill="${isActive ? hexSoft : '#ffffff'}" stroke="${isActive ? hex : '#94a3b8'}" stroke-width="${isActive ? 1.3 : 0.8}" />${
      isActive ? `<circle cx="${KB_WHITE_W - 9}" cy="${y + KB_WHITE_H / 2}" r="3" fill="${hex}" />` : ''
    }<text x="4" y="${y + KB_WHITE_H / 2}" dominant-baseline="central" font-size="7" font-weight="${isActive ? 700 : 400}" fill="#334155">${escapeHtml(formatChordForDisplay(key.note, notation))}</text>`
  }).join('')

  const blackRects = blackKeys
    .map((key) => {
      const isActive = active.get(key.note) === key.chromaticIndex
      const y = key.belowWhiteRow * KB_WHITE_H - KB_BLACK_H / 2 + KB_Y_PAD
      return `<rect x="0" y="${y}" width="${KB_BLACK_W}" height="${KB_BLACK_H}" rx="1.5" fill="${isActive ? hex : '#0f172a'}" /><text x="3" y="${y + KB_BLACK_H / 2}" dominant-baseline="central" font-size="5.5" font-weight="600" fill="#fff">${escapeHtml(formatChordForDisplay(key.note, notation))}</text>`
    })
    .join('')

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${whiteRects}${blackRects}</svg>`
}

// Mesma lógica do MiniBassPreview do balão de preview (ChordPreviewPopup):
// mostra o botão certo do baixo junto com alguns vizinhos, pra dar pra
// achar a posição dele no instrumento — não o mapa inteiro do Stradella.
const PRINT_BASS_WINDOW = 1

function miniBassHtml(chord: string, accordionType: AccordionType, notation: ChordNotation, hex: string, hexSoft: string): string {
  const highlights = getHighlightedButtons(chord, accordionType)
  const rows = rowsFor(accordionType)
  const columns = columnsFor(accordionType)

  const byRow = new Map<number, (typeof highlights)[number]>()
  for (const h of highlights) if (!byRow.has(h.row)) byRow.set(h.row, h)
  const items = [...byRow.entries()].sort((a, b) => a[0] - b[0])
  if (items.length === 0) return ''

  const cols = items
    .map(([rowIndex, h], colPos) => {
      const rowName = rows[rowIndex]
      const start = Math.max(0, h.col - PRINT_BASS_WINDOW)
      const end = Math.min(columns.length - 1, h.col + PRINT_BASS_WINDOW)
      const buttons: string[] = []
      for (let i = start; i <= end; i++) {
        const label = chordLabelForRow(columns[i], rowName)
        const isTarget = i === h.col
        buttons.push(
          `<span class="bass-btn${isTarget ? ' target' : ''}"${
            isTarget ? ` style="border-color:${hex};color:${hex};background:${hexSoft}"` : ''
          }>${escapeHtml(formatChordForDisplay(label, notation))}</span>`,
        )
      }
      return `<div class="bass-col" style="padding-top:${colPos * 3}px"><span class="bass-col-label">${escapeHtml(rowName)}</span>${buttons.join('')}</div>`
    })
    .join('')

  return `<div class="mini-bass">${cols}</div>`
}

function chordCardHtml(chord: string, accordionType: AccordionType, notation: ChordNotation, color: ChordColor): string {
  return `<div class="chord-card" style="border-color:${color.hex}"><div class="chord-card-name" style="color:${color.hex}">${escapeHtml(
    formatChordForDisplay(chord, notation),
  )}</div><div class="chord-card-visual">${keyboardSvg(chord, notation, color.hex, color.hexSoft)}${miniBassHtml(
    chord,
    accordionType,
    notation,
    color.hex,
    color.hexSoft,
  )}</div></div>`
}

/** Uma música em HTML pronto pra impressão — acorde acima da palavra,
 * igual à tela, mas sem menu/barra do app. Ao lado da letra, um cartão por
 * acorde da música com teclado + baixo (a "sanfona visual" no papel). */
function songToPrintHtml(song: Song, notation: ChordNotation, accordionType: AccordionType): string {
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

  const chords = uniqueChordsInSong(song.chordData.lines ?? [])
  const colorMap = colorMapForChords(chords)
  const chordCards = chords.map((c) => chordCardHtml(c, accordionType, notation, colorMap.get(c)!)).join('')

  return `
    <section class="song">
      <div class="song-main">
        <h1>${escapeHtml(song.title)}</h1>
        ${song.artist ? `<p class="artist">${escapeHtml(song.artist)}</p>` : ''}
        <p class="meta">${escapeHtml(meta)}</p>
        ${lines}
      </div>
      ${chordCards ? `<aside class="song-chords">${chordCards}</aside>` : ''}
    </section>
  `
}

const PRINT_STYLES = `
  body { font-family: system-ui, sans-serif; color: #0f172a; margin: 2rem; }
  .song { display: flex; align-items: flex-start; gap: 1.2rem; break-after: page; }
  .song:last-child { break-after: auto; }
  .song-main { flex: 1; min-width: 0; }
  h1 { font-size: 1.4rem; margin: 0 0 0.1rem; }
  .artist { margin: 0 0 0.2rem; color: #475569; }
  .meta { margin: 0 0 1rem; font-size: 0.85rem; color: #64748b; }
  h4 { margin: 0.8rem 0 0.2rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
  .gap { height: 0.5rem; }
  .line { display: flex; flex-wrap: wrap; gap: 0.15rem 0.3rem; margin-bottom: 0.2rem; }
  .word { display: flex; flex-direction: column; align-items: flex-start; }
  .chord { font-weight: bold; font-size: 0.85em; color: #0369a1; line-height: 1.1; }
  .lyric { line-height: 1.2; }
  .song-chords { width: 130px; flex-shrink: 0; display: flex; flex-direction: column; gap: 0.5rem; }
  .chord-card { border: 1.5px solid; border-radius: 8px; padding: 0.3rem; break-inside: avoid; }
  .chord-card-name { font-weight: bold; font-size: 0.85rem; margin-bottom: 0.2rem; }
  .chord-card-visual { display: flex; gap: 0.3rem; align-items: flex-start; }
  .mini-bass { display: flex; gap: 0.2rem; }
  .bass-col { display: flex; flex-direction: column; align-items: center; gap: 0.15rem; }
  .bass-col-label { font-size: 0.5rem; text-transform: uppercase; color: #94a3b8; }
  .bass-btn { display: flex; align-items: center; justify-content: center; width: 16px; height: 16px; border-radius: 999px; border: 1px solid #cbd5e1; font-size: 0.45rem; font-weight: 700; color: #94a3b8; }
  .bass-btn.target { border-width: 2px; }
  @media print {
    body { margin: 1cm; }
  }
`

/** Abre uma aba nova só com a(s) música(s), formatadas pra impressão, e
 * chama o diálogo de imprimir do navegador — de lá dá pra "Salvar como
 * PDF" (evita adicionar uma biblioteca de PDF só pra isso). Ao lado da
 * letra de cada música, mostra um cartão por acorde com teclado + baixo. */
export function printSongs(songs: Song[], notation: ChordNotation, docTitle: string, accordionType: AccordionType): void {
  const win = window.open('', '_blank')
  if (!win) return
  const body = songs.map((s) => songToPrintHtml(s, notation, accordionType)).join('\n')
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
