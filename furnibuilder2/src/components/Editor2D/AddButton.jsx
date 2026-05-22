/**
 * AddButton.jsx — Botón + en los bordes externos
 * Círculo naranja Gruvbox con + oscuro, visible solo al hacer hover sobre el editor.
 */
import { theme } from '../../styles/theme'

export default function AddButton({ x, y, placement, referenceId, onAdd, visible }) {
  return (
    <g
      className="cursor-pointer"
      style={{ transition: 'opacity 150ms ease' }}
      opacity={visible ? 1 : 0}
      onClick={(e) => {
        e.stopPropagation()
        onAdd(placement, referenceId)
      }}
    >
      <circle
        cx={x}
        cy={y}
        r={10}
        fill={theme.accent.orange}
      />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={15}
        fontWeight="400"
        fill={theme.bg.hard}
        style={{ userSelect: 'none' }}
        className="pointer-events-none"
      >
        +
      </text>
    </g>
  )
}
