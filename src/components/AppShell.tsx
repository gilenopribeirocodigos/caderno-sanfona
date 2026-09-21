import { NavLink, Outlet } from 'react-router-dom'
import AccordionArt from './AccordionArt'

const NAV_ITEMS = [
  { to: '/', label: 'Biblioteca', end: true },
  { to: '/cadernos', label: 'Cadernos' },
  { to: '/editor/novo', label: 'Editor' },
  { to: '/tocar', label: 'Tocar' },
  { to: '/config', label: 'Config' },
]

/**
 * Casca responsiva do app (seção 3): navegação lateral em telas largas
 * (tablet/desktop) e barra inferior em telas estreitas (celular), já que
 * o sanfoneiro segura o aparelho com pouca liberdade de toque.
 */
export default function AppShell() {
  return (
    <div className="flex h-full flex-col md:flex-row">
      <aside className="safe-top relative hidden shrink-0 overflow-hidden border-r border-slate-200 bg-surface px-3 py-4 dark:border-slate-800 md:flex md:w-56 md:flex-col md:gap-1">
        {/* Marca d'água decorativa, presença sutil da sanfona dentro do app */}
        <AccordionArt className="pointer-events-none absolute -bottom-10 -left-16 h-64 w-auto -rotate-6 opacity-[0.05] dark:opacity-[0.08]" />
        <div className="relative mb-4 flex items-center gap-2 px-2">
          <AccordionArt className="h-7 w-auto shrink-0" />
          <h1 className="text-base font-semibold leading-tight">Caderno de Sanfona</h1>
        </div>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `tap-target relative flex items-center rounded-lg px-3 py-2 text-sm font-medium ${
                isActive
                  ? 'bg-[var(--color-brand)] text-white'
                  : 'text-slate-600 hover:bg-surface-alt dark:text-slate-300'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
        <VersionTag className="relative mt-auto px-2 pt-4" />
      </aside>

      <main className="flex-1 overflow-y-auto bg-surface-alt">
        <Outlet />
      </main>

      <nav className="safe-bottom flex shrink-0 flex-col border-t border-slate-200 bg-surface dark:border-slate-800 md:hidden">
        <div className="flex gap-1 px-1 pt-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `tap-target flex flex-1 flex-col items-center justify-center rounded-lg py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[var(--color-brand)] text-white'
                    : 'text-slate-500 dark:text-slate-400'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
        <VersionTag className="pb-1 text-center" />
      </nav>
    </div>
  )
}

function VersionTag({ className = '' }: { className?: string }) {
  const buildDate = new Date(__BUILD_TIME__)
  const formatted = buildDate.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
  return (
    <p className={`text-[10px] text-slate-400 ${className}`}>
      versão {__APP_VERSION__} · {formatted}
    </p>
  )
}
