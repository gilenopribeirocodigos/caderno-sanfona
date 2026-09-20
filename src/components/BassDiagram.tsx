import type { AccordionType } from '@/types'
import { chordLabelForRow, columnsFor, getHighlightedButtons, rowsFor } from '@/utils/accordion'

interface BassDiagramProps {
  accordionType: AccordionType
  activeChord?: string
}

const COL_SPACING = 46
const ROW_SPACING = 42
const ROW_SHIFT = 14 // desloca cada linha para criar o visual diagonal/escalonado (item 1148)
const RADIUS = 17

/**
 * Mapa visual dos baixos da mão esquerda (itens 55-67): botões circulares
 * em fileiras diagonais, como num mapa real de sanfona (Stradella),
 * destacando o baixo fundamental e o acorde correspondente.
 */
export default function BassDiagram({ accordionType, activeChord }: BassDiagramProps) {
  const columns = columnsFor(accordionType)
  const rows = rowsFor(accordionType)
  const highlights = getHighlightedButtons(activeChord, accordionType)

  const width = columns.length * COL_SPACING + rows.length * ROW_SHIFT + RADIUS * 2
  const height = rows.length * ROW_SPACING + RADIUS * 2

  function highlightFor(row: number, col: number) {
    return highlights.find((h) => h.row === row && h.col === col)
  }

  return (
    <div className="overflow-x-auto">
      <svg width={width} height={height} role="img" aria-label="Mapa dos baixos da sanfona">
        {rows.map((rowName, row) =>
          columns.map((note, col) => {
            const cx = col * COL_SPACING + row * ROW_SHIFT + RADIUS
            const cy = row * ROW_SPACING + RADIUS
            const hit = highlightFor(row, col)
            const fill = hit?.kind === 'bass' ? '#2563eb' : hit?.kind === 'chord' ? '#f59e0b' : 'none'
            const textColor = hit ? '#fff' : 'currentColor'
            const label = rowName === 'Baixo' || rowName === 'Contra' ? note : chordLabelForRow(note, rowName)
            return (
              <g key={`${row}-${col}`}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={RADIUS}
                  fill={fill}
                  stroke="currentColor"
                  strokeOpacity={0.3}
                  className="text-slate-400"
                />
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={9}
                  fill={textColor}
                  className={hit ? '' : 'fill-slate-600 dark:fill-slate-300'}
                >
                  {label}
                </text>
              </g>
            )
          }),
        )}
        {rows.map((rowName, row) => (
          <text
            key={rowName}
            x={columns.length * COL_SPACING + row * ROW_SHIFT + RADIUS * 2 + 4}
            y={row * ROW_SPACING + RADIUS}
            fontSize={9}
            dominantBaseline="central"
            className="fill-slate-400"
          >
            {rowName}
          </text>
        ))}
      </svg>
    </div>
  )
}
