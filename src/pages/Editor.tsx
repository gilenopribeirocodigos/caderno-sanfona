import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import {
  parseTagsInput,
  saveChordData,
  setInitialLyrics,
  transposeSongBySemitones,
  transposeSongToKey,
  updateSongDetails,
} from '@/lib/songsRepo'
import { useSettings } from '@/lib/useSettings'
import { parseChordPro, renderChordPro } from '@/utils/chordpro'
import { COMMON_ROOTS } from '@/utils/chords'
import ChordSheet, { type WordRef } from '@/components/ChordSheet'
import ChordPicker from '@/components/ChordPicker'
import SongForm, { songToFormValues, type SongFormValues } from '@/components/SongForm'
import type { LyricLine, Song } from '@/types'

type SaveState = 'saved' | 'saving' | 'idle'

export default function Editor() {
  const { songId } = useParams<{ songId: string }>()

  if (songId === 'novo') return <SongPicker />
  return <SongEditor songId={songId!} />
}

/** Tela mostrada quando se entra no Editor pelo menu, sem uma música específica. */
function SongPicker() {
  const songs = useLiveQuery(() => db.songs.orderBy('title').toArray(), [])
  return (
    <div className="mx-auto max-w-2xl p-4">
      <h2 className="text-xl font-semibold">Editor</h2>
      <p className="mt-2 text-sm text-slate-500">Escolha uma música para editar a cifra.</p>
      <ul className="mt-4 flex flex-col gap-2">
        {songs?.map((s) => (
          <li key={s.id}>
            <Link
              to={`/editor/${s.id}`}
              className="tap-target block rounded-lg bg-surface px-3 py-2 hover:bg-surface-alt"
            >
              <span className="font-medium">{s.title}</span>
              <span className="ml-2 text-xs text-slate-500">Tom {s.preferredKey}</span>
            </Link>
          </li>
        ))}
      </ul>
      {songs?.length === 0 && (
        <p className="mt-6 text-center text-sm text-slate-500">
          Nenhuma música ainda.{' '}
          <Link to="/" className="underline">
            Crie uma na Biblioteca
          </Link>
          .
        </p>
      )}
    </div>
  )
}

