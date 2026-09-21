import { useState } from 'react'
import { isCloudEnabled } from '@/lib/supabaseClient'
import { signIn, signOut, signUp, useAuthUser } from '@/lib/auth'
import { syncNow } from '@/lib/sync'

type Mode = 'signin' | 'signup'

/** Conta e sincronização (Etapa 11, item 35): login e backup na nuvem. */
export default function AccountSection() {
  const { user, loading } = useAuthUser()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(() => localStorage.getItem('lastSync'))

  if (!isCloudEnabled) {
    return (
      <section className="mt-4 rounded-lg bg-surface p-4">
        <h3 className="text-sm font-semibold">Conta e sincronização (item 35)</h3>
        <p className="mt-1 text-xs text-slate-500">
          Ainda não configurado neste app. O Caderno de Sanfona continua
          funcionando 100% offline, salvo neste aparelho.
        </p>
      </section>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === 'signup') await signUp(email, password)
      else await signIn(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar')
    } finally {
      setBusy(false)
    }
  }

  async function handleSync() {
    if (!user) return
    setError(null)
    setBusy(true)
    try {
      await syncNow(user.id)
      const now = new Date().toLocaleString('pt-BR')
      localStorage.setItem('lastSync', now)
      setLastSync(now)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao sincronizar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mt-4 rounded-lg bg-surface p-4">
      <h3 className="text-sm font-semibold">Conta e sincronização (item 35)</h3>

      {loading ? (
        <p className="mt-2 text-xs text-slate-500">Carregando...</p>
      ) : user ? (
        <div className="mt-2 flex flex-col gap-2">
          <p className="text-sm">
            Logado como <strong>{user.email}</strong>
          </p>
          {lastSync && <p className="text-xs text-slate-500">Última sincronização: {lastSync}</p>}
          <div className="flex gap-2">
            <button
              disabled={busy}
              onClick={handleSync}
              className="tap-target rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
            >
              {busy ? 'Sincronizando...' : 'Sincronizar agora'}
            </button>
            <button
              onClick={() => signOut()}
              className="tap-target rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700"
            >
              Sair
            </button>
          </div>
          <p className="text-[10px] text-slate-400">
            Envia o que você editou aqui para a nuvem e traz de volta o que
            estiver lá (inclusive de outro aparelho). Se a mesma música foi
            editada em dois aparelhos desde a última sincronização, vale a
            versão de quem sincronizar por último.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2">
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              className={`rounded-md border px-2 py-1 ${mode === 'signin' ? 'border-slate-900 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'border-slate-300 dark:border-slate-700'}`}
              onClick={() => setMode('signin')}
            >
              Entrar
            </button>
            <button
              type="button"
              className={`rounded-md border px-2 py-1 ${mode === 'signup' ? 'border-slate-900 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'border-slate-300 dark:border-slate-700'}`}
              onClick={() => setMode('signup')}
            >
              Criar conta
            </button>
          </div>
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
            className="tap-target rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
          >
            {busy ? 'Aguarde...' : mode === 'signup' ? 'Criar conta' : 'Entrar'}
          </button>
        </form>
      )}

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </section>
  )
}
