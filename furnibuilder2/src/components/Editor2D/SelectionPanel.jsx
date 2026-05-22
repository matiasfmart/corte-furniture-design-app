/**
 * SelectionPanel.jsx — Panel de propiedades (zona inferior)
 * Row 1: Tipo + Dimensiones + Config
 * Row 2: Medidas derivadas del módulo (info calculada)
 */
import { useMemo } from 'react'
import { useDesignStore } from '../../store/designStore'
import { theme } from '../../styles/theme'

const fmt = (n) => Number.isInteger(n) ? n : Math.round(n * 10) / 10

const inputStyle = {
  background: theme.bg.elevated,
  border: `1px solid ${theme.bg.border}`,
  borderRadius: 4,
  color: theme.text.primary,
  fontSize: 12,
  padding: '3px 6px',
  height: 26,
  outline: 'none',
}

const btnStyle = (active) => ({
  background: active ? `${theme.accent.orange}20` : 'transparent',
  border: `1px solid ${active ? theme.accent.orange : theme.bg.border}`,
  borderRadius: 4,
  color: active ? theme.accent.orange : theme.text.secondary,
  fontSize: 11,
  padding: '2px 8px',
  height: 24,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
})

const labelStyle = { color: theme.text.muted, fontSize: 10, whiteSpace: 'nowrap' }
const infoStyle = { color: theme.text.secondary, fontSize: 11, fontFamily: 'monospace' }

