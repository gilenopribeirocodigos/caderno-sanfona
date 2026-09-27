/** Converte um link de YouTube colado pelo usuário (watch, youtu.be, shorts,
 * já em /embed/...) no formato de embed que dá pra tocar num <iframe>.
 * Retorna undefined se o link não for reconhecido, pra nunca embutir um
 * iframe quebrado. */
export function youtubeEmbedUrl(url: string | undefined): string | undefined {
  if (!url?.trim()) return undefined
  let parsed: URL
  try {
    parsed = new URL(url.trim())
  } catch {
    return undefined
  }

  const host = parsed.hostname.replace(/^www\./, '')
  let videoId: string | undefined

  if (host === 'youtu.be') {
    videoId = parsed.pathname.slice(1).split('/')[0]
  } else if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
    if (parsed.pathname === '/watch') videoId = parsed.searchParams.get('v') ?? undefined
    else if (parsed.pathname.startsWith('/embed/')) videoId = parsed.pathname.split('/')[2]
    else if (parsed.pathname.startsWith('/shorts/')) videoId = parsed.pathname.split('/')[2]
    else if (parsed.pathname.startsWith('/live/')) videoId = parsed.pathname.split('/')[2]
  }

  if (!videoId) return undefined
  return `https://www.youtube.com/embed/${videoId}`
}
