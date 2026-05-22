import { useState, useRef } from 'react'
import { useDesignStore } from '../../store/designStore'
import { MATERIAL_LABELS } from '../../data/moduleCatalog'
import { theme } from '../../styles/theme'

const MATERIALS = Object.entries(MATERIAL_LABELS)

export default function TopBar() {
  const view = useDesignStore((s) => s.view)
  const setView = useDesignStore((s) => s.setView)
  const depth = useDesignStore((s) => s.design.depth)
  const material = useDesignStore((s) => s.design.material)
  const designName = useDesignStore((s) => s.design.name)
  const thickness = useDesignStore((s) => s.design.thickness)
  const backThickness = useDesignStore((s) => s.design.backThickness)
  const hingeType = useDesignStore((s) => s.design.hingeType)
  const doorMount = useDesignStore((s) => s.design.doorMount)
  const doorClearance = useDesignStore((s) => s.design.doorClearance)
  const sliderClearance = useDesignStore((s) => s.design.sliderClearance)
  const updateDepth = useDesignStore((s) => s.updateDepth)
  const updateMaterial = useDesignStore((s) => s.updateMaterial)
  const updateThickness = useDesignStore((s) => s.updateThickness)
  const updateBackThickness = useDesignStore((s) => s.updateBackThickness)
  const updateHingeType = useDesignStore((s) => s.updateHingeType)
  const updateDoorMount = useDesignStore((s) => s.updateDoorMount)
  const updateDoorClearance = useDesignStore((s) => s.updateDoorClearance)
  const updateSliderClearance = useDesignStore((s) => s.updateSliderClearance)
  const renameDesign = useDesignStore((s) => s.renameDesign)

  const [editingDepth, setEditingDepth] = useState(false)
  const [depthValue, setDepthValue] = useState(String(depth))
  const depthRef = useRef(null)

  const handleDepthClick = () => {
    setDepthValue(String(depth))
    setEditingDepth(true)
    setTimeout(() => depthRef.current?.select(), 0)
  }

  const commitDepth = () => {
    const val = parseInt(depthValue, 10)
    if (val >= 200 && val <= 800) {
      updateDepth(val)
    }
    setEditingDepth(false)
  }

  const handleDepthKey = (e) => {
    if (e.key === 'Enter') commitDepth()
    if (e.key === 'Escape') setEditingDepth(false)
  }

  return (
    <div
      className="h-12 flex items-center px-4 gap-4 shrink-0"
      style={{ background: theme.bg.hard, borderBottom: `1px solid ${theme.bg.border}` }}
    >
      {/* Brand */}
      <span className="font-bold text-sm select-none tracking-wide">
        <span style={{ color: theme.text.primary }}>corte</span>
      </span>

      {/* Tabs */}
      <div className="flex gap-0">
        <button
          onClick={() => setView('designer')}
          className="px-3 py-2 text-xs font-medium transition-colors"
          style={{
            background: view === 'designer' ? theme.accent.orangeSoft : 'transparent',
            color: view === 'designer' ? theme.accent.orange : theme.text.secondary,
            borderBottom: view === 'designer' ? `2px solid ${theme.accent.orange}` : '2px solid transparent',
          }}
        >
          Diseñar
        </button>
        <button
          onClick={() => setView('bom')}
          className="px-3 py-2 text-xs font-medium transition-colors"
          style={{
            background: view === 'bom' ? theme.accent.orangeSoft : 'transparent',
            color: view === 'bom' ? theme.accent.orange : theme.text.secondary,
            borderBottom: view === 'bom' ? `2px solid ${theme.accent.orange}` : '2px solid transparent',
          }}
        >
          Materiales
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Depth control */}
      <div className="flex items-center gap-1.5">
        <span style={{ color: theme.text.muted, fontSize: 11 }}>Prof:</span>
        {editingDepth ? (
          <input
            ref={depthRef}
            type="number"
            value={depthValue}
            onChange={(e) => setDepthValue(e.target.value)}
            onBlur={commitDepth}
            onKeyDown={handleDepthKey}
            className="w-14 rounded px-1.5 py-0.5 text-xs outline-none"
            style={{
              background: theme.bg.elevated,
              border: `1px solid ${theme.bg.border}`,
              color: theme.text.primary,
              fontSize: 13,
            }}
            min={200}
            max={800}
          />
        ) : (
          <button
            onClick={handleDepthClick}
            className="rounded px-2 py-0.5 transition-colors"
            style={{
              background: theme.bg.elevated,
              border: `1px solid ${theme.bg.border}`,
              color: theme.text.primary,
              fontSize: 13,
            }}
          >
            {depth}mm
          </button>
        )}
      </div>

      {/* Material selector */}
      <div className="flex items-center gap-1.5">
        <span style={{ color: theme.text.muted, fontSize: 11 }}>Mat:</span>
        <select
          value={material}
          onChange={(e) => updateMaterial(e.target.value)}
          className="rounded px-2 py-0.5 cursor-pointer outline-none"
          style={{
            background: theme.bg.elevated,
            border: `1px solid ${theme.bg.border}`,
            color: theme.text.primary,
            fontSize: 13,
          }}
        >
          {MATERIALS.map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Thickness selector */}
      <div className="flex items-center gap-1.5">
        <span style={{ color: theme.text.muted, fontSize: 11 }}>Grosor:</span>
        <select
          value={thickness}
          onChange={(e) => updateThickness(+e.target.value)}
          className="rounded px-2 py-0.5 cursor-pointer outline-none"
          style={{
            background: theme.bg.elevated,
            border: `1px solid ${theme.bg.border}`,
            color: theme.text.primary,
            fontSize: 13,
          }}
        >
          <option value={12}>12mm</option>
          <option value={15}>15mm</option>
          <option value={18}>18mm</option>
        </select>
      </div>

      {/* Back thickness selector */}
      <div className="flex items-center gap-1.5">
        <span style={{ color: theme.text.muted, fontSize: 11 }}>Fondo:</span>
        <select
          value={backThickness}
          onChange={(e) => updateBackThickness(+e.target.value)}
          className="rounded px-2 py-0.5 cursor-pointer outline-none"
          style={{
            background: theme.bg.elevated,
            border: `1px solid ${theme.bg.border}`,
            color: theme.text.primary,
            fontSize: 13,
          }}
        >
          <option value={3}>3mm</option>
          <option value={4}>4mm</option>
          <option value={6}>6mm</option>
        </select>
      </div>

      {/* Hinge type selector */}
      <div className="flex items-center gap-1.5">
        <span style={{ color: theme.text.muted, fontSize: 11 }}>Bisagra:</span>
        <select
          value={hingeType}
          onChange={(e) => updateHingeType(e.target.value)}
          className="rounded px-2 py-0.5 cursor-pointer outline-none"
          style={{
            background: theme.bg.elevated,
            border: `1px solid ${theme.bg.border}`,
            color: theme.text.primary,
            fontSize: 13,
          }}
        >
          <option value="clip-on">Cazoleta</option>
          <option value="soft-close">Soft-close</option>
          <option value="piano">Piano</option>
        </select>
      </div>

      {/* Door mount selector */}
      <div className="flex items-center gap-1.5">
        <span style={{ color: theme.text.muted, fontSize: 11 }}>Montaje:</span>
        <select
          value={doorMount}
          onChange={(e) => updateDoorMount(e.target.value)}
          className="rounded px-2 py-0.5 cursor-pointer outline-none"
          style={{
            background: theme.bg.elevated,
            border: `1px solid ${theme.bg.border}`,
            color: theme.text.primary,
            fontSize: 13,
          }}
        >
          <option value="overlay">Overlay</option>
          <option value="inset">Inset</option>
        </select>
      </div>

      {/* Door clearance */}
      <div className="flex items-center gap-1.5">
        <span style={{ color: theme.text.muted, fontSize: 11 }}>Holg:</span>
        <select
          value={doorClearance}
          onChange={(e) => updateDoorClearance(+e.target.value)}
          className="rounded px-2 py-0.5 cursor-pointer outline-none"
          style={{
            background: theme.bg.elevated,
            border: `1px solid ${theme.bg.border}`,
            color: theme.text.primary,
            fontSize: 13,
          }}
        >
          <option value={2}>2mm</option>
          <option value={3}>3mm</option>
          <option value={4}>4mm</option>
          <option value={5}>5mm</option>
          <option value={6}>6mm</option>
        </select>
      </div>

      {/* Slider clearance */}
      <div className="flex items-center gap-1.5">
        <span style={{ color: theme.text.muted, fontSize: 11 }}>Corr:</span>
        <select
          value={sliderClearance}
          onChange={(e) => updateSliderClearance(+e.target.value)}
          className="rounded px-2 py-0.5 cursor-pointer outline-none"
          style={{
            background: theme.bg.elevated,
            border: `1px solid ${theme.bg.border}`,
            color: theme.text.primary,
            fontSize: 13,
          }}
        >
          <option value={17}>17mm</option>
          <option value={25}>25mm</option>
        </select>
      </div>
    </div>
  )
}
