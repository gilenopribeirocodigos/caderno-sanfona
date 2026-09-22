import { db } from './db'
import type { Notebook } from '@/types'
import { queueSyncChange } from './syncQueue'

function newId(): string {
  return crypto.randomUUID()
}

export async function createNotebook(name: string, description?: string): Promise<Notebook> {
  const notebook: Notebook = {
    id: newId(),
    name: name.trim(),
    description: description?.trim() || undefined,
    createdAt: new Date().toISOString(),
  }
  await db.notebooks.add(notebook)
  queueSyncChange('notebooks', notebook.id)
  return notebook
}

export async function renameNotebook(id: string, name: string): Promise<void> {
  await db.notebooks.update(id, { name: name.trim() })
  queueSyncChange('notebooks', id)
}

export async function deleteNotebook(id: string): Promise<void> {
  await db.transaction('rw', db.notebooks, db.notebookSongs, async () => {
    await db.notebooks.delete(id)
    await db.notebookSongs.where('notebookId').equals(id).delete()
  })

  // Apaga na nuvem também (se configurada) — ver comentário equivalente
  // em songsRepo.ts/deleteSong.
  import('./sync')
    .then((m) => m.deleteRemoteNotebook(id))
    .catch(() => {})
}

/** Adiciona uma música ao final do caderno (item 5-6), sem duplicar. */
export async function addSongToNotebook(notebookId: string, songId: string): Promise<void> {
  const existing = await db.notebookSongs
    .where('notebookId')
    .equals(notebookId)
    .and((ns) => ns.songId === songId)
    .first()
  if (existing) return

  const entries = await db.notebookSongs.where('notebookId').equals(notebookId).toArray()
  const nextPosition = entries.length > 0 ? Math.max(...entries.map((e) => e.position)) + 1 : 0
  const entry = {
    id: crypto.randomUUID(),
    notebookId,
    songId,
    position: nextPosition,
  }
  await db.notebookSongs.add(entry)
  queueSyncChange('notebookSongs', entry.id)
}

export async function removeSongFromNotebook(entryId: string): Promise<void> {
  await db.notebookSongs.delete(entryId)

  import('./sync')
    .then((m) => m.deleteRemoteNotebookSong(entryId))
    .catch(() => {})
}

/** Reordena a música pressionada uma posição para cima/baixo (item 6, "Modo Organizar"). */
export async function moveSongInNotebook(
  notebookId: string,
  entryId: string,
  direction: -1 | 1,
): Promise<void> {
  const entries = (await db.notebookSongs.where('notebookId').equals(notebookId).toArray()).sort(
    (a, b) => a.position - b.position,
  )
  const index = entries.findIndex((e) => e.id === entryId)
  const swapIndex = index + direction
  if (index === -1 || swapIndex < 0 || swapIndex >= entries.length) return

  const a = entries[index]
  const b = entries[swapIndex]
  await db.transaction('rw', db.notebookSongs, async () => {
    await db.notebookSongs.update(a.id, { position: b.position })
    await db.notebookSongs.update(b.id, { position: a.position })
  })
  queueSyncChange('notebookSongs', a.id)
  queueSyncChange('notebookSongs', b.id)
}
