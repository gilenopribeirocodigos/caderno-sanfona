export type SyncTable =
  | 'songs'
  | 'notebooks'
  | 'notebookSongs'
  | 'songVersions'
  | 'practiceHistory'
  | 'settings'
  | 'syncDeletions'

export interface PendingChange {
  table: SyncTable
  id: string
}

const PENDING_CHANGES_KEY = 'pendingSyncChanges'

export function pendingKey(change: PendingChange): string {
  return `${change.table}:${change.id}`
}

export function getPendingChanges(): PendingChange[] {
  try {
    return JSON.parse(localStorage.getItem(PENDING_CHANGES_KEY) ?? '[]') as PendingChange[]
  } catch {
    return []
  }
}

function savePendingChanges(changes: PendingChange[]): void {
  localStorage.setItem(PENDING_CHANGES_KEY, JSON.stringify(changes))
}

/**
 * Registra uma alteração local para envio. A fila fica no localStorage para
 * sobreviver a falta de internet, fechamento do navegador e suspensão do
 * Android. Alterações repetidas no mesmo registro são agrupadas.
 */
export function queueSyncChange(table: SyncTable, id: string): void {
  const next = new Map(getPendingChanges().map((change) => [pendingKey(change), change]))
  const change = { table, id }
  next.set(pendingKey(change), change)
  savePendingChanges([...next.values()])
  window.dispatchEvent(new Event('caderno-sync-requested'))
}

export function removePendingChange(change: PendingChange): void {
  savePendingChanges(getPendingChanges().filter((item) => pendingKey(item) !== pendingKey(change)))
}
