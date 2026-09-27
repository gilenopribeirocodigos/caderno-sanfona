import { useState } from 'react'
import { youtubeEmbedUrl } from '@/utils/youtube'

interface MediaPanelProps {
  videoUrl?: string
  karaokeUrl?: string
  onClose: () => void
}

/** Painel "Mídia" (item 173): vídeo do YouTube da música e, se tiver, uma
 * versão karaokê — alterna entre os dois só quando os dois existem. */
export default function MediaPanel({ videoUrl, karaokeUrl, onClose }: MediaPanelProps) {
  const [tab, setTab] = useState<'video' | 'karaoke'>('video')
  const showToggle = Boolean(videoUrl && karaokeUrl)
  const activeUrl = tab === 'karaoke' && karaokeUrl ? karaokeUrl : videoUrl
  const embedUrl = youtubeEmbedUrl(activeUrl)

  return (
    <div className="shrink-0 border-b border-slate-200 bg-surface p-3 dark:border-slate-800">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">MÍDIA</span>
        <button className="tap-target text-xs text-slate-500" onClick={onClose}>
          ✕ Fechar
        </button>
      </div>

      {showToggle && (
        <div className="mb-2 flex gap-1 rounded-md bg-surface-alt p-1">
          <button
            className={`tap-target flex-1 rounded-md py-1.5 text-xs font-semibold ${
              tab === 'video' ? 'bg-[var(--color-gold)] text-slate-900' : 'text-slate-500'
            }`}
            onClick={() => setTab('video')}
          >
            Vídeo
          </button>
          <button
            className={`tap-target flex-1 rounded-md py-1.5 text-xs font-semibold ${
              tab === 'karaoke' ? 'bg-[var(--color-gold)] text-slate-900' : 'text-slate-500'
            }`}
            onClick={() => setTab('karaoke')}
          >
            Karaokê
          </button>
        </div>
      )}

      {embedUrl ? (
        <div className="w-full overflow-hidden rounded-lg bg-black" style={{ aspectRatio: '16 / 9' }}>
          <iframe
            key={embedUrl}
            src={embedUrl}
            className="h-full w-full"
            title="Vídeo da música"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <p className="text-xs text-slate-500">Link de vídeo inválido ou não reconhecido.</p>
      )}
    </div>
  )
}
