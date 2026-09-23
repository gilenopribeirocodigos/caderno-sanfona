import { db, deletionId, type DeletableTable, type SyncDeletion } from './db'
import { supabase } from './supabaseClient'

const LEGACY_DUPLICATES_KEY = 'mergedDuplicateSongIds'
const TABLES: DeletableTable[] = ['notebook_songs', 'songs', 'notebooks']

function remoteMarker(marker: SyncDeletion, userId: string) {
  return {
    user_id: userId,
    entity_type: marker.table,
    record_id: marker.recordId,
    deleted_at: marker.deletedAt,
  }
}

async function importLegacyDuplicateMarkers(): Promise<void> {
  const raw = localStorage.getItem(LEGACY_DUPLICATES_KEY)
  if (!raw) return
  let ids: unknown
  try { ids = JSON.parse(raw) } catch { return }
  if (!Array.isArray(ids)) return
  for (const id of ids) {
    if (typeof id !== 'string') continue
    const markerId = deletionId('songs', id)
    if (!(await db.syncDeletions.get(markerId))) {
      await db.syncDeletions.put({ id: markerId, table: 'songs', recordId: id, deletedAt: new Date().toISOString() })
    }
  }
  localStorage.removeItem(LEGACY_DUPLICATES_KEY)
}

export async function publishLocalDeletions(userId: string): Promise<void> {
  if (!supabase) throw new Error('Nuvem não configurada')
  const markers = await db.syncDeletions.toArray()
  if (!markers.length) return
  const { error } = await supabase.from('sync_deletions').upsert(markers.map((marker) => remoteMarker(marker, userId)))
  if (error) throw new Error(`Exclusões: ${error.message}`)
}

export async function purgeLocalDeleted(): Promise<void> {
  await db.transaction('rw', [db.syncDeletions, db.songs, db.notebooks, db.notebookSongs, db.songVersions, db.practiceHistory], async () => {
    const markers = await db.syncDeletions.toArray()
    for (const marker of markers) {
      switch (marker.table) {
        case 'songs':
          await db.notebookSongs.where('songId').equals(marker.recordId).delete()
          await db.songVersions.where('songId').equals(marker.recordId).delete()
          await db.practiceHistory.where('songId').equals(marker.recordId).delete()
          await db.songs.delete(marker.recordId)
          break
        case 'notebooks':
          await db.notebookSongs.where('notebookId').equals(marker.recordId).delete()
          await db.notebooks.delete(marker.recordId)
          break
        case 'notebook_songs':
          await db.notebookSongs.delete(marker.recordId)
          break
      }
    }
  })
}

export async function deleteCloudDeleted(userId: string): Promise<void> {
  if (!supabase) throw new Error('Nuvem não configurada')
  const markers = await db.syncDeletions.toArray()
  for (const table of TABLES) {
    const ids = markers.filter((marker) => marker.table === table).map((marker) => marker.recordId)
    if (!ids.length) continue
    const { error } = await supabase.from(table).delete().eq('user_id', userId).in('id', ids)
    if (error) throw new Error(`Excluir ${table}: ${error.message}`)
  }
}

/** Publica exclusões antes de qualquer envio e aplica exclusões de outros aparelhos. */
export async function exchangeDeletionMarkers(userId: string): Promise<void> {
  if (!supabase) throw new Error('Nuvem não configurada')
  await importLegacyDuplicateMarkers()
  await publishLocalDeletions(userId)
  const { data, error } = await supabase.from('sync_deletions').select('*').eq('user_id', userId)
  if (error) throw new Error(`Exclusões: ${error.message}`)
  const markers: SyncDeletion[] = (data ?? [])
    .filter((row) => TABLES.includes(row.entity_type as DeletableTable))
    .map((row) => ({
      id: deletionId(row.entity_type as DeletableTable, row.record_id as string),
      table: row.entity_type as DeletableTable,
      recordId: row.record_id as string,
      deletedAt: row.deleted_at as string,
    }))
  if (markers.length) await db.syncDeletions.bulkPut(markers)
  await purgeLocalDeleted()
  await deleteCloudDeleted(userId)
}
