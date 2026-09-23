import { Suspense, lazy, useRef, useState } from 'react'
import { useSettings } from '@/lib/useSettings'
import { updateSettings } from '@/lib/settingsRepo'
import { exportBackup, importBackup } from '@/lib/backup'

// Carregado sob demanda: o SDK do Supabase é pesado e só é necessário
// quando esta seção realmente aparece na tela (item 35, nuvem).
const AccountSection = lazy(() => import('@/components/AccountSection'))

export default function Settings() {
  const settings = useSettings()
  const backupInput = useRef<HTMLInputElement>(null)
  const [backupMessage, setBackupMessage] = useState('')

  async function handleImport(file?: File) {
    if (!file) return
    if (!window.confirm('Importar este backup mescla seus dados com os deste aparelho. Registros com o mesmo identificador serão substituídos pelos dados do arquivo; os demais permanecem. Continuar?')) return
    try {
      const count = await importBackup(file)
      setBackupMessage(`Backup importado. ${count} músicas foram adicionadas ou atualizadas; os demais dados também foram mesclados.`)
    } catch (error) {
      setBackupMessage(error instanceof Error ? error.message : 'Não foi possível importar este backup.')
    } finally {
      if (backupInput.current) backupInput.current.value = ''
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h2 className="text-xl font-semibold">Configurações</h2>

      <section className="mt-4 rounded-lg bg-surface p-4">
        <h3 className="text-sm font-semibold">Tema</h3>
        <div className="mt-2 flex gap-2">
          <button
            className={`tap-target flex-1 rounded-md border px-3 py-2 text-sm ${
              settings.theme === 'light' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 dark:border-slate-700'
            }`}
            onClick={() => updateSettings({ theme: 'light' })}
          >
            Claro
          </button>
          <button
            className={`tap-target flex-1 rounded-md border px-3 py-2 text-sm ${
              settings.theme === 'dark' ? 'border-slate-900 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'border-slate-300 dark:border-slate-700'
            }`}
            onClick={() => updateSettings({ theme: 'dark' })}
          >
            Escuro
          </button>
        </div>
      </section>

      <section className="mt-4 rounded-lg bg-surface p-4">
        <h3 className="text-sm font-semibold">Notação dos acordes</h3>
        <div className="mt-2 flex gap-2">
          <button
            className={`tap-target flex-1 rounded-md border px-3 py-2 text-sm ${
              settings.notation === 'international' ? 'border-slate-900 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'border-slate-300 dark:border-slate-700'
            }`}
            onClick={() => updateSettings({ notation: 'international' })}
          >
            Internacional (C D E F G A B)
          </button>
          <button
            className={`tap-target flex-1 rounded-md border px-3 py-2 text-sm ${
              settings.notation === 'brazilian' ? 'border-slate-900 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'border-slate-300 dark:border-slate-700'
            }`}
            onClick={() => updateSettings({ notation: 'brazilian' })}
          >
            Brasileira (Dó Ré Mi...)
          </button>
        </div>
      </section>

      <section className="mt-4 rounded-lg bg-surface p-4">
        <h3 className="text-sm font-semibold">Tamanho da letra e da cifra</h3>
        <label className="mt-2 flex items-center justify-between text-sm">
          Letra ({settings.fontSize}px)
          <input
            type="range"
            min={12}
            max={48}
            value={settings.fontSize}
            onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
            className="ml-3 flex-1"
          />
        </label>
        <label className="mt-2 flex items-center justify-between text-sm">
          Cifra ({settings.chordSize}px)
          <input
            type="range"
            min={12}
            max={48}
            value={settings.chordSize}
            onChange={(e) => updateSettings({ chordSize: Number(e.target.value) })}
            className="ml-3 flex-1"
          />
        </label>
      </section>

      <section className="mt-4 rounded-lg bg-surface p-4">
        <h3 className="text-sm font-semibold">Sanfona</h3>
        <div className="mt-2 flex gap-2">
          {(['80', '120'] as const).map((type) => (
            <button
              key={type}
              className={`tap-target flex-1 rounded-md border px-3 py-2 text-sm ${
                settings.accordionType === type ? 'border-slate-900 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'border-slate-300 dark:border-slate-700'
              }`}
              onClick={() => updateSettings({ accordionType: type })}
            >
              {type} baixos
            </button>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-lg bg-surface p-4">
        <h3 className="text-sm font-semibold">Backup do caderno</h3>
        <p className="mt-1 text-xs text-slate-500">Salve suas músicas e configurações em um arquivo ou importe um backup para mesclar os dados neste aparelho.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="tap-target rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700" onClick={() => void exportBackup()}>Exportar backup</button>
          <button className="tap-target rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700" onClick={() => backupInput.current?.click()}>Importar backup</button>
          <input ref={backupInput} type="file" accept="application/json,.json" className="sr-only" aria-label="Arquivo de backup JSON" onChange={(event) => void handleImport(event.target.files?.[0])} />
        </div>
        {backupMessage && <p role="status" className="mt-2 text-xs text-slate-500">{backupMessage}</p>}
      </section>

      <Suspense fallback={<p className="mt-4 text-xs text-slate-400">Carregando...</p>}>
        <AccountSection />
      </Suspense>
    </div>
  )
}
