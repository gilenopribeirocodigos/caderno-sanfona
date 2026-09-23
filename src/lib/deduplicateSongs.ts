import { db, deletionId } from './db'
import { normalizedIdentity } from './songsRepo'
import { queueSyncChange, removePendingChange } from './syncQueue'
import type { Song, SongVersion } from '@/types'

function identity(song: Song): string {
  return JSON.stringify([
    normalizedIdentity(song.title),
    normalizedIdentity(song.artist),
    song.lyrics.trim().replace(/\r\n/g, '\n'),
  ])
}

/** Reúne cópias da mesma letra em um registro, mantendo cifras alternativas no histórico. */
export async function consolidateDuplicateSongs(): Promise<string[]> {
  const songs = await db.songs.toArray()
  const groups = new Map<string, Song[]>()
  for (const song of songs) {
    const key = identity(song)
    groups.set(key, [...(groups.get(key) ?? []), song])
  }

  const removedIds: string[] = []
  const changedIds = new Set<string>()
  const changedVersions = new Set<string>()
  const changedNotebookSongs = new Set<string>()
  const changedPractice = new Set<string>()

  await db.transaction('rw', [db.songs, db.songVersions, db.notebookSongs, db.practiceHistory, db.syncDeletions], async () => {
    for (const group of groups.values()) {
      if (group.length < 2) continue
      group.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id))
      const keeper = { ...group[0] }
      for (const duplicate of group.slice(1)) {
        const alternativeChords = JSON.stringify(duplicate.chordData)
        const alreadySaved = await db.songVersions.where('songId').equals(keeper.id)
          .and((version) => version.key === duplicate.preferredKey && JSON.stringify(version.chordData) === alternativeChords)
          .first()
        if (alternativeChords !== JSON.stringify(keeper.chordData) && !alreadySaved) {
          const version: SongVersion = {
            id: crypto.randomUUID(), songId: keeper.id,
            name: `Cifras da cópia de ${new Date(duplicate.createdAt).toLocaleString('pt-BR')}`,
            key: duplicate.preferredKey, lyrics: duplicate.lyrics,
            chordData: duplicate.chordData, createdAt: new Date().toISOString(),
          }
          await db.songVersions.add(version)
          changedVersions.add(version.id)
        }

        for (const version of await db.songVersions.where('songId').equals(duplicate.id).toArray()) {
          await db.songVersions.update(version.id, { songId: keeper.id })
          changedVersions.add(version.id)
        }
        for (const entry of await db.notebookSongs.where('songId').equals(duplicate.id).toArray()) {
          const alreadyLinked = await db.notebookSongs.where('notebookId').equals(entry.notebookId)
            .and((item) => item.songId === keeper.id).first()
          if (alreadyLinked) await db.notebookSongs.delete(entry.id)
          else {
            await db.notebookSongs.update(entry.id, { songId: keeper.id })
            changedNotebookSongs.add(entry.id)
          }
        }
        for (const entry of await db.practiceHistory.where('songId').equals(duplicate.id).toArray()) {
          await db.practiceHistory.update(entry.id, { songId: keeper.id })
          changedPractice.add(entry.id)
        }
        // Os contadores podem já incluir a mesma execução em dois aparelhos.
        // Somá-los inflaria o total a cada sincronização de um aparelho antigo.
        keeper.timesPlayed = Math.max(keeper.timesPlayed, duplicate.timesPlayed)
        keeper.favorite ||= duplicate.favorite
        keeper.tags = [...new Set([...keeper.tags, ...duplicate.tags])]
        keeper.lastPracticedAt = [keeper.lastPracticedAt, duplicate.lastPracticedAt].filter(Boolean).sort().at(-1)
        keeper.notes ||= duplicate.notes
        await db.syncDeletions.put({
          id: deletionId('songs', duplicate.id), table: 'songs', recordId: duplicate.id,
          deletedAt: new Date().toISOString(),
        })
        await db.songs.delete(duplicate.id)
        removedIds.push(duplicate.id)
      }
      keeper.updatedAt = new Date().toISOString()
      await db.songs.put(keeper)
      changedIds.add(keeper.id)
    }
  })

  for (const id of removedIds) removePendingChange({ table: 'songs', id })
  for (const id of removedIds) queueSyncChange('syncDeletions', deletionId('songs', id))
  for (const id of changedIds) queueSyncChange('songs', id)
  for (const id of changedVersions) queueSyncChange('songVersions', id)
  for (const id of changedNotebookSongs) queueSyncChange('notebookSongs', id)
  for (const id of changedPractice) queueSyncChange('practiceHistory', id)
  return removedIds
}
