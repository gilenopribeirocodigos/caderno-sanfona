import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import {
  saveChordData,
  setInitialLyrics,
  transposeSongBySemitones,
  transposeSongToKey,
} from '@/lib/songsRepo'
import { useSettings } from '@/lib/useSettings'
import { parseChordPro, renderChordPro } from '@/utils/chordpro'
import { COMMON_ROOTS } from '@/utils/chords'
import ChordSheet from '@/components/ChordSheet'
import ChordPicker from '@/components/ChordPicker'
import type { LyricLine, Song } from '@/types'

type SaveState = 'saved' | 'saving' | 'idle'

export default function Editor() {
  const { songId } = useParams<{ songId: string }>()
  const navigate = useNavigate()
  const song = useLiveQuery(() => (songId ? db.songs.get(songId) : undefined), [songId])
  const settings = useSettings()

  const [lyricsDraft, setLyricsDraft] = useState('')
  const [lines, setLines] = useState<LyricLine[] | null>(null)
  const [picker, setPicker] = useState<{ lineIndex: number; tokenIndex: number } | null>(null)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>()

  // Sincroniza o estado local de edição quando a música carrega/atualiza por fora.
  useEffect(() => {
    if (song && lines === null) {
      setLines(song.chordData.lines.length > 0 ? song.chordData.lines : parseChordPro(song.lyrics))
    }
  }, [song, lines])

  if (songId === 'novo' || !song) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <h2 className="text-xl font-semibold">Editor</h2>
        <p className="mt-2 text-sm text-slate-500">
          Crie a música pela Biblioteca primeiro (título e tom), depois volte
          aqui para colar a letra e adicionar as cifras.
        </p>
        <button
          className="tap-target mt-4 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700"
          onClick={() => navigate('/')}
        >
          Ir para a Biblioteca
        </button>
      </div>
    )
  }

  function commitLines(newLines: LyricLine[]) {
    setLines(newLines)
    setSaveState('saving')
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(async () => {
      const source = renderChordPro(newLines)
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
      const tokens = line.tokens.map((t, ti) =>
        ti === picker.tokenIndex ? { text: t.text } : t,
      )
      return { ...line, tokens }
    })
    commitLines(newLines)
    setPicker(null)
  }

  function addSection() {
    const name = window.prompt('Nome da seção (ex: Refrão, Verso, Ponte):')
    if (!name || !lines) return
    commitLines([...lines, { section: name, tokens: [] }])
  }

  async function handleSaveInitialLyrics(e: React.FormEvent) {
    e.preventDefault()
    if (!lyricsDraft.trim()) return
    await setInitialLyrics(song!.id, lyricsDraft)
  }

  const activeToken =
    picker && lines ? lines[picker.lineIndex].tokens[picker.tokenIndex] : undefined

  return (
    <div className="mx-auto max-w-3xl p-4 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{song.title}</h2>
          <p className="text-xs text-slate-500">{song.artist}</p>
        </div>
        <SaveIndicator state={saveState} />
      </div>

      {song.lyrics.trim() === '' ? (
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

          <div className="mt-4 rounded-lg bg-surface p-4">
            {lines && (
              <ChordSheet
                lines={lines}
                notation={settings.notation}
                fontSize={settings.fontSize}
                chordSize={settings.chordSize}
                onWordClick={handleWordClick}
              />
            )}
          </div>

          <button
            className="tap-target mt-3 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700"
            onClick={addSection}
          >
            + Seção (Refrão, Verso...)
          </button>
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
  return (
    <span className="text-xs text-slate-400">
      {state === 'saving' ? 'Salvando...' : 'Salvo ✓'}
    </span>
  )
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
