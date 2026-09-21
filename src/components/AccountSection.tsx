import { useState } from 'react'
import { isCloudEnabled } from '@/lib/supabaseClient'
import { signOut, useAuthUser } from '@/lib/auth'
import { syncNow } from '@/lib/sync'

/** Conta e sincronização (item 35) — login já é feito na entrada do app. */
export default function AccountSection() {
  const { user } = useAuthUser()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(() => localStorage.getItem('lastSync'))

  if (!isCloudEnabled || !user) {
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
      <div className="mt-2 flex flex-col gap-2">
        <p className="text-sm">
          Logado como <strong>{user.email}</strong>
        </p>
        {lastSync && <p className="text-xs text-slate-500">Última sincronização: {lastSync}</p>}
        <div className="flex gap-2">
          <button
            disabled={busy}
            onClick={handleSync}
            className="tap-target rounded-md bg-[var(--color-brand)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
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
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </section>
  )
}
