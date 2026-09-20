import { useState } from 'react'
import type { Song } from '@/types'
import { COMMON_ROOTS } from '@/utils/chords'

export interface SongFormValues {
  title: string
  artist: string
  originalKey: string
  rhythm: string
  difficulty: Song['difficulty'] | ''
  tagsText: string
  notes: string
}

const RHYTHMS = ['Baião', 'Forró', 'Xote', 'Xaxado', 'Arrasta-pé', 'Vaneira', 'Outro']

export function emptySongForm(): SongFormValues {
  return {
    title: '',
    artist: '',
    originalKey: 'C',
    rhythm: '',
    difficulty: '',
    tagsText: '',
    notes: '',
  }
}

export function songToFormValues(song: Song): SongFormValues {
  return {
    title: song.title,
    artist: song.artist ?? '',
    originalKey: song.originalKey,
    rhythm: song.rhythm ?? '',
    difficulty: song.difficulty ?? '',
    tagsText: song.tags.join(', '),
    notes: song.notes ?? '',
  }
}

interface SongFormProps {
  initial: SongFormValues
  submitLabel: string
  onCancel?: () => void
  onSubmit: (values: SongFormValues) => void
}

const inputClass =
  'tap-target rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800'

export default function SongForm({ initial, submitLabel, onCancel, onSubmit }: SongFormProps) {
  const [values, setValues] = useState(initial)

  function set<K extends keyof SongFormValues>(key: K, value: SongFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!values.title.trim()) return
        onSubmit(values)
      }}
      className="flex flex-col gap-2 rounded-lg bg-surface p-3"
    >
      <input
        className={inputClass}
        placeholder="Título da música"
        value={values.title}
        onChange={(e) => set('title', e.target.value)}
      />
      <div className="flex gap-2">
        <input
          className={`${inputClass} flex-1`}
          placeholder="Artista (opcional)"
          value={values.artist}
          onChange={(e) => set('artist', e.target.value)}
        />
        <select
          className={`${inputClass} w-24`}
          value={values.originalKey}
          onChange={(e) => set('originalKey', e.target.value)}
        >
          {COMMON_ROOTS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <select
          className={`${inputClass} flex-1`}
          value={values.rhythm}
          onChange={(e) => set('rhythm', e.target.value)}
        >
          <option value="">Ritmo (opcional)</option>
          {RHYTHMS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          className={`${inputClass} flex-1`}
          value={values.difficulty}
          onChange={(e) => set('difficulty', e.target.value as SongFormValues['difficulty'])}
        >
          <option value="">Dificuldade (opcional)</option>
          <option value="facil">Fácil</option>
          <option value="medio">Médio</option>
          <option value="dificil">Difícil</option>
        </select>
      </div>
      <input
        className={inputClass}
        placeholder="Tags, separadas por vírgula (ex: forró, aula, sábado)"
        value={values.tagsText}
        onChange={(e) => set('tagsText', e.target.value)}
      />
      <textarea
        className={`${inputClass} min-h-16`}
        placeholder="Observações pessoais (opcional)"
        value={values.notes}
        onChange={(e) => set('notes', e.target.value)}
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="tap-target flex-1 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900"
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="tap-target rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
