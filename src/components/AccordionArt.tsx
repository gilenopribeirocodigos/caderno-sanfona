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
}: {
  className?: string
  /** Anima o fole em um leve "respirar", como se a sanfona estivesse tocando. */
  animated?: boolean
  /** Respiração bem mais lenta, para marcas d'água grandes em segundo plano. */
  slow?: boolean
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
        <filter id={`${uid}-shadow`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Corpo do teclado (mão direita) */}
      <g filter={`url(#${uid}-shadow)`}>
        <rect x="14" y="10" width="100" height="248" rx="18" fill={`url(#${uid}-body)`} />
        <rect x="14" y="10" width="100" height="248" rx="18" fill={`url(#${uid}-sheen)`} />
      </g>
      <rect x="14" y="10" width="100" height="248" rx="18" fill="none" stroke="var(--color-gold)" strokeOpacity="0.5" strokeWidth="1.5" />
      <path className={animated ? 'accordion-glint' : undefined} d="M22 30v199" stroke="var(--color-gold)" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <rect x="29" y="28" width="71" height="205" rx="7" fill="#27151a" stroke="var(--color-gold)" strokeOpacity="0.6" />
      {Array.from({ length: 14 }).map((_, i) => (
        <g key={i}>
          <rect x="32" y={31 + i * 14.2} width="65" height="13.5" rx="1.5" fill={`url(#${uid}-key)`} stroke="#b9aa8d" strokeWidth="0.65" />
          <path d={`M34 ${42 + i * 14.2}h61`} stroke="#c9b98d" strokeOpacity="0.55" strokeWidth="0.7" />
        </g>
      ))}
      {/* Duas e três teclas pretas por oitava, no sentido de baixo para cima. */}
      {Array.from({ length: 2 }).flatMap((_, octave) =>
        [0, 1, 3, 4, 5].map((step) => (
          <rect key={`${octave}-${step}`} x="32" y={31 + (octave * 7 + step) * 14.2 + 10} width="38" height="9" rx="1.5" fill="#171c27" stroke="#68717d" strokeWidth="0.65" />
        )),
      )}
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
        {Array.from({ length: N - 1 }).map((_, i) => (
          <path key={`rib-${i}`} d={`M${foleStart + (i + 1) * step} 27V235`} stroke="var(--color-gold)" strokeOpacity="0.22" strokeWidth="1.2" />
        ))}
      </g>
      {/* friso dourado nas quinas do fole junto aos corpos (fixo, não "respira") */}
      <rect x={foleStart - 4} y="20" width="8" height="224" rx="3" fill="var(--color-gold)" opacity="0.55" />
      <rect x={foleEnd - 4} y="20" width="8" height="224" rx="3" fill="var(--color-gold)" opacity="0.55" />

      {/* Corpo dos baixos (mão esquerda) */}
      <g filter={`url(#${uid}-shadow)`}>
        <rect x="382" y="14" width="128" height="252" rx="18" fill={`url(#${uid}-body)`} />
        <rect x="382" y="14" width="128" height="252" rx="18" fill={`url(#${uid}-sheen)`} />
      </g>
      <rect x="382" y="14" width="128" height="252" rx="18" fill="none" stroke="var(--color-gold)" strokeOpacity="0.5" strokeWidth="1.5" />
      <path className={animated ? 'accordion-glint' : undefined} d="M501 35v205" stroke="var(--color-gold)" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      {/* grelha decorativa em leque */}
      <g stroke="var(--color-gold)" strokeOpacity="0.35" strokeWidth="1.5" fill="none">
        {[-32, -16, 0, 16, 32].map((angle) => (
          <path key={angle} d={`M446,42 L${446 + 30 * Math.sin((angle * Math.PI) / 180)},${42 - 28 * Math.cos((angle * Math.PI) / 180)}`} />
        ))}
      </g>
      {Array.from({ length: 7 }).map((_, row) =>
        Array.from({ length: 4 }).map((_, col) => (
          <circle
            key={`${row}-${col}`}
            cx={400 + col * 24 + (row % 2) * 5}
            cy={79 + row * 25}
            r="6.5"
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
