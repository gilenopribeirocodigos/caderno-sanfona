import { supabase } from './supabaseClient'
import { db, LOCAL_USER_ID } from './db'
import type {
  AppSettings,
  Notebook,
  NotebookSong,
  PracticeHistoryEntry,
  Song,
  SongVersion,
} from '@/types'

/**
 * Sincronização (Etapa 11, item 35): traz primeiro o estado atual da
 * nuvem (o que veio de outros aparelhos) e funde localmente, e só depois
 * envia o estado local — já atualizado — de volta para a nuvem. Nessa
 * ordem, uma edição feita durante a sincronização nunca é perdida nem
 * revertida por engano. Se a MESMA música foi editada em dois aparelhos
 * entre uma sincronização e outra, vale a edição do aparelho que
 * sincronizar por último — aceitável para uso pessoal, mas vale saber.
 */

function songToRemote(s: Song, userId: string) {
  return {
    id: s.id,
    user_id: userId,
    title: s.title,
    artist: s.artist ?? null,
    original_key: s.originalKey,
    preferred_key: s.preferredKey,
    lyrics: s.lyrics,
    chord_data: s.chordData,
    bpm: s.bpm ?? null,
    rhythm: s.rhythm ?? null,
    time_signature: s.timeSignature ?? null,
    difficulty: s.difficulty ?? null,
    notes: s.notes ?? null,
    tags: s.tags,
    favorite: s.favorite,
    last_practiced_at: s.lastPracticedAt ?? null,
    times_played: s.timesPlayed,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function songFromRemote(r: any): Song {
  return {
    id: r.id,
    userId: r.user_id,
    title: r.title,
    artist: r.artist ?? undefined,
    originalKey: r.original_key,
    preferredKey: r.preferred_key,
    lyrics: r.lyrics,
    chordData: r.chord_data,
    bpm: r.bpm ?? undefined,
    rhythm: r.rhythm ?? undefined,
    timeSignature: r.time_signature ?? undefined,
    difficulty: r.difficulty ?? undefined,
    notes: r.notes ?? undefined,
    tags: r.tags ?? [],
    favorite: r.favorite,
    lastPracticedAt: r.last_practiced_at ?? undefined,
    timesPlayed: r.times_played,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function notebookToRemote(n: Notebook, userId: string) {
  return { id: n.id, user_id: userId, name: n.name, description: n.description ?? null, created_at: n.createdAt }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function notebookFromRemote(r: any): Notebook {
  return { id: r.id, userId: r.user_id, name: r.name, description: r.description ?? undefined, createdAt: r.created_at }
}

function notebookSongToRemote(ns: NotebookSong, userId: string) {
  return { id: ns.id, user_id: userId, notebook_id: ns.notebookId, song_id: ns.songId, position: ns.position }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function notebookSongFromRemote(r: any): NotebookSong {
  return { id: r.id, notebookId: r.notebook_id, songId: r.song_id, position: r.position }
}

function songVersionToRemote(v: SongVersion, userId: string) {
  return {
    id: v.id,
    user_id: userId,
    song_id: v.songId,
    name: v.name,
    key: v.key,
    lyrics: v.lyrics,
    chord_data: v.chordData,
    created_at: v.createdAt,
  }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function songVersionFromRemote(r: any): SongVersion {
  return { id: r.id, songId: r.song_id, name: r.name, key: r.key, lyrics: r.lyrics, chordData: r.chord_data, createdAt: r.created_at }
}

function practiceToRemote(p: PracticeHistoryEntry, userId: string) {
  return {
    id: p.id,
    user_id: userId,
    song_id: p.songId,
    date: p.date,
    duration_seconds: p.durationSeconds ?? null,
    bpm: p.bpm ?? null,
    notes: p.notes ?? null,
  }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function practiceFromRemote(r: any): PracticeHistoryEntry {
  return { id: r.id, songId: r.song_id, date: r.date, durationSeconds: r.duration_seconds ?? undefined, bpm: r.bpm ?? undefined, notes: r.notes ?? undefined }
}

function settingsToRemote(s: AppSettings, userId: string) {
  return {
    user_id: userId,
    notation: s.notation,
    font_size: s.fontSize,
    chord_size: s.chordSize,
    theme: s.theme,
    auto_scroll_speed: s.autoScrollSpeed,
    accordion_type: s.accordionType,
    help_level: s.helpLevel,
    external_controller_mapping: s.externalControllerMapping,
  }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function settingsFromRemote(r: any): AppSettings {
  return {
    userId: LOCAL_USER_ID,
    notation: r.notation,
    fontSize: r.font_size,
    chordSize: r.chord_size,
    theme: r.theme,
    autoScrollSpeed: r.auto_scroll_speed,
    accordionType: r.accordion_type,
    helpLevel: r.help_level,
    externalControllerMapping: r.external_controller_mapping ?? {},
  }
}

// Garante que nunca existam duas sincronizações rodando ao mesmo tempo —
// por exemplo, a automática (ao abrir o app) e um toque em "Sincronizar
// agora" logo em seguida. Sem isso, duas idas e voltas concorrentes podiam
// se atropelar (uma lia o banco local enquanto a outra ainda estava
// escrevendo nele), o que explica tanto travamentos quanto dados
// duplicados. Uma segunda chamada, nesse caso, só espera a primeira acabar.
let inFlightSync: Promise<void> | null = null
const SYNC_TIMEOUT_MS = 25_000

export function syncNow(userId: string): Promise<void> {
  if (inFlightSync) return inFlightSync
  inFlightSync = runSync(userId).finally(() => {
    inFlightSync = null
  })
  return inFlightSync
}

async function runSync(userId: string): Promise<void> {
  // Nunca deixa girar para sempre numa conexão ruim (item do celular
  // "travando"): depois de um tempo razoável, desiste com um erro claro
  // em vez de deixar o botão preso em "Sincronizando..." por horas.
  let timeoutId: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error('Sincronização demorou demais — verifique sua internet e tente de novo.')),
      SYNC_TIMEOUT_MS,
    )
  })
  try {
    await Promise.race([performSync(userId), timeout])
  } finally {
    clearTimeout(timeoutId!)
  }
}

async function performSync(userId: string): Promise<void> {
  if (!supabase) throw new Error('Nuvem não configurada')

  // 1) Traz primeiro o estado atual da nuvem (o que veio de outros
  // aparelhos) e funde localmente. Isso roda logo ao abrir o app — antes
  // de a pessoa mexer em qualquer coisa — de propósito: fazer essa parte
  // por último (como era antes) tinha um defeito real, sobrescrevendo uma
  // mudança feita na tela de Configurações bem na hora em que a
  // sincronização terminava, dando a impressão de tela travada/sem efeito.
  const [remoteSongs, remoteNotebooks, remoteNotebookSongs, remoteVersions, remotePractice, remoteSettings] =
    await Promise.all([
      supabase.from('songs').select('*').eq('user_id', userId),
      supabase.from('notebooks').select('*').eq('user_id', userId),
      supabase.from('notebook_songs').select('*').eq('user_id', userId),
      supabase.from('song_versions').select('*').eq('user_id', userId),
      supabase.from('practice_history').select('*').eq('user_id', userId),
      supabase.from('settings').select('*').eq('user_id', userId).maybeSingle(),
    ])

  for (const [label, res] of Object.entries({
    songs: remoteSongs,
    notebooks: remoteNotebooks,
    notebookSongs: remoteNotebookSongs,
    songVersions: remoteVersions,
    practiceHistory: remotePractice,
    settings: remoteSettings,
  })) {
    if (res.error) throw new Error(`${label}: ${res.error.message}`)
  }

  // "settings" fica de fora dessa transação de propósito: é a tabela que
  // a tela de Configurações usa toda hora, e uma transação grande (com
  // músicas, cadernos etc.) pode demorar mais em aparelhos mais fracos —
  // prender "settings" nela deixava os botões de Configurações lentos
  // até a sincronização inteira terminar. Separada, o registro de
  // configurações é gravado sozinho, quase instantâneo.
  await db.transaction(
    'rw',
    [db.songs, db.notebooks, db.notebookSongs, db.songVersions, db.practiceHistory],
    async () => {
      if (remoteSongs.data) await db.songs.bulkPut(remoteSongs.data.map(songFromRemote))
      if (remoteNotebooks.data) await db.notebooks.bulkPut(remoteNotebooks.data.map(notebookFromRemote))
      if (remoteNotebookSongs.data)
        await db.notebookSongs.bulkPut(remoteNotebookSongs.data.map(notebookSongFromRemote))
      if (remoteVersions.data) await db.songVersions.bulkPut(remoteVersions.data.map(songVersionFromRemote))
      if (remotePractice.data) await db.practiceHistory.bulkPut(remotePractice.data.map(practiceFromRemote))
    },
  )
  if (remoteSettings.data) await db.settings.put(settingsFromRemote(remoteSettings.data))

  // 2) Só agora lê o estado local (já com o que veio da nuvem, mais
  // qualquer edição feita nesse meio tempo) e envia pra nuvem — assim uma
  // mudança feita durante a sincronização nunca é perdida nem revertida.
  const [songs, notebooks, notebookSongs, songVersions, practiceHistory, settings] = await Promise.all([
    db.songs.toArray(),
    db.notebooks.toArray(),
    db.notebookSongs.toArray(),
    db.songVersions.toArray(),
    db.practiceHistory.toArray(),
    db.settings.get(LOCAL_USER_ID),
  ])

  if (songs.length > 0) {
    const { error } = await supabase.from('songs').upsert(songs.map((s) => songToRemote(s, userId)))
    if (error) throw error
  }
  if (notebooks.length > 0) {
    const { error } = await supabase.from('notebooks').upsert(notebooks.map((n) => notebookToRemote(n, userId)))
    if (error) throw error
  }
  if (notebookSongs.length > 0) {
    const { error } = await supabase
      .from('notebook_songs')
      .upsert(notebookSongs.map((ns) => notebookSongToRemote(ns, userId)))
    if (error) throw error
  }
  if (songVersions.length > 0) {
    const { error } = await supabase
      .from('song_versions')
      .upsert(songVersions.map((v) => songVersionToRemote(v, userId)))
    if (error) throw error
  }
  if (practiceHistory.length > 0) {
    const { error } = await supabase
      .from('practice_history')
      .upsert(practiceHistory.map((p) => practiceToRemote(p, userId)))
    if (error) throw error
  }
  if (settings) {
    const { error } = await supabase.from('settings').upsert(settingsToRemote(settings, userId))
    if (error) throw error
  }
}

// Apagar não era enviado pra nuvem antes — só criar/editar (upsert). Por
// isso excluir uma música no aparelho, e depois sincronizar, trazia ela de
// volta (ainda existia na nuvem). Estas funções são chamadas direto na
// hora de excluir (ver songsRepo/notebooksRepo), então a nuvem já fica
// correta antes mesmo da próxima sincronização completa.
export async function deleteRemoteSong(id: string): Promise<void> {
  if (!supabase) return
  await supabase.from('songs').delete().eq('id', id)
}

export async function deleteRemoteNotebook(id: string): Promise<void> {
  if (!supabase) return
  await supabase.from('notebooks').delete().eq('id', id)
}

export async function deleteRemoteNotebookSong(id: string): Promise<void> {
  if (!supabase) return
  await supabase.from('notebook_songs').delete().eq('id', id)
}
