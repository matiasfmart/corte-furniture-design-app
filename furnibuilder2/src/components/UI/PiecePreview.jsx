/**
 * PiecePreview.jsx — Panel derecho que muestra las piezas de corte en 2D (SVG con cotas)
 */
import { theme } from '../../styles/theme'

/** Format dimension: show integer if whole, otherwise 1 decimal */
const fmt = (n) => Number.isInteger(n) ? n : Math.round(n * 10) / 10

const PIECE_COLORS = {
  'Lateral izquierdo': '#4a88c8',
  'Lateral derecho': '#4a88c8',
  'Tapa superior': '#3ab890',
  'Base': '#3ab890',
  'Estante': '#6a9cbd',
  'Puerta izquierda': '#e8a020',
  'Puerta derecha': '#e8a020',
  'Puerta abatible': '#e8a020',
  'Frente de cajón': '#e8a020',
  'Cuerpo de cajón': '#6a9cbd',
  'Fondo (HDF)': '#2a5a8a',
}

function getColor(label) {
  for (const [key, color] of Object.entries(PIECE_COLORS)) {
    if (label.startsWith(key)) return color
  }
  return '#7cb3e0'
}

/** 2D SVG piece with dimensions */
function Piece2D({ cut, isHighlighted }) {
  const maxW = 200
  const maxH = 140
  const padding = 28

  const scaleX = (maxW - padding * 2) / cut.cutW
  const scaleY = (maxH - padding * 2) / cut.cutH
  const scale = Math.min(scaleX, scaleY)

  const pw = cut.cutW * scale
  const ph = cut.cutH * scale
  const ox = (maxW - pw) / 2
  const oy = (maxH - ph) / 2

  const color = getColor(cut.label)

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${maxW} ${maxH}`} preserveAspectRatio="xMidYMid meet">
      {/* Piece rectangle */}
      <rect
        x={ox} y={oy} width={pw} height={ph}
        fill={color}
        fillOpacity={isHighlighted ? 0.5 : 0.2}
        stroke={color}
        strokeWidth={isHighlighted ? 2 : 1}
      />

      {/* Width dimension (bottom) */}
      <line x1={ox} y1={oy + ph + 10} x2={ox + pw} y2={oy + ph + 10}
        stroke={theme.text.muted} strokeWidth={0.5} />
      <line x1={ox} y1={oy + ph + 6} x2={ox} y2={oy + ph + 14}
        stroke={theme.text.muted} strokeWidth={0.5} />
      <line x1={ox + pw} y1={oy + ph + 6} x2={ox + pw} y2={oy + ph + 14}
        stroke={theme.text.muted} strokeWidth={0.5} />
      <text x={ox + pw / 2} y={oy + ph + 21} textAnchor="middle"
        fontSize={10} fill={theme.text.secondary} fontFamily="monospace">
        {fmt(cut.cutW)}
      </text>

      {/* Height dimension (right) */}
      <line x1={ox + pw + 10} y1={oy} x2={ox + pw + 10} y2={oy + ph}
        stroke={theme.text.muted} strokeWidth={0.5} />
      <line x1={ox + pw + 6} y1={oy} x2={ox + pw + 14} y2={oy}
        stroke={theme.text.muted} strokeWidth={0.5} />
      <line x1={ox + pw + 6} y1={oy + ph} x2={ox + pw + 14} y2={oy + ph}
        stroke={theme.text.muted} strokeWidth={0.5} />
      <text x={ox + pw + 20} y={oy + ph / 2} textAnchor="middle"
        fontSize={10} fill={theme.text.secondary} fontFamily="monospace"
        transform={`rotate(-90, ${ox + pw + 20}, ${oy + ph / 2})`}>
        {fmt(cut.cutH)}
      </text>

      {/* Label */}
      <text x={ox + pw / 2} y={oy + ph / 2 + 4} textAnchor="middle"
        fontSize={9} fill={theme.text.primary} fontFamily="monospace">
        {cut.label}
      </text>
    </svg>
  )
}

export default function PiecePreview({ cuts, highlightedIndex }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: theme.bg.base, borderLeft: `1px solid ${theme.bg.border}`,
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: `1px solid ${theme.bg.border}`,
      }}>
        <span style={{ fontSize: 12, color: theme.text.muted, fontWeight: 600, letterSpacing: 0.5 }}>PIEZAS DE CORTE</span>
      </div>

      {/* Grid of pieces — 3 columns, scroll if needed */}
      <div style={{
        flex: 1, overflow: 'auto', padding: '14px 16px',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12,
        alignContent: 'start',
      }}>
        {cuts.map((cut, i) => (
          <div key={i} style={{
            padding: 10, borderRadius: 8,
            border: `1px solid ${i === highlightedIndex ? theme.accent.orange : theme.bg.border}`,
            background: i === highlightedIndex ? `${theme.accent.orange}11` : theme.bg.elevated,
            transition: 'border-color 150ms, background 150ms',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            <div style={{ width: '100%', height: 140 }}>
              <Piece2D cut={cut} isHighlighted={i === highlightedIndex} />
            </div>
            <div style={{
              textAlign: 'center', fontSize: 12, color: theme.text.secondary,
              marginTop: 6, fontWeight: 500,
            }}>
              ×{cut.qty} · {cut.thickness}mm
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
