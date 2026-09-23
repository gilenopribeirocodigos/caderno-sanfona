import { useEffect, useState } from 'react'
import { isCloudEnabled } from '@/lib/supabaseClient'
import { useAuthUser } from '@/lib/auth'
import { syncNow } from '@/lib/sync'

function conflictNotice(count: number) {
  return `${count} música${count === 1 ? '' : 's'} tinha${count === 1 ? '' : 'm'} outra versão em outro aparelho. A cópia anterior foi salva no histórico da música.`
}

/**
 * Conta e sincronização (item 35) — login é feito na entrada do app, e
 * "sair" fica no menu de conta no topo da tela (não aqui).
 */
export default function AccountSection() {
  const { user } = useAuthUser()
  const [error, setError] = useState<string | null>(() => localStorage.getItem('lastSyncError'))
  const [conflictMessage, setConflictMessage] = useState<string | null>(() => {
    const count = Number(localStorage.getItem('lastSyncConflictCount'))
    if (!count) return null
    localStorage.removeItem('lastSyncConflictCount')
    return conflictNotice(count)
  })
  const [busy, setBusy] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(() => localStorage.getItem('lastSync'))

  useEffect(() => {
    const onError = (event: Event) => setError((event as CustomEvent<string>).detail)
    const onSuccess = (event: Event) => {
      setError(null)
      setLastSync((event as CustomEvent<string>).detail)
    }
    const onConflict = (event: Event) => {
      const count = (event as CustomEvent<{ count: number }>).detail.count
      localStorage.removeItem('lastSyncConflictCount')
      setConflictMessage(conflictNotice(count))
    }
    window.addEventListener('caderno-sync-error', onError)
    window.addEventListener('caderno-sync-success', onSuccess)
    window.addEventListener('caderno-sync-conflict', onConflict)
    return () => {
      window.removeEventListener('caderno-sync-error', onError)
      window.removeEventListener('caderno-sync-success', onSuccess)
      window.removeEventListener('caderno-sync-conflict', onConflict)
    }
  }, [])

  if (!isCloudEnabled || !user) {
    return (
      <section className="mt-4 rounded-lg bg-surface p-4">
        <h3 className="text-sm font-semibold">Conta e sincronização</h3>
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
      <h3 className="text-sm font-semibold">Conta e sincronização</h3>
      <div className="mt-2 flex flex-col gap-2">
        <p className="text-sm">
          Logado como <strong>{user.email}</strong>
        </p>
        {lastSync && <p className="text-xs text-slate-500">Última sincronização: {lastSync}</p>}
        <button
          disabled={busy}
          onClick={handleSync}
          className="tap-target self-start rounded-md bg-[var(--color-brand)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? 'Sincronizando...' : 'Sincronizar agora'}
        </button>
        <p className="text-xs text-slate-500">
          O app já sincroniza sozinho sempre que você abre ele logado —
          esse botão é só para forçar uma atualização na hora (por
          exemplo, se você acabou de mudar algo no outro aparelho e quer
          ver aqui sem precisar sair e abrir de novo). Se houver versões
          diferentes da mesma música, a versão substituída fica preservada
          no histórico da música.
        </p>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      {conflictMessage && <p role="status" className="mt-2 rounded-md bg-amber-50 p-2 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-100">{conflictMessage}</p>}
    </section>
  )
}
