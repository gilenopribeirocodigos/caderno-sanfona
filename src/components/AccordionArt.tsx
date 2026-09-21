/**
 * Ilustração decorativa de uma sanfona, em SVG próprio (sem depender de
 * fotos externas): teclado à esquerda, fole ao centro, baixos à direita —
 * usada na tela de login e como marca d'água na navegação.
 */
export default function AccordionArt({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 220" className={className} role="presentation" aria-hidden="true">
      {/* Corpo do teclado (mão direita) */}
      <rect x="10" y="30" width="70" height="160" rx="10" fill="var(--color-brand-dark)" />
      <rect x="22" y="46" width="46" height="128" rx="4" fill="#f8f1e5" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <line key={i} x1="22" y1={46 + i * 18.3} x2="68" y2={46 + i * 18.3} stroke="#d8cba9" strokeWidth="1.5" />
      ))}

      {/* Fole (parte central sanfonada) */}
      {Array.from({ length: 11 }).map((_, i) => (
        <polygon
          key={i}
          points={`${90 + i * 20},40 ${100 + i * 20},30 ${110 + i * 20},40 ${110 + i * 20},180 ${100 + i * 20},190 ${90 + i * 20},180`}
          fill={i % 2 === 0 ? 'var(--color-brand)' : 'var(--color-brand-light)'}
          stroke="var(--color-brand-dark)"
          strokeWidth="1"
        />
      ))}

      {/* Corpo dos baixos (mão esquerda) */}
      <rect x="310" y="20" width="80" height="180" rx="10" fill="var(--color-brand-dark)" />
      {Array.from({ length: 5 }).map((_, row) =>
        Array.from({ length: 3 }).map((_, col) => (
          <circle
            key={`${row}-${col}`}
            cx={330 + col * 18 + row * 3}
            cy={42 + row * 32}
            r="7"
            fill="#f8f1e5"
            stroke="var(--color-gold)"
            strokeWidth="1"
          />
        )),
      )}
    </svg>
  )
}
