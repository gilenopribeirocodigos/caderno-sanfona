import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { createSong, deleteSong, toggleFavorite } from '@/lib/songsRepo'

/**
 * Etapa 2: prova de que o banco local (Dexie/IndexedDB) funciona —
 * criar, listar, favoritar e excluir músicas, persistindo entre recargas
 * da página e mesmo offline. A UI completa (filtros, edição) vem na
 * Etapa 3.
 */
export default function Library() {
  const songs = useLiveQuery(() => db.songs.orderBy('title').toArray(), [])
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [originalKey, setOriginalKey] = useState('C')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    await createSong({ title, artist, originalKey, lyrics: '' })
    setTitle('')
    setArtist('')
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h2 className="text-xl font-semibold">Biblioteca</h2>

      <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-2 rounded-lg bg-surface p-3">
        <input
          className="tap-target rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          placeholder="Título da música"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="flex gap-2">
          <input
            className="tap-target flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            placeholder="Artista (opcional)"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
          />
          <input
            className="tap-target w-20 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            placeholder="Tom"
            value={originalKey}
            onChange={(e) => setOriginalKey(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="tap-target rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900"
        >
          + Nova música
        </button>
      </form>

      <ul className="mt-4 flex flex-col gap-2">
        {songs?.map((song) => (
          <li
            key={song.id}
            className="flex items-center justify-between rounded-lg bg-surface px-3 py-2"
          >
            <div>
              <p className="font-medium">{song.title}</p>
              <p className="text-xs text-slate-500">
                {song.artist ? `${song.artist} · ` : ''}Tom {song.preferredKey}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                aria-label="Favoritar"
                className="tap-target text-lg"
                onClick={() => toggleFavorite(song.id, !song.favorite)}
              >
                {song.favorite ? '★' : '☆'}
              </button>
              <button
                aria-label="Excluir"
                className="tap-target text-sm text-red-500"
                onClick={() => deleteSong(song.id)}
              >
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>

      {songs?.length === 0 && (
        <p className="mt-6 text-center text-sm text-slate-500">
          Nenhuma música ainda. Crie a primeira acima — ela fica salva no
          seu aparelho, mesmo offline.
        </p>
      )}
    </div>
  )
}
