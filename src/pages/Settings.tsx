import { useSettings } from '@/lib/useSettings'
import { updateSettings } from '@/lib/settingsRepo'

export default function Settings() {
  const settings = useSettings()

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h2 className="text-xl font-semibold">Configurações</h2>

      <section className="mt-4 rounded-lg bg-surface p-4">
        <h3 className="text-sm font-semibold">Tema (item 33)</h3>
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
        <h3 className="text-sm font-semibold">Notação dos acordes (item 8)</h3>
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
        <h3 className="text-sm font-semibold">Tamanho da letra e da cifra (item 19)</h3>
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
        <h3 className="text-sm font-semibold">Sanfona (item 14, 56-57)</h3>
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
    </div>
  )
}