export default function SelectionPanel({ module }) {
  const updateModuleType = useDesignStore((s) => s.updateModuleType)
  const updateModuleWidth = useDesignStore((s) => s.updateModuleWidth)
  const updateModuleHeight = useDesignStore((s) => s.updateModuleHeight)
  const updateModuleConfig = useDesignStore((s) => s.updateModuleConfig)
  const removeModule = useDesignStore((s) => s.removeModule)
  const design = useDesignStore((s) => s.design)
  const modules = useDesignStore((s) => s.modules)

  // Compute derived measurements for this module
  const derived = useMemo(() => {
    if (!module) return null
    const T = design.thickness || 18
    const BT = design.backThickness || 3
    const D = design.depth || 400
    const DC = design.doorClearance || 5
    const SC = design.sliderClearance || 25
    const doorMount = design.doorMount || 'overlay'

    const columns = [...new Set(modules.map((m) => m.col))].sort((a, b) => a - b)
    const hasLeftNeighbor = columns.includes(module.col - 1)
    const hasRightNeighbor = columns.includes(module.col + 1)
    const hasModuleAbove = modules.some((m) => m.col === module.col && m.row === module.row + 1)

    const leftInset = hasLeftNeighbor ? 0 : T
    const rightInset = T
    const innerW = module.width - leftInset - rightInset
    const topT = hasModuleAbove ? 0 : T
    const innerH = module.height - T - topT

    const result = { innerW, innerH, depth: D }

    if (module.type === 'doors') {
      const doorType = module.config?.doorType || 'double'
      if (doorMount === 'overlay') {
        const leftOverlay = hasLeftNeighbor ? T / 2 : T
        const rightOverlay = hasRightNeighbor ? T / 2 : T
        const effectiveW = innerW + leftOverlay + rightOverlay
        if (doorType === 'double') {
          result.doorW = Math.floor((effectiveW - 2 * DC) / 2)
        } else {
          result.doorW = effectiveW - DC
        }
        result.doorH = module.height - DC
      } else {
        if (doorType === 'double') {
          result.doorW = Math.floor((innerW - 2 * DC) / 2)
        } else {
          result.doorW = innerW - DC
        }
        result.doorH = innerH - DC
      }
      // Shelf depth
      if (module.config?.shelves > 0) {
        result.shelfD = doorMount === 'inset' ? D - BT - 10 - T : D - BT - 10
      }
    }

    if (module.type === 'drawers') {
      const preset = module.config?.drawerPreset || 'three-equal'
      const GAP = 3
      const numDrawers = preset === 'one' ? 1 : preset === 'two-equal' ? 2 : 3
      const totalGap = GAP * (numDrawers - 1)
      const available = innerH - totalGap

      if (preset === 'one') {
        result.drawerHeights = [Math.round(available)]
      } else if (preset === 'two-equal') {
        const base = Math.floor(available / 2)
        result.drawerHeights = [base, available - base]
      } else {
        const base = Math.floor(available / 3)
        result.drawerHeights = [base, base, available - base * 2]
      }

      // Front width
      if (doorMount === 'overlay') {
        const leftOverlay = hasLeftNeighbor ? T / 2 : T
        const rightOverlay = hasRightNeighbor ? T / 2 : T
        result.frontW = innerW + leftOverlay + rightOverlay - DC
      } else {
        result.frontW = innerW - DC
      }

      result.bodyW = innerW - SC
      result.bodyD = D - T - BT - 50
    }

    if (module.type === 'open' && module.config?.shelves > 0) {
      result.shelfD = D - BT - 10
    }

    return result
  }, [module, design, modules])

  if (!module) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', padding: '6px 0' }}>
      {/* ROW 1 — Tipo + Dimensiones + Config */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <select
          value={module.type}
          onChange={(e) => updateModuleType(module.id, e.target.value)}
          style={{ ...inputStyle, width: 82 }}
        >
          <option value="open">Abierto</option>
          <option value="doors">Puertas</option>
          <option value="drawers">Cajones</option>
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={labelStyle}>↔</span>
          <input type="number" value={module.width}
            onChange={(e) => updateModuleWidth(module.id, Number(e.target.value))}
            step={10} min={200} max={1200} style={{ ...inputStyle, width: 56 }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={labelStyle}>↕</span>
          <input type="number" value={module.height}
            onChange={(e) => updateModuleHeight(module.id, Number(e.target.value))}
            step={10} min={200} max={2400} style={{ ...inputStyle, width: 56 }} />
        </div>

        <span style={{ ...labelStyle, fontSize: 9 }}>mm</span>

        {/* Separator */}
        <div style={{ width: 1, height: 18, background: theme.bg.border, margin: '0 2px' }} />

        {/* DOORS config */}
        {module.type === 'doors' && (
          <>
            {[
              { key: 'single', label: 'Simple' },
              { key: 'double', label: 'Doble' },
              { key: 'lift-up', label: 'Abatible' },
            ].map((dt) => (
              <button key={dt.key}
                onClick={() => updateModuleConfig(module.id, { doorType: dt.key })}
                style={btnStyle(module.config?.doorType === dt.key)}
              >{dt.label}</button>
            ))}
            {module.config?.doorType === 'single' && (
              <>
                <span style={labelStyle}>Abre:</span>
                <button onClick={() => updateModuleConfig(module.id, { doorSide: 'left' })}
                  style={btnStyle(module.config?.doorSide === 'left')}>← Izq</button>
                <button onClick={() => updateModuleConfig(module.id, { doorSide: 'right' })}
                  style={btnStyle(module.config?.doorSide !== 'left')}>Der →</button>
              </>
            )}
          </>
        )}

        {/* DRAWERS config */}
        {module.type === 'drawers' && (
          <>
            {[
              { key: 'one', label: '1' },
              { key: 'two-equal', label: '2' },
              { key: 'three-equal', label: '3' },
            ].map((p) => (
              <button key={p.key}
                onClick={() => updateModuleConfig(module.id, { drawerPreset: p.key })}
                style={btnStyle(module.config?.drawerPreset === p.key)}
              >{p.label}</button>
            ))}
          </>
        )}

        {/* Estantes — open y doors */}
        {['open', 'doors'].includes(module.type) && (
          <>
            <div style={{ width: 1, height: 18, background: theme.bg.border, margin: '0 2px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={labelStyle}>Estantes:</span>
              <button onClick={() => updateModuleConfig(module.id, { shelves: Math.max(0, (module.config?.shelves || 0) - 1) })}
                style={{ ...btnStyle(false), padding: '1px 6px', fontSize: 12 }}>−</button>
              <span style={{ color: theme.text.primary, fontSize: 12, fontFamily: 'monospace', minWidth: 14, textAlign: 'center' }}>
                {module.config?.shelves || 0}
              </span>
              <button onClick={() => updateModuleConfig(module.id, { shelves: Math.min(8, (module.config?.shelves || 0) + 1) })}
                style={{ ...btnStyle(false), padding: '1px 6px', fontSize: 12 }}>+</button>
            </div>
          </>
        )}

        {/* Eliminar */}
        <button
          onClick={() => removeModule(module.id)}
          style={{ marginLeft: 'auto', background: 'transparent', border: 'none',
            color: theme.accent.red, fontSize: 14, cursor: 'pointer', padding: '2px 8px', opacity: 0.7 }}
          title="Eliminar módulo"
        >✕</button>
      </div>

      {/* ROW 2 — Medidas derivadas */}
      {derived && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={infoStyle}>
            Interior: {fmt(derived.innerW)}×{fmt(derived.innerH)}mm
          </span>

          {module.type === 'doors' && derived.doorW && (
            <span style={infoStyle}>
              Puerta: {fmt(derived.doorW)}×{fmt(derived.doorH)}mm
            </span>
          )}

          {module.type === 'doors' && derived.shelfD && (
            <span style={infoStyle}>
              Estante prof: {fmt(derived.shelfD)}mm
            </span>
          )}

          {module.type === 'drawers' && derived.drawerHeights && (
            <span style={infoStyle}>
              Frentes: {derived.drawerHeights.map((h) => `${fmt(h)}`).join(' / ')}mm
              {' · '}ancho: {fmt(derived.frontW)}mm
            </span>
          )}

          {module.type === 'drawers' && derived.bodyW && (
            <span style={infoStyle}>
              Cuerpo: {fmt(derived.bodyW)}×{fmt(derived.bodyD)}mm
            </span>
          )}

          {module.type === 'open' && derived.shelfD && (
            <span style={infoStyle}>
              Estante: {fmt(derived.innerW)}×{fmt(derived.shelfD)}mm
            </span>
          )}
        </div>
      )}
    </div>
  )
}
