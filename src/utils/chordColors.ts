// Paleta de cores distintas para diferenciar visualmente cada acorde da
// música no Modo Sanfona Visual (item "cada acorde numa cor diferente").
// Classes escritas por extenso (não interpoladas) para o Tailwind conseguir
// incluí-las no build.
export interface ChordColor {
  solid: string // preenchido, usado no acorde ativo
  tint: string // contorno + fundo leve, usado nos demais acordes da música
  hex: string // cor sólida em hex, para uso em SVG (teclado)
  hexSoft: string // versão clara da cor, para o fundo "usado" no teclado
  label: string
}

export const CHORD_PALETTE: ChordColor[] = [
  {
    solid: 'border-blue-600 bg-blue-600 text-white',
    tint: 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    hex: '#2563eb',
    hexSoft: '#dbeafe',
    label: 'text-blue-600 dark:text-blue-400',
  },
  {
    solid: 'border-emerald-600 bg-emerald-600 text-white',
    tint: 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    hex: '#059669',
    hexSoft: '#d1fae5',
    label: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    solid: 'border-purple-600 bg-purple-600 text-white',
    tint: 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
    hex: '#9333ea',
    hexSoft: '#ede9fe',
    label: 'text-purple-600 dark:text-purple-400',
  },
  {
    solid: 'border-rose-600 bg-rose-600 text-white',
    tint: 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
    hex: '#e11d48',
    hexSoft: '#ffe4e6',
    label: 'text-rose-600 dark:text-rose-400',
  },
  {
    solid: 'border-amber-500 bg-amber-500 text-white',
    tint: 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    hex: '#d97706',
    hexSoft: '#fef3c7',
    label: 'text-amber-600 dark:text-amber-400',
  },
  {
    solid: 'border-cyan-600 bg-cyan-600 text-white',
    tint: 'border-cyan-500 bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
    hex: '#0891b2',
    hexSoft: '#cffafe',
    label: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    solid: 'border-fuchsia-600 bg-fuchsia-600 text-white',
    tint: 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300',
    hex: '#c026d3',
    hexSoft: '#fae8ff',
    label: 'text-fuchsia-600 dark:text-fuchsia-400',
  },
  {
    solid: 'border-orange-600 bg-orange-600 text-white',
    tint: 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
    hex: '#ea580c',
    hexSoft: '#ffedd5',
    label: 'text-orange-600 dark:text-orange-400',
  },
]

/** Mapa estável acorde → cor, na ordem em que os acordes aparecem na música. */
export function colorMapForChords(chords: string[]): Map<string, ChordColor> {
  const map = new Map<string, ChordColor>()
  chords.forEach((chord, i) => {
    map.set(chord, CHORD_PALETTE[i % CHORD_PALETTE.length])
  })
  return map
}