function SongEditor({ songId }: { songId: string }) {
  const song = useLiveQuery(() => db.songs.get(songId), [songId])
  const settings = useSettings()

  const [lyricsDraft, setLyricsDraft] = useState('')
  const [lines, setLines] = useState<LyricLine[] | null>(null)
  const [picker, setPicker] = useState<{ lineIndex: number; tokenIndex: number } | null>(null)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [rawMode, setRawMode] = useState(false)
  const [rawDraft, setRawDraft] = useState('')
  const [tab, setTab] = useState<'cifra' | 'dados'>('cifra')
  const [dadosSaved, setDadosSaved] = useState(false)
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>()
  const lastLoadedSource = useRef<string | undefined>(undefined)

  // Sincroniza o estado local de edição sempre que a letra/cifra mudar no
  // banco (letra inicial salva, ou uma alteração vinda de outra aba) — mas
  // não quando o valor já é o que acabamos de salvar nós mesmos.
  useEffect(() => {
    if (!song) return
    if (song.chordData.chordProSource === lastLoadedSource.current) return
    lastLoadedSource.current = song.chordData.chordProSource
    setLines(song.chordData.lines.length > 0 ? song.chordData.lines : parseChordPro(song.lyrics))
  }, [song])

  if (!song) {
    return <div className="mx-auto max-w-2xl p-4 text-sm text-slate-500">Carregando...</div>
  }

  function commitLines(newLines: LyricLine[]) {
    setLines(newLines)
    setSaveState('saving')
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(async () => {
      const source = renderChordPro(newLines)
      lastLoadedSource.current = source
      await saveChordData(song!.id, { chordProSource: source, lines: newLines })
      setSaveState('saved')
    }, 400)
  }

  function handleWordClick(lineIndex: number, tokenIndex: number) {
    setPicker({ lineIndex, tokenIndex })
  }

  function handleChordSelect(chord: string) {
    if (!picker || !lines) return
    const newLines = lines.map((line, li) => {
      if (li !== picker.lineIndex) return line
      const tokens = line.tokens.map((t, ti) => (ti === picker.tokenIndex ? { ...t, chord } : t))
      return { ...line, tokens }
    })
    commitLines(newLines)
    setPicker(null)
  }

  function handleChordRemove() {
    if (!picker || !lines) return
    const newLines = lines.map((line, li) => {
      if (li !== picker.lineIndex) return line
      const tokens = line.tokens.map((t, ti) => (ti === picker.tokenIndex ? { text: t.text } : t))
      return { ...line, tokens }
    })
    commitLines(newLines)
    setPicker(null)
  }

  /** Arrastar um acorde para outra palavra troca os dois (item 171: "arrastado horizontalmente"). */
  function handleChordMove(from: WordRef, to: WordRef) {
    if (!lines) return
    if (from.lineIndex === to.lineIndex && from.tokenIndex === to.tokenIndex) return
    const newLines = lines.map((line) => ({ ...line, tokens: line.tokens.map((t) => ({ ...t })) }))
    const fromToken = newLines[from.lineIndex].tokens[from.tokenIndex]
    const toToken = newLines[to.lineIndex].tokens[to.tokenIndex]
    const fromChord = fromToken.chord
    fromToken.chord = toToken.chord
    toToken.chord = fromChord
    commitLines(newLines)
  }

  function addSection() {
    const name = window.prompt('Nome da seção (ex: Refrão, Verso, Ponte):')
    if (!name || !lines) return
    commitLines([...lines, { section: name, tokens: [] }])
  }

  function openRawMode() {
    if (!lines) return
    setRawDraft(renderChordPro(lines))
    setRawMode(true)
  }

  function saveRawMode() {
    commitLines(parseChordPro(rawDraft))
    setRawMode(false)
  }

  async function handleSaveInitialLyrics(e: React.FormEvent) {
    e.preventDefault()
    if (!lyricsDraft.trim()) return
    await setInitialLyrics(song!.id, lyricsDraft)
  }

  async function handleSaveDados(values: SongFormValues) {
    await updateSongDetails(song!.id, {
      title: values.title,
      artist: values.artist,
      originalKey: values.originalKey,
      rhythm: values.rhythm,
      difficulty: values.difficulty || undefined,
      tags: parseTagsInput(values.tagsText),
      notes: values.notes,
    })
    setDadosSaved(true)
    setTimeout(() => setDadosSaved(false), 1500)
  }

  const activeToken = picker && lines ? lines[picker.lineIndex].tokens[picker.tokenIndex] : undefined

  return (
    <div className="mx-auto max-w-3xl p-4 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{song.title}</h2>
          <p className="text-xs text-slate-500">{song.artist}</p>
        </div>
        <SaveIndicator state={saveState} />
      </div>

      <div className="mt-3 flex gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          className={`tap-target px-3 py-2 text-sm font-medium ${
            tab === 'cifra'
              ? 'border-b-2 border-slate-900 dark:border-slate-100'
              : 'text-slate-500'
          }`}
          onClick={() => setTab('cifra')}
        >
          Letra e Cifra
        </button>
        <button
          className={`tap-target px-3 py-2 text-sm font-medium ${
            tab === 'dados'
              ? 'border-b-2 border-slate-900 dark:border-slate-100'
              : 'text-slate-500'
          }`}
          onClick={() => setTab('dados')}
        >
          Dados
        </button>
      </div>

      {tab === 'dados' ? (
        <div className="mt-4">
          <SongForm
            initial={songToFormValues(song)}
            submitLabel={dadosSaved ? 'Salvo ✓' : 'Salvar dados'}
            onSubmit={handleSaveDados}
          />
        </div>
      ) : song.lyrics.trim() === '' ? (
        <form onSubmit={handleSaveInitialLyrics} className="mt-4 flex flex-col gap-2">
          <p className="text-sm text-slate-500">
            Cole ou digite a letra da música. Depois é só tocar em cada
            palavra para adicionar a cifra.
          </p>
          <textarea
            className="min-h-48 rounded-md border border-slate-300 p-3 text-sm dark:border-slate-700 dark:bg-slate-800"
            placeholder="Cole a letra aqui..."
            value={lyricsDraft}
            onChange={(e) => setLyricsDraft(e.target.value)}
          />
          <button
            type="submit"
            className="tap-target rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900"
          >
            Salvar letra e começar a adicionar cifras
          </button>
        </form>
      ) : (
        <>
          <TransposeBar song={song} />

          {!rawMode ? (
            <>
              <div className="mt-4 rounded-lg bg-surface p-4">
                {lines && (
                  <ChordSheet
                    lines={lines}
                    notation={settings.notation}
                    fontSize={settings.fontSize}
                    chordSize={settings.chordSize}
                    onWordClick={handleWordClick}
                    onChordMove={handleChordMove}
                  />
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  className="tap-target rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700"
                  onClick={addSection}
                >
                  + Seção (Refrão, Verso...)
                </button>
                <button
                  className="tap-target rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700"
                  onClick={openRawMode}
                >
                  Modo texto (ChordPro)
                </button>
              </div>
            </>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              <p className="text-xs text-slate-500">
                Edite diretamente no formato ChordPro. Coloque o acorde entre
                colchetes na posição exata, mesmo no meio de uma palavra:{' '}
                <code>[C]pala[G]vra</code>. Linhas começando com <code>## </code> viram seções.
              </p>
              <textarea
                className="min-h-64 rounded-md border border-slate-300 p-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-800"
                value={rawDraft}
                onChange={(e) => setRawDraft(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  className="tap-target rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900"
                  onClick={saveRawMode}
                >
                  Salvar
                </button>
                <button
                  className="tap-target rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700"
                  onClick={() => setRawMode(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {picker && (
        <ChordPicker
          title={`Acorde em "${activeToken?.text || '(instrumental)'}"`}
          currentKey={song.preferredKey}
          notation={settings.notation}
          currentChord={activeToken?.chord}
          onSelect={handleChordSelect}
          onRemove={activeToken?.chord ? handleChordRemove : undefined}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  )
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === 'idle') return null
  return <span className="text-xs text-slate-400">{state === 'saving' ? 'Salvando...' : 'Salvo ✓'}</span>
}

function TransposeBar({ song }: { song: Song }) {
  return (
    <div className="mt-3 flex items-center gap-2 rounded-lg bg-surface p-2">
      <button
        className="tap-target rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700"
        onClick={() => transposeSongBySemitones(song, -1)}
      >
        -1
      </button>
      <span className="flex-1 text-center text-sm">
        Tom: <strong>{song.preferredKey}</strong>
        {song.originalKey !== song.preferredKey && (
          <span className="text-xs text-slate-400"> (original {song.originalKey})</span>
        )}
      </span>
      <button
        className="tap-target rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700"
        onClick={() => transposeSongBySemitones(song, 1)}
      >
        +1
      </button>
      <select
        className="tap-target rounded-md border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
        value={song.preferredKey}
        onChange={(e) => transposeSongToKey(song, e.target.value)}
      >
        {COMMON_ROOTS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
    </div>
  )
}
