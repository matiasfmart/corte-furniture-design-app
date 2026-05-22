/**
 * DimensionLabel.jsx — Cotas externas y labels de columna
 * Posicionadas en la zona reservada debajo de los módulos (ZONE.labelHeight).
 * Textos con fontSize fijo. Posiciones en px.
 */
import { theme } from '../../styles/theme'

const COL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

/**
 * ExternalDimensions — renders all cotas and column labels
 */
export function ExternalDimensions({ layout, originX, originY, scale, selectedModuleId, modulePositions, zone }) {
  const { cols, colWidths, colX, maxHeight } = layout
  const furnitureH = maxHeight * scale

  // Width labels: below the furniture, with enough offset to clear add buttons
  const labelY = originY + furnitureH + (zone?.buttonOffset || 24) + (zone?.buttonRadius || 14) + 20

  return (
    <g className="pointer-events-none">
      {/* Column widths — yellow, in meters */}
      {cols.map((col, i) => {
        const cx1 = originX + colX[col] * scale
        const cx2 = cx1 + colWidths[col] * scale
        const centerX = (cx1 + cx2) / 2
        return (
          <text
            key={`cw-${col}`}
            x={centerX}
            y={labelY}
            textAnchor="middle"
            fontSize={12}
            fontFamily="monospace"
            fontWeight="500"
            fill={theme.accent.yellow}
          >
            {(colWidths[col] / 1000).toFixed(2)} m
          </text>
        )
      })}

      {/* Column labels A, B, C... */}
      {cols.map((col, i) => {
        const cx1 = originX + colX[col] * scale
        const cx2 = cx1 + colWidths[col] * scale
        const centerX = (cx1 + cx2) / 2
        return (
          <g key={`label-${col}`}>
            <circle
              cx={centerX}
              cy={labelY + 20}
              r={10}
              fill={theme.bg.elevated}
              stroke={theme.bg.border}
              strokeWidth={1}
            />
            <text
              x={centerX}
              y={labelY + 20}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={9}
              fill={theme.text.secondary}
            >
              {COL_LETTERS[i] || i}
            </text>
          </g>
        )
      })}

      {/* Module heights — CAD-style cotas in dedicated right zone */}
      {(() => {
        // Fixed X zone: always to the right of the entire furniture, never overlapping
        const furnitureRight = originX + layout.totalWidth * scale
        const cotaZoneStart = furnitureRight + 54  // button(22) + radius(10) + same gap(22)

        // Group by column for staggering
        const colGroups = {}
        modulePositions.forEach((mp) => {
          const col = mp.module.col
          if (!colGroups[col]) colGroups[col] = []
          colGroups[col].push(mp)
        })
        const allCols = Object.keys(colGroups).sort((a, b) => a - b)

        return modulePositions.map(({ module: mod, mmX, mmW, mmY, mmH }) => {
          const modY = originY + (maxHeight - mmY - mmH) * scale
          const modH = mmH * scale
          const modTop = modY
          const modBottom = modY + modH
          const centerY = modY + modH / 2

          // Stagger by column index so cotas don't overlap
          const colIdx = allCols.indexOf(String(mod.col))
          const textX = cotaZoneStart + colIdx * 30
          const lineX = textX - 6

          return (
            <g key={`mh-${mod.id}`}>
              {/* Vertical dimension line */}
              <line x1={lineX} y1={modTop + 2} x2={lineX} y2={modBottom - 2}
                stroke={theme.accent.yellow} strokeWidth={0.8} opacity={0.6} />
              {/* Top tick */}
              <line x1={lineX - 3} y1={modTop + 2} x2={lineX + 3} y2={modTop + 2}
                stroke={theme.accent.yellow} strokeWidth={0.8} opacity={0.6} />
              {/* Bottom tick */}
              <line x1={lineX - 3} y1={modBottom - 2} x2={lineX + 3} y2={modBottom - 2}
                stroke={theme.accent.yellow} strokeWidth={0.8} opacity={0.6} />
              {/* Dimension text */}
              <text
                x={textX}
                y={centerY}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={11}
                fontFamily="monospace"
                fontWeight="500"
                fill={theme.accent.yellow}
                transform={`rotate(-90, ${textX}, ${centerY})`}
              >
                {(mod.height / 1000).toFixed(2)} m
              </text>
            </g>
          )
        })
      })()}
    </g>
  )
}
