import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { addSongToNotebook, moveSongInNotebook, removeSongFromNotebook } from '@/lib/notebooksRepo'
import type { NotebookSong } from '@/types'

export default function NotebookDetail() {
  const { notebookId } = useParams<{ notebookId: string }>()
  const navigate = useNavigate()
  const notebook = useLiveQuery(() => (notebookId ? db.notebooks.get(notebookId) : undefined), [notebookId])
  const entries = useLiveQuery<NotebookSong[]>(
    () =>
      notebookId
        ? db.notebookSongs.where('notebookId').equals(notebookId).sortBy('position')
        : Promise.resolve([]),
    [notebookId],
  )
  const allSongs = useLiveQuery(() => db.songs.toArray(), [])
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')

  const songsById = useMemo(() => new Map((allSongs ?? []).map((s) => [s.id, s])), [allSongs])

  const addableSongs = useMemo(() => {
    const alreadyIn = new Set((entries ?? []).map((e) => e.songId))
    const term = search.trim().toLowerCase()
    return (allSongs ?? []).filter(
      (s) =>
        !alreadyIn.has(s.id) &&
        (term === '' || s.title.toLowerCase().includes(term) || (s.artist ?? '').toLowerCase().includes(term)),
    )
  }, [allSongs, entries, search])

  if (!notebook || !notebookId) {
    return <div className="mx-auto max-w-2xl p-4 text-sm text-slate-500">Carregando...</div>
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <button className="text-sm text-slate-500" onClick={() => navigate('/cadernos')}>
        ← Cadernos
      </button>
      <div className="mt-1 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{notebook.name}</h2>
        {(entries?.length ?? 0) > 0 && (
          <Link
            to={`/tocar?notebook=${notebookId}&index=0`}
            className="tap-target rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900"
          >
            ▶ Iniciar repertório
          </Link>
        )}
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {entries?.map((entry, index) => {
          const song = songsById.get(entry.songId)
          if (!song) return null
          return (
            <li key={entry.id} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2">
              <div>
                <span className="mr-2 text-xs text-slate-400">{index + 1}.</span>
                <span className="font-medium">{song.title}</span>
                <span className="ml-2 text-xs text-slate-500">Tom {song.preferredKey}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  aria-label="Mover para cima"
                  className="tap-target text-sm disabled:opacity-30"
                  disabled={index === 0}
                  onClick={() => moveSongInNotebook(notebookId, entry.id, -1)}
                >
                  ↑
                </button>
                <button
                  aria-label="Mover para baixo"
                  className="tap-target text-sm disabled:opacity-30"
                  disabled={index === (entries?.length ?? 0) - 1}
                  onClick={() => moveSongInNotebook(notebookId, entry.id, 1)}
                >
                  ↓
                </button>
                <button
                  aria-label="Remover do caderno"
                  className="tap-target text-xs text-red-500 underline"
                  onClick={() => removeSongFromNotebook(entry.id)}
                >
                  Remover
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      {entries?.length === 0 && (
        <p className="mt-6 text-center text-sm text-slate-500">
          Nenhuma música neste caderno ainda.
        </p>
      )}

      {!showAdd ? (
        <button
          className="tap-target mt-4 w-full rounded-md border border-slate-300 py-2 text-sm dark:border-slate-700"
          onClick={() => setShowAdd(true)}
        >
          + Adicionar música ao caderno
        </button>
      ) : (
        <div className="mt-4 rounded-lg bg-surface p-3">
          <input
            className="tap-target w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            placeholder="Buscar música..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <ul className="mt-2 max-h-64 overflow-y-auto">
            {addableSongs.map((s) => (
              <li key={s.id}>
                <button
                  className="tap-target w-full rounded-md px-2 py-2 text-left text-sm hover:bg-surface-alt"
                  onClick={() => addSongToNotebook(notebookId, s.id)}
                >
                  {s.title} <span className="text-xs text-slate-500">({s.preferredKey})</span>
                </button>
              </li>
            ))}
            {addableSongs.length === 0 && (
              <li className="p-2 text-sm text-slate-500">Nenhuma música encontrada.</li>
            )}
          </ul>
          <button
            className="tap-target mt-2 w-full rounded-md border border-slate-300 py-1.5 text-sm dark:border-slate-700"
            onClick={() => setShowAdd(false)}
          >
            Fechar
          </button>
        </div>
      )}
    </div>
  )
}
