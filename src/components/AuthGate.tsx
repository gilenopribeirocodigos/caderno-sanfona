import { useEffect, useState } from 'react'
import { isCloudEnabled } from '@/lib/supabaseClient'
import { signIn, signUp, useAuthUser } from '@/lib/auth'
import { startAutoSync } from '@/lib/sync'
import AccordionArt from './AccordionArt'
import SplashScreen from './SplashScreen'

type Mode = 'signin' | 'signup'

/**
 * Porta de entrada do app: exige login por e-mail antes de liberar o
 * Caderno de Sanfona (decisão do produto — cada músico tem sua própria
 * conta pessoal, sem administrador cadastrando terceiros). Depois do
 * primeiro login, a sessão fica salva no aparelho e o app volta a abrir
 * offline normalmente.
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthUser()

  // Sincroniza ao entrar, ao voltar para o app e periodicamente enquanto
  // ele está aberto. Assim uma música criada em um aparelho aparece no
  // outro sem precisar sair da conta ou apertar o botão manual.
  useEffect(() => {
    if (!user) return
    return startAutoSync(user.id)
  }, [user])

  // Nuvem não configurada (ex: rodando local sem as variáveis de
  // ambiente) — não trava o desenvolvimento, deixa passar direto.
  if (!isCloudEnabled) return <>{children}</>

  if (loading) return <SplashScreen />
  if (!user) return <LoginScreen />
  return <>{children}</>
}

function LoginScreen() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [signedUp, setSignedUp] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === 'signup') {
        await signUp(email, password)
        setSignedUp(true)
      } else {
        await signIn(email, password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="relative flex h-full w-full min-w-0 items-center justify-center overflow-x-hidden overflow-y-auto p-4"
      style={{
        background:
          'radial-gradient(120% 100% at 15% 0%, var(--color-brand) 0%, var(--color-brand-dark) 45%, #1a0710 100%)',
      }}
    >
      {/* Sanfonas ilustradas ao fundo, "aparecendo levemente" e respirando
          devagar nos dois cantos — dá movimento sem distrair do formulário */}
      <AccordionArt
        animated
        slow
        className="pointer-events-none absolute -bottom-16 -right-24 h-[34rem] w-auto rotate-[8deg] opacity-[0.16] mix-blend-luminosity sm:opacity-20"
      />
      <AccordionArt
        animated
        slow
        className="pointer-events-none absolute -top-20 -left-24 hidden h-[26rem] w-auto -rotate-[10deg] scale-x-[-1] opacity-[0.14] mix-blend-luminosity sm:block"
      />
      <div className="pointer-events-none absolute -bottom-10 -right-10 h-72 w-72 rounded-full bg-[var(--color-gold)] opacity-[0.12] blur-3xl" />
      <div className="pointer-events-none absolute -top-14 -left-10 hidden h-56 w-56 rounded-full bg-[var(--color-gold)] opacity-[0.1] blur-3xl sm:block" />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center">
        <div className="mb-6 flex flex-col items-center text-center">
          {/* Ilustração em destaque, com o fole "respirando" como se estivesse tocando */}
          <AccordionArt animated className="h-32 w-auto drop-shadow-2xl sm:h-36" />
          <h1 className="mt-3 text-2xl font-bold text-white">Caderno de Sanfona</h1>
          <p className="mt-1 text-sm text-white/70">
            Seu caderno pessoal de letras, cifras e repertórios
          </p>
        </div>

        <div className="w-full rounded-2xl border border-white/20 bg-surface p-5 shadow-2xl">
          {signedUp ? (
            <div className="text-center">
              <p className="text-sm">
                Quase lá! Enviamos um e-mail de confirmação para <strong>{email}</strong>.
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Clique no link do e-mail e depois volte aqui para entrar.
              </p>
              <button
                className="tap-target mt-4 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700"
                onClick={() => {
                  setSignedUp(false)
                  setMode('signin')
                }}
              >
                Já confirmei, entrar
              </button>
            </div>
          ) : (
            <>
              <div className="mb-3 flex gap-2 text-xs">
                <button
                  type="button"
                  className={`flex-1 rounded-md border px-2 py-1.5 ${mode === 'signin' ? 'border-[var(--color-brand)] bg-[var(--color-brand)] text-white' : 'border-slate-300 dark:border-slate-700'}`}
                  onClick={() => setMode('signin')}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  className={`flex-1 rounded-md border px-2 py-1.5 ${mode === 'signup' ? 'border-[var(--color-brand)] bg-[var(--color-brand)] text-white' : 'border-slate-300 dark:border-slate-700'}`}
                  onClick={() => setMode('signup')}
                >
                  Criar conta
                </button>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                <label htmlFor="login-email" className="sr-only">E-mail</label>
                <input
                  id="login-email"
                  type="email"
                  required
                  placeholder="E-mail"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="tap-target rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
                <div className="relative">
                  <label htmlFor="login-password" className="sr-only">Senha</label>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Senha (mínimo 6 caracteres)"
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="tap-target w-full rounded-md border border-slate-300 px-3 py-2 pr-10 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M2 10s3-5.5 8-5.5S18 10 18 10s-3 5.5-8 5.5S2 10 2 10z" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="10" cy="10" r="2.25" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M2 10s3-5.5 8-5.5S18 10 18 10s-3 5.5-8 5.5S2 10 2 10z" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="10" cy="10" r="2.25" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M3 3l14 14" strokeLinecap="round" />
                      </svg>
                    )}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="tap-target rounded-md bg-[var(--color-brand)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {busy ? 'Aguarde...' : mode === 'signup' ? 'Criar conta' : 'Entrar'}
                </button>
              </form>
              {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
            </>
          )}
        </div>

        <p className="mt-5 text-[10px] text-white/40">versão {__APP_VERSION__}</p>
      </div>
    </div>
  )
}
