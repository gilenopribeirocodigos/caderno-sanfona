import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { registerPractice } from '@/lib/songsRepo'
import { updateSettings } from '@/lib/settingsRepo'
import { useSettings } from '@/lib/useSettings'
import { firstChord, uniqueChordsInSong } from '@/utils/chordpro'
import ChordSheet from '@/components/ChordSheet'
import AccordionVisualPanel from '@/components/AccordionVisualPanel'
import type { NotebookSong } from '@/types'

const SPEED_PRESETS = [
  { label: 'Muito lento', px: 0.3 },
  { label: 'Lento', px: 0.6 },
  { label: 'Normal', px: 1.1 },
  { label: 'Rápido', px: 1.8 },
]
const START_DELAYS = [0, 3, 5, 10]

export default function Play() {
  const [searchParams, setSearchParams] = useSearchParams()
  const settings = useSettings()

  const notebookId = searchParams.get('notebook')
  const songParam = searchParams.get('song')
  const index = Number(searchParams.get('index') ?? '0')

  const notebookEntries = useLiveQuery<NotebookSong[]>(
    () =>
      notebookId
        ? db.notebookSongs.where('notebookId').equals(notebookId).sortBy('position')
        : Promise.resolve([]),
    [notebookId],
  )
  const notebook = useLiveQuery(() => (notebookId ? db.notebooks.get(notebookId) : undefined), [notebookId])

  const queue = useMemo(
    () => (notebookId ? (notebookEntries ?? []).map((e) => e.songId) : songParam ? [songParam] : []),
    [notebookId, notebookEntries, songParam],
  )
  const currentSongId = queue[index]
  const song = useLiveQuery(() => (currentSongId ? db.songs.get(currentSongId) : undefined), [currentSongId])

  // Se o índice pedido não existe mais na fila (ex: a música foi removida
  // do caderno depois que o link/"Continuar tocando" foi salvo), volta pro
  // início em vez de ficar preso pra sempre em "Carregando..." — esse era
  // o travamento relatado ao clicar em Tocar.
  useEffect(() => {
    const notebookReady = !notebookId || notebookEntries !== undefined
    if (!notebookReady || queue.length === 0 || (index >= 0 && index < queue.length)) return
    if (notebookId) setSearchParams({ notebook: notebookId, index: '0' })
    else if (songParam) setSearchParams({ song: songParam })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notebookId, notebookEntries, queue.length, index])

  // Rede de segurança: se depois de alguns segundos a música ainda não
  // apareceu (id inválido, removida, ou qualquer outra falha de dados),
  // mostra um aviso com saída em vez de travar para sempre em "Carregando...".
  const [notFound, setNotFound] = useState(false)
  useEffect(() => {
    setNotFound(false)
    if (!currentSongId) return
    const timeout = setTimeout(() => {
      setNotFound(true)
      // Limpa o atalho "Continuar tocando" se for ele quem apontava pra
      // cá — senão ele continua aparecendo, sempre levando a essa mesma
      // tela de erro.
      try {
        const raw = localStorage.getItem('lastPlay')
        const lastPlay = raw ? JSON.parse(raw) : null
        if (lastPlay?.search === searchParams.toString()) localStorage.removeItem('lastPlay')
      } catch {
        localStorage.removeItem('lastPlay')
      }
    }, 4000)
    return () => clearTimeout(timeout)
  }, [currentSongId])

  const [controlsVisible, setControlsVisible] = useState(true)
  const [showVisual, setShowVisual] = useState(false)
  const [activeChord, setActiveChord] = useState<string | undefined>()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [scrolling, setScrolling] = useState(false)
  const [speedLevel, setSpeedLevel] = useState(2)
  const [startDelay, setStartDelay] = useState(0)

  const songChords = useMemo(
    () => (song ? uniqueChordsInSong(song.chordData.lines ?? []) : []),
    [song],
  )

  const containerRef = useRef<HTMLDivElement>(null)
  const scrollInterval = useRef<ReturnType<typeof setInterval>>()
  const scrollTimeout = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (song) {
      setActiveChord(firstChord(song.chordData.chordProSource))
      registerPractice(song.id)
      // Lembra o que estava tocando (item 48: "Continuar tocando"), para
      // oferecer o atalho quando o Modo Tocar for aberto sem contexto.
      localStorage.setItem(
        'lastPlay',
        JSON.stringify({ search: searchParams.toString(), title: song.title }),
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song?.id])

  // Se a tela cheia for encerrada (Esc, gesto do sistema...), garante que os
  // controles voltem a aparecer — nunca deixar a pessoa "presa" sem botões.
  useEffect(() => {
    const handler = () => {
      const fs = Boolean(document.fullscreenElement)
      setIsFullscreen(fs)
      if (!fs) setControlsVisible(true)
    }
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  function goTo(newIndex: number) {
    if (!notebookId || newIndex < 0 || newIndex >= queue.length) return
    setSearchParams({ notebook: notebookId, index: String(newIndex) })
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') goTo(index + 1)
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') goTo(index - 1)
      else if (e.key === ' ') {
        e.preventDefault()
        toggleAutoScroll()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, queue.length, scrolling])

  function stopAutoScroll() {
    if (scrollInterval.current) clearInterval(scrollInterval.current)
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
    setScrolling(false)
  }

  function startAutoScroll() {
    const begin = () => {
      setScrolling(true)
      const px = SPEED_PRESETS[speedLevel].px
      scrollInterval.current = setInterval(() => {
        const el = containerRef.current
        if (!el) return
        el.scrollTop += px
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) stopAutoScroll()
      }, 30)
    }
    if (startDelay > 0) {
      scrollTimeout.current = setTimeout(begin, startDelay * 1000)
    } else {
      begin()
    }
  }

  function toggleAutoScroll() {
    if (scrolling) stopAutoScroll()
    else startAutoScroll()
  }

  useEffect(() => stopAutoScroll, [currentSongId])

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {})
    else document.exitFullscreen?.()
  }

  function adjustFont(delta: number) {
    updateSettings({ fontSize: Math.min(48, Math.max(12, settings.fontSize + delta)) })
  }

  function fitToScreen() {
    if (!song || !containerRef.current) return
    const availableWidth = containerRef.current.clientWidth - 32
    if (availableWidth <= 0) return

    // Mede a largura real da linha mais comprida no tamanho de fonte atual
    // (em vez de estimar por contagem de caracteres) para calcular o
    // quanto crescer ou encolher — funciona igual em celular e desktop.
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const fontFamily = getComputedStyle(document.body).fontFamily
    const currentSize = settings.fontSize
    ctx.font = `${currentSize}px ${fontFamily}`
    const widestLine = Math.max(
      1,
      ...(song.chordData.lines ?? []).map((l) => ctx.measureText(l.tokens.map((t) => t.text).join(' ')).width),
    )

    // Mira em 94% da largura disponível (uma folga discreta nas bordas).
    const newFontSize = Math.round(
      Math.min(40, Math.max(14, currentSize * ((availableWidth * 0.94) / widestLine))),
    )
    updateSettings({ fontSize: newFontSize, chordSize: Math.max(12, newFontSize - 2) })
  }

  if (queue.length === 0) {
    let lastPlay: { search: string; title: string } | null = null
    try {
      const raw = localStorage.getItem('lastPlay')
      if (raw) lastPlay = JSON.parse(raw)
    } catch {
      lastPlay = null
    }
    return (
      <div className="mx-auto max-w-2xl p-4 text-center text-sm text-slate-500">
        {lastPlay && (
          <Link
            to={`/tocar?${lastPlay.search}`}
            className="tap-target mb-4 inline-block rounded-md bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white"
          >
            ▶ Continuar tocando: {lastPlay.title}
          </Link>
        )}
        <p>Escolha uma música na Biblioteca ou um caderno para começar a tocar.</p>
        <div className="mt-3 flex justify-center gap-2">
          <Link to="/" className="tap-target rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700">
            Biblioteca
          </Link>
          <Link to="/cadernos" className="tap-target rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700">
            Cadernos
          </Link>
        </div>
      </div>
    )
  }

  if (!song) {
    if (!notFound) return <div className="p-4 text-sm text-slate-500">Carregando...</div>
    return (
      <div className="mx-auto max-w-2xl p-4 text-center text-sm text-slate-500">
        <p>Não foi possível carregar essa música. Ela pode ter sido removida ou o link não é mais válido.</p>
        <div className="mt-3 flex justify-center gap-2">
          <Link to="/" className="tap-target rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700">
            Biblioteca
          </Link>
          <Link to="/cadernos" className="tap-target rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700">
            Cadernos
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex h-full flex-col bg-surface-alt">
      {!controlsVisible && (
        <button
          aria-label="Mostrar controles"
          onClick={() => setControlsVisible(true)}
          className="tap-target fixed bottom-4 right-4 z-40 rounded-full bg-slate-900/80 px-4 py-3 text-sm font-medium text-white shadow-lg dark:bg-slate-100/90 dark:text-slate-900"
        >
          ⋮ Controles
        </button>
      )}

      {controlsVisible && (
        <div className="safe-top flex items-center justify-between gap-2 bg-surface px-3 py-2 text-sm">
          <div>
            <p className="font-semibold">{song.title}</p>
            <p className="text-xs text-slate-500">
              Tom {song.preferredKey}
              {notebookId && ` · ${index + 1} / ${queue.length}`}
              {notebook && ` · ${notebook.name}`}
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-1">
            <button className="tap-target rounded-md border border-slate-300 px-2 py-1 text-xs dark:border-slate-700" onClick={() => adjustFont(-2)}>
              A-
            </button>
            <button className="tap-target rounded-md border border-slate-300 px-2 py-1 text-xs dark:border-slate-700" onClick={() => adjustFont(2)}>
              A+
            </button>
            <button className="tap-target rounded-md border border-slate-300 px-2 py-1 text-xs dark:border-slate-700" onClick={fitToScreen}>
              Ajustar à tela
            </button>
            <button className="tap-target rounded-md border border-slate-300 px-2 py-1 text-xs dark:border-slate-700" onClick={toggleFullscreen}>
              {isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
            </button>
            <button
              className={`tap-target rounded-md border px-2 py-1 text-xs ${
                showVisual ? 'border-slate-900 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'border-slate-300 dark:border-slate-700'
              }`}
              onClick={() => setShowVisual((v) => !v)}
            >
              Sanfona visual
            </button>
            <button
              className="tap-target rounded-md border border-slate-300 px-2 py-1 text-xs dark:border-slate-700"
              onClick={() => setControlsVisible(false)}
              title="Esconde os botões para tocar sem distração (toque em ⋮ Controles para trazê-los de volta)"
            >
              Ocultar
            </button>
          </div>
        </div>
      )}

      <div ref={containerRef} className="flex-1 overflow-y-auto p-4">
        <ChordSheet
          lines={song.chordData.lines ?? []}
          notation={settings.notation}
          fontSize={settings.fontSize}
          chordSize={settings.chordSize}
          // Só destaca o "acorde atual" quando a Sanfona Visual está aberta
          // (é para ela que esse destaque serve) — do contrário, o primeiro
          // acorde da música aparecia marcado sem nenhuma explicação.
          activeChord={showVisual ? activeChord : undefined}
          onChordTap={setActiveChord}
        />
      </div>

      {showVisual && (
        <div className="border-t border-slate-200 p-2 dark:border-slate-800">
          <AccordionVisualPanel
            activeChord={activeChord}
            songChords={songChords}
            accordionType={settings.accordionType}
            notation={settings.notation}
            onChangeAccordionType={(type) => updateSettings({ accordionType: type })}
            onSelectChord={setActiveChord}
          />
        </div>
      )}

      {controlsVisible && (
        <div className="safe-bottom flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-surface px-3 py-2 text-xs dark:border-slate-800">
          <div className="flex items-center gap-1">
            <button
              className="tap-target rounded-md border border-slate-300 px-2 py-1 disabled:opacity-30 dark:border-slate-700"
              disabled={!notebookId || index === 0}
              onClick={() => goTo(index - 1)}
            >
              ‹ Anterior
            </button>
            <button
              className="tap-target rounded-md border border-slate-300 px-2 py-1 disabled:opacity-30 dark:border-slate-700"
              disabled={!notebookId || index === queue.length - 1}
              onClick={() => goTo(index + 1)}
            >
              Próxima ›
            </button>
          </div>
          <div className="flex items-center gap-1">
            <select
              className="tap-target rounded-md border border-slate-300 px-1 py-1 dark:border-slate-700 dark:bg-slate-800"
              value={speedLevel}
              onChange={(e) => setSpeedLevel(Number(e.target.value))}
            >
              {SPEED_PRESETS.map((s, i) => (
                <option key={s.label} value={i}>
                  {s.label}
                </option>
              ))}
            </select>
            <select
              className="tap-target rounded-md border border-slate-300 px-1 py-1 dark:border-slate-700 dark:bg-slate-800"
              value={startDelay}
              onChange={(e) => setStartDelay(Number(e.target.value))}
            >
              {START_DELAYS.map((d) => (
                <option key={d} value={d}>
                  {d === 0 ? 'Início imediato' : `Após ${d}s`}
                </option>
              ))}
            </select>
            <button
              className={`tap-target rounded-md border px-3 py-1 font-medium ${
                scrolling ? 'border-red-400 text-red-500' : 'border-slate-300 dark:border-slate-700'
              }`}
              onClick={toggleAutoScroll}
            >
              {scrolling ? '⏸ Parar rolagem' : '▶ Rolagem automática'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
