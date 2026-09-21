import { useId } from 'react'

/**
 * Ilustração decorativa de uma sanfona, em SVG próprio (sem depender de
 * fotos externas): teclado à esquerda, fole ao centro, baixos à direita —
 * com gradientes e sombreado para dar volume, usada na tela de login e
 * como marca d'água dentro do app.
 */
export default function AccordionArt({
  className = '',
  animated = false,
  slow = false,
  flat = false,
}: {
  className?: string
  /** Anima o fole em um leve "respirar", como se a sanfona estivesse tocando. */
  animated?: boolean
  /** Respiração bem mais lenta, para marcas d'água grandes em segundo plano. */
  slow?: boolean
  /**
   * Sem o filtro de sombra (custa mais para o navegador redesenhar).
   * Usado em marcas d'água grandes/decorativas, onde a sombra nem é
   * percebida por causa da baixa opacidade — importa mais desempenho
   * em celulares mais fracos do que esse detalhe.
   */
  flat?: boolean
}) {
  const uid = useId().replace(/:/g, '')
  const N = 15 // número de dobras do fole
  const foleStart = 108
  const foleEnd = 388
  const step = (foleEnd - foleStart) / N
  const topOut = 26
  const topIn = 16
  const botOut = 234
  const botIn = 244

  return (
    <svg viewBox="0 0 520 300" className={className} role="presentation" aria-hidden="true">
      <defs>
        <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-brand-light)" />
          <stop offset="45%" stopColor="var(--color-brand)" />
          <stop offset="100%" stopColor="var(--color-brand-dark)" />
        </linearGradient>
        <linearGradient id={`${uid}-sheen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="35%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${uid}-key`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fffdf7" />
          <stop offset="100%" stopColor="#e7dcc2" />
        </linearGradient>
        <linearGradient id={`${uid}-foldA`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-brand-light)" />
          <stop offset="100%" stopColor="var(--color-brand)" />
        </linearGradient>
        <linearGradient id={`${uid}-foldB`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-brand-dark)" />
          <stop offset="100%" stopColor="#2c0916" />
        </linearGradient>
        <radialGradient id={`${uid}-button`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#fffdf5" />
          <stop offset="55%" stopColor="#efe2ba" />
          <stop offset="100%" stopColor="var(--color-gold)" />
        </radialGradient>
        <linearGradient id={`${uid}-strap`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a2a1c" />
          <stop offset="100%" stopColor="#1c130c" />
        </linearGradient>
        {!flat && (
          <filter id={`${uid}-shadow`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.35" />
          </filter>
        )}
      </defs>

      {/* Corpo do teclado (mão direita) */}
      <g filter={flat ? undefined : `url(#${uid}-shadow)`}>
        <rect x="14" y="10" width="100" height="248" rx="18" fill={`url(#${uid}-body)`} />
        <rect x="14" y="10" width="100" height="248" rx="18" fill={`url(#${uid}-sheen)`} />
      </g>
      <rect x="14" y="10" width="100" height="248" rx="18" fill="none" stroke="var(--color-gold)" strokeOpacity="0.5" strokeWidth="1.5" />
      <rect x="30" y="30" width="68" height="200" rx="6" fill={`url(#${uid}-key)`} />
      {Array.from({ length: 10 }).map((_, i) => (
        <line key={i} x1="30" y1={30 + (i + 1) * (200 / 11)} x2="98" y2={30 + (i + 1) * (200 / 11)} stroke="#c9b98d" strokeWidth="1" />
      ))}
      <line x1="64" y1="30" x2="64" y2="230" stroke="#d8cba9" strokeWidth="1" strokeDasharray="2 3" />
      {/* correia decorativa superior */}
      <rect x="18" y="4" width="92" height="12" rx="6" fill={`url(#${uid}-strap)`} />
      <rect x="56" y="2" width="16" height="16" rx="2" fill="var(--color-gold)" stroke="#7a5a12" strokeWidth="0.75" />

      {/* Fole (parte central sanfonada) — "respira" quando animated */}
      <g className={animated ? `accordion-breathe${slow ? ' accordion-breathe-slow' : ''}` : undefined}>
        {Array.from({ length: N }).map((_, i) => {
          const x0 = foleStart + i * step
          const x1 = x0 + step / 2
          const x2 = x0 + step
          const tY0 = i % 2 === 0 ? topOut : topIn
          const tY1 = i % 2 === 0 ? topIn : topOut
          const bY0 = i % 2 === 0 ? botOut : botIn
          const bY1 = i % 2 === 0 ? botIn : botOut
          return (
            <polygon
              key={i}
              points={`${x0},${tY0} ${x1},${tY1} ${x2},${tY0} ${x2},${bY0} ${x1},${bY1} ${x0},${bY0}`}
              fill={i % 2 === 0 ? `url(#${uid}-foldA)` : `url(#${uid}-foldB)`}
              stroke="#2c0916"
              strokeOpacity="0.4"
              strokeWidth="0.75"
            />
          )
        })}
      </g>
      {/* friso dourado nas quinas do fole junto aos corpos (fixo, não "respira") */}
      <rect x={foleStart - 4} y="20" width="8" height="224" rx="3" fill="var(--color-gold)" opacity="0.55" />
      <rect x={foleEnd - 4} y="20" width="8" height="224" rx="3" fill="var(--color-gold)" opacity="0.55" />

      {/* Corpo dos baixos (mão esquerda) */}
      <g filter={flat ? undefined : `url(#${uid}-shadow)`}>
        <rect x="382" y="14" width="128" height="252" rx="18" fill={`url(#${uid}-body)`} />
        <rect x="382" y="14" width="128" height="252" rx="18" fill={`url(#${uid}-sheen)`} />
      </g>
      <rect x="382" y="14" width="128" height="252" rx="18" fill="none" stroke="var(--color-gold)" strokeOpacity="0.5" strokeWidth="1.5" />
      {/* grelha decorativa em leque */}
      <g stroke="var(--color-gold)" strokeOpacity="0.35" strokeWidth="1.5" fill="none">
        {[-32, -16, 0, 16, 32].map((angle) => (
          <path key={angle} d={`M446,42 L${446 + 30 * Math.sin((angle * Math.PI) / 180)},${42 - 28 * Math.cos((angle * Math.PI) / 180)}`} />
        ))}
      </g>
      {Array.from({ length: 6 }).map((_, row) =>
        Array.from({ length: 3 }).map((_, col) => (
          <circle
            key={`${row}-${col}`}
            cx={402 + col * 20 + (row % 2) * 4}
            cy={88 + row * 32}
            r="8"
            fill={`url(#${uid}-button)`}
            stroke="#7a5a12"
            strokeWidth="1"
          />
        )),
      )}
      {/* correia decorativa superior */}
      <rect x="386" y="8" width="120" height="12" rx="6" fill={`url(#${uid}-strap)`} />
      <rect x="438" y="6" width="16" height="16" rx="2" fill="var(--color-gold)" stroke="#7a5a12" strokeWidth="0.75" />
    </svg>
  )
}
