import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { createSong, deleteSong, parseTagsInput, toggleFavorite } from '@/lib/songsRepo'
import { useSettings } from '@/lib/useSettings'
import { downloadSongChordPro, downloadSongText, printSongs } from '@/utils/export'
import SongForm, { emptySongForm, type SongFormValues } from '@/components/SongForm'
import type { AccordionType, ChordNotation, Song } from '@/types'

type SortMode = 'alfabetica' | 'artista' | 'tom' | 'mais-tocadas' | 'recentes' | 'nao-treinadas'

type FormMode = { kind: 'closed' } | { kind: 'create' }

export default function Library() {
  const songs = useLiveQuery(() => db.songs.toArray(), [])
  const [formMode, setFormMode] = useState<FormMode>({ kind: 'closed' })
  const settings = useSettings()

  const [search, setSearch] = useState('')
  const [keyFilter, setKeyFilter] = useState('')
  const [rhythmFilter, setRhythmFilter] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('')
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [sortMode, setSortMode] = useState<SortMode>('alfabetica')

  const keys = useMemo(
    () => Array.from(new Set((songs ?? []).map((s) => s.preferredKey))).sort(),
    [songs],
  )
  const rhythms = useMemo(
    () => Array.from(new Set((songs ?? []).map((s) => s.rhythm).filter(Boolean))) as string[],
    [songs],
  )

  const visibleSongs = useMemo(() => {
    let list = songs ?? []
    const term = search.trim().toLowerCase()
    if (term) {
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(term) ||
          (s.artist ?? '').toLowerCase().includes(term),
      )
    }
    if (keyFilter) list = list.filter((s) => s.preferredKey === keyFilter)
    if (rhythmFilter) list = list.filter((s) => s.rhythm === rhythmFilter)
    if (difficultyFilter) list = list.filter((s) => s.difficulty === difficultyFilter)
    if (onlyFavorites) list = list.filter((s) => s.favorite)
    if (sortMode === 'nao-treinadas') list = list.filter((s) => s.timesPlayed === 0)

    const sorted = [...list]
    switch (sortMode) {
      case 'artista':
        sorted.sort((a, b) => (a.artist ?? '').localeCompare(b.artist ?? ''))
        break
      case 'tom':
        sorted.sort((a, b) => a.preferredKey.localeCompare(b.preferredKey))
        break
      case 'mais-tocadas':
        sorted.sort((a, b) => b.timesPlayed - a.timesPlayed)
        break
      case 'recentes':
        sorted.sort((a, b) =>
          (b.lastPracticedAt ?? b.createdAt).localeCompare(a.lastPracticedAt ?? a.createdAt),
        )
        break
      default:
        sorted.sort((a, b) => a.title.localeCompare(b.title))
    }
    return sorted
  }, [songs, search, keyFilter, rhythmFilter, difficultyFilter, onlyFavorites, sortMode])

  async function handleCreate(values: SongFormValues) {
    await createSong({
      title: values.title,
      artist: values.artist,
      originalKey: values.originalKey,
      rhythm: values.rhythm,
      difficulty: values.difficulty || undefined,
      tags: parseTagsInput(values.tagsText),
      notes: values.notes,
      lyrics: '',
    })
    setFormMode({ kind: 'closed' })
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Biblioteca</h2>
        {formMode.kind === 'closed' && (
          <button
            className="tap-target rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900"
            onClick={() => setFormMode({ kind: 'create' })}
          >
            + Nova música
          </button>
        )}
      </div>

      {formMode.kind === 'create' && (
        <div className="mt-3">
          <SongForm
            initial={emptySongForm()}
            submitLabel="Criar música"
            onCancel={() => setFormMode({ kind: 'closed' })}
            onSubmit={handleCreate}
          />
        </div>
      )}
      <div className="mt-4 flex flex-col gap-2 rounded-lg bg-surface p-3">
        <input
          className="tap-target rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          placeholder="Buscar por nome ou artista..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <select
            className="tap-target rounded-md border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
            value={keyFilter}
            onChange={(e) => setKeyFilter(e.target.value)}
          >
            <option value="">Todos os tons</option>
            {keys.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <select
            className="tap-target rounded-md border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
            value={rhythmFilter}
            onChange={(e) => setRhythmFilter(e.target.value)}
          >
            <option value="">Todos os ritmos</option>
            {rhythms.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            className="tap-target rounded-md border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
          >
            <option value="">Toda dificuldade</option>
            <option value="facil">Fácil</option>
            <option value="medio">Médio</option>
            <option value="dificil">Difícil</option>
          </select>
          <select
            className="tap-target rounded-md border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
          >
            <option value="alfabetica">Ordem alfabética</option>
            <option value="artista">Por artista</option>
            <option value="tom">Por tom</option>
            <option value="mais-tocadas">Mais tocadas</option>
            <option value="recentes">Recentes</option>
            <option value="nao-treinadas">Ainda não treinadas</option>
          </select>
          <label className="tap-target flex items-center gap-1.5 rounded-md border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700">
            <input
              type="checkbox"
              checked={onlyFavorites}
              onChange={(e) => setOnlyFavorites(e.target.checked)}
            />
            Favoritas
          </label>
        </div>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {visibleSongs.map((song) => (
          <li key={song.id} className="rounded-lg bg-surface px-3 py-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{song.title}</p>
                <p className="text-xs text-slate-500">
                  {song.artist ? `${song.artist} · ` : ''}Tom {song.preferredKey}
                  {song.rhythm ? ` · ${song.rhythm}` : ''}
                  {song.difficulty ? ` · ${song.difficulty}` : ''}
                  {song.timesPlayed > 0 ? ` · tocada ${song.timesPlayed}x` : ''}
                </p>
                {song.tags.length > 0 && (
                  <p className="mt-1 text-xs text-slate-400">{song.tags.join(' · ')}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  aria-label="Favoritar"
                  className="tap-target text-lg"
                  onClick={() => toggleFavorite(song.id, !song.favorite)}
                >
                  {song.favorite ? '★' : '☆'}
                </button>
                <Link
                  to={`/tocar?song=${song.id}`}
                  aria-label="Tocar"
                  title="Tocar"
                  className="tap-target flex items-center justify-center rounded-md bg-slate-900 px-2.5 py-1.5 text-sm text-white dark:bg-slate-100 dark:text-slate-900"
                >
                  ▶
                </Link>
                <Link
                  to={`/editor/${song.id}`}
                  className="tap-target text-xs text-slate-500 underline"
                >
                  Editar
                </Link>
                <DownloadMenu song={song} notation={settings.notation} accordionType={settings.accordionType} />
                <button
                  aria-label="Excluir"
                  className="tap-target text-xs text-red-500 underline"
                  onClick={() => deleteSong(song.id)}
                >
                  Excluir
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {songs?.length === 0 && (
        <p className="mt-6 text-center text-sm text-slate-500">
          Nenhuma música ainda. Toque em "+ Nova música" — ela fica salva no
          seu aparelho, mesmo offline.
        </p>
      )}
      {(songs?.length ?? 0) > 0 && visibleSongs.length === 0 && (
        <p className="mt-6 text-center text-sm text-slate-500">
          Nenhuma música encontrada com esses filtros.
        </p>
      )}
    </div>
  )
}

/** Baixar/imprimir uma música (item "Exportar/Backup") — menu simples com
 * <details>, sem precisar de estado próprio pra abrir/fechar. */
function DownloadMenu({ song, notation, accordionType }: { song: Song; notation: ChordNotation; accordionType: AccordionType }) {
  return (
    <details className="tap-target relative inline-block text-xs">
      <summary className="cursor-pointer list-none text-slate-500 underline">Baixar</summary>
      <div className="absolute right-0 z-20 mt-1 flex w-40 flex-col gap-1 rounded-md border border-slate-200 bg-surface p-2 shadow-lg dark:border-slate-700">
        <button
          className="rounded px-2 py-1.5 text-left hover:bg-surface-alt"
          onClick={() => downloadSongText(song, notation)}
        >
          Texto (.txt)
        </button>
        <button
          className="rounded px-2 py-1.5 text-left hover:bg-surface-alt"
          onClick={() => downloadSongChordPro(song)}
        >
          ChordPro (.cho)
        </button>
        <button
          className="rounded px-2 py-1.5 text-left hover:bg-surface-alt"
          onClick={() => printSongs([song], notation, song.title, accordionType)}
        >
          Imprimir / PDF
        </button>
      </div>
    </details>
  )
}
