import { useState } from 'react'
import { signOut, useAuthUser } from '@/lib/auth'

/**
 * Menu de conta no topo do app (item 35): mostra quem está logado e
 * concentra a saída da conta em um só lugar, como em sites profissionais
 * — em vez de misturado com as demais configurações.
 */
export default function AccountMenu() {
  const { user } = useAuthUser()
  const [open, setOpen] = useState(false)

  if (!user) return null
  const initial = (user.email ?? '?').charAt(0).toUpperCase()

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="tap-target flex items-center gap-1.5 rounded-full bg-white/10 pl-1 pr-2 text-sm font-medium text-white hover:bg-white/20"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-gold)] text-xs font-bold text-[var(--color-brand-dark)]">
          {initial}
        </span>
        <svg viewBox="0 0 20 20" className={`h-3.5 w-3.5 fill-current transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M5.5 7.5l4.5 4.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <>
          {/* área invisível para fechar o menu ao clicar fora */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            role="menu"
            className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-lg bg-surface text-slate-900 shadow-xl dark:text-slate-100"
          >
            <p className="truncate border-b border-slate-200 px-3 py-2 text-xs text-slate-500 dark:border-slate-700">
              {user.email}
            </p>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                signOut()
              }}
              className="tap-target w-full px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-surface-alt"
            >
              Sair da conta
            </button>
          </div>
        </>
      )}
    </div>
  )
}
