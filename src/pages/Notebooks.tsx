import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { createNotebook, deleteNotebook } from '@/lib/notebooksRepo'

export default function Notebooks() {
  const notebooks = useLiveQuery(() => db.notebooks.toArray(), [])
  const notebookSongs = useLiveQuery(() => db.notebookSongs.toArray(), [])
  const [name, setName] = useState('')

  const countFor = (notebookId: string) =>
    notebookSongs?.filter((ns) => ns.notebookId === notebookId).length ?? 0

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    await createNotebook(name)
    setName('')
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h2 className="text-xl font-semibold">Cadernos</h2>
      <p className="mt-1 text-sm text-slate-500">
        Organize suas músicas em repertórios (Aula, Forró, Apresentação de
        sábado...). Uma música pode estar em vários cadernos.
      </p>

      <form onSubmit={handleCreate} className="mt-4 flex gap-2">
        <input
          className="tap-target flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          placeholder="Nome do caderno (ex: Forró de sábado)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          type="submit"
          className="tap-target rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900"
        >
          Criar
        </button>
      </form>

      <ul className="mt-4 flex flex-col gap-2">
        {notebooks?.map((nb) => (
          <li key={nb.id} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2">
            <Link to={`/cadernos/${nb.id}`} className="flex-1">
              <p className="font-medium">{nb.name}</p>
              <p className="text-xs text-slate-500">{countFor(nb.id)} música(s)</p>
            </Link>
            <button
              aria-label="Excluir caderno"
              className="tap-target text-xs text-red-500 underline"
              onClick={() => deleteNotebook(nb.id)}
            >
              Excluir
            </button>
          </li>
        ))}
      </ul>

      {notebooks?.length === 0 && (
        <p className="mt-6 text-center text-sm text-slate-500">
          Nenhum caderno ainda. Crie o primeiro acima.
        </p>
      )}
    </div>
  )
}
