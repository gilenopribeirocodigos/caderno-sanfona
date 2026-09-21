import { useState } from 'react'
import { isCloudEnabled } from '@/lib/supabaseClient'
import { signIn, signUp, useAuthUser } from '@/lib/auth'
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
      className="relative flex h-full items-center justify-center overflow-y-auto p-4"
      style={{
        background:
          'radial-gradient(120% 100% at 15% 0%, var(--color-brand) 0%, var(--color-brand-dark) 45%, #1a0710 100%)',
      }}
    >
      {/* Sanfona ilustrada ao fundo, "aparecendo levemente" atrás do cartão de login */}
      <AccordionArt className="pointer-events-none absolute -bottom-16 -right-24 h-[34rem] w-auto rotate-[8deg] opacity-[0.16] mix-blend-luminosity sm:opacity-20" />
      <div className="pointer-events-none absolute -bottom-10 -right-10 h-72 w-72 rounded-full bg-[var(--color-gold)] opacity-[0.12] blur-3xl" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <AccordionArt className="h-24 w-auto drop-shadow-lg" />
          <h1 className="mt-3 text-2xl font-bold text-white">Caderno de Sanfona</h1>
          <p className="mt-1 text-sm text-white/70">
            Seu caderno pessoal de letras, cifras e repertórios
          </p>
        </div>

        <div className="rounded-xl bg-surface p-5 shadow-2xl">
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
                <input
                  type="email"
                  required
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="tap-target rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Senha (mínimo 6 caracteres)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="tap-target rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
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
      </div>
    </div>
  )
}
