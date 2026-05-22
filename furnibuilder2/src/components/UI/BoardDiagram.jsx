/**
 * SVG diagram showing piece placement on a standard board.
 * Renders at a fixed aspect ratio matching the standard board (1830×2440).
 */

const STANDARD_BOARD = { w: 1830, h: 2440 }
const COLORS = [
  '#7cb3e0', '#7dd4a0', '#e0a07c', '#c4a0e0',
  '#e0d07c', '#7ce0c4', '#e07c9a', '#a0c4e0',
]

export default function BoardDiagram({ board }) {
  const { w, h } = STANDARD_BOARD
  const viewW = 280
  const viewH = viewW * (h / w)
  const scale = viewW / w

  return (
    <svg
      width={viewW}
      height={viewH}
      viewBox={`0 0 ${viewW} ${viewH}`}
      className="rounded bg-bg-base border border-bg-border"
    >
      {/* Board background */}
      <rect width={viewW} height={viewH} fill="#1a1a20" />

      {/* Placed pieces */}
      {board.pieces.map((p, i) => {
        const pieceW = p.rotated ? p.cutItem.cutH : p.cutItem.cutW
        const pieceH = p.rotated ? p.cutItem.cutW : p.cutItem.cutH
        const x = p.x * scale
        const y = p.y * scale
        const pw = pieceW * scale
        const ph = pieceH * scale
        const color = COLORS[i % COLORS.length]

        return (
          <g key={i}>
            <rect
              x={x + 0.5}
              y={y + 0.5}
              width={Math.max(pw - 1, 1)}
              height={Math.max(ph - 1, 1)}
              fill={color}
              fillOpacity={0.3}
              stroke={color}
              strokeWidth={0.5}
            />
            {pw > 20 && ph > 10 && (
              <text
                x={x + pw / 2}
                y={y + ph / 2 + 3}
                textAnchor="middle"
                className="fill-text-secondary"
                fontSize={7}
              >
                {p.cutItem.label?.slice(0, 8)}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
