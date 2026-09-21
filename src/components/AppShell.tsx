import { Suspense, lazy } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import AccordionArt from './AccordionArt'

// Carregado sob demanda: depende do SDK do Supabase, só baixado quando a
// barra superior realmente precisa mostrar o menu de conta.
const AccountMenu = lazy(() => import('./AccountMenu'))

const NAV_ITEMS = [
  { to: '/', label: 'Biblioteca', end: true, match: /^\/$/ },
  { to: '/cadernos', label: 'Cadernos', end: false, match: /^\/cadernos/ },
  { to: '/editor/novo', label: 'Editor', end: false, match: /^\/editor/ },
  { to: '/tocar', label: 'Tocar', end: false, match: /^\/tocar/ },
  { to: '/config', label: 'Config', end: false, match: /^\/config/ },
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

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar />
        <div className="relative isolate flex-1 overflow-y-auto bg-surface-alt">
          {/* Sanfona ao fundo do conteúdo — presença contínua da marca em
              toda tela, não só no topo/login. Estática (sem animação nem
              sombra) de propósito: fica sempre montada enquanto o app está
              aberto, e isso pesava demais em celulares mais fracos. */}
          <AccordionArt
            flat
            className="pointer-events-none absolute -bottom-10 -right-14 -z-10 h-96 w-auto rotate-[8deg] opacity-[0.07] dark:opacity-[0.14]"
          />
          <Outlet />
        </div>
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

/**
 * Barra superior com a identidade visual da sanfona presente em todas as
 * telas (não só na entrada) e o menu de conta/sair, no padrão de sites
 * profissionais (em vez de "Sair" perdido dentro de Configurações).
 */
function TopBar() {
  const location = useLocation()
  const current = NAV_ITEMS.find((item) => item.match.test(location.pathname))

  return (
    <header className="safe-top relative flex shrink-0 items-center justify-between gap-3 bg-gradient-to-r from-[var(--color-brand-dark)] via-[var(--color-brand)] to-[var(--color-brand-dark)] px-4 py-2.5 text-white">
      {/* Recorte próprio para a marca d'água não vazar, sem cortar o menu de conta abaixo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <AccordionArt flat className="absolute -top-10 right-6 h-24 w-auto rotate-[15deg] opacity-20" />
      </div>
      <span className="relative truncate text-sm font-semibold tracking-wide">
        {current?.label ?? 'Caderno de Sanfona'}
      </span>
      <div className="relative shrink-0">
        <Suspense fallback={<div className="h-8 w-8" />}>
          <AccountMenu />
        </Suspense>
      </div>
    </header>
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
