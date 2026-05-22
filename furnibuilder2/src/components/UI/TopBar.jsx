import { useState, useRef } from 'react'
import { useDesignStore } from '../../store/designStore'
import { MATERIAL_LABELS } from '../../data/moduleCatalog'
import { theme } from '../../styles/theme'

const MATERIALS = Object.entries(MATERIAL_LABELS)

export default function TopBar({ isMobile }) {
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
  const [showSettings, setShowSettings] = useState(false)
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

  const selectStyle = {
    background: theme.bg.elevated,
    border: `1px solid ${theme.bg.border}`,
    color: theme.text.primary,
    fontSize: 13,
    borderRadius: 4,
    padding: '4px 8px',
    outline: 'none',
    cursor: 'pointer',
  }

  const labelStyle = { color: theme.text.muted, fontSize: 11, whiteSpace: 'nowrap' }

  const settingsContent = (
    <>
      {/* Depth control */}
      <div className="flex items-center gap-1.5">
        <span style={labelStyle}>Prof:</span>
        {editingDepth ? (
          <input
            ref={depthRef}
            type="number"
            value={depthValue}
            onChange={(e) => setDepthValue(e.target.value)}
            onBlur={commitDepth}
            onKeyDown={handleDepthKey}
            style={{ ...selectStyle, width: 60 }}
            min={200}
            max={800}
          />
        ) : (
          <button onClick={handleDepthClick} style={selectStyle}>
            {depth}mm
          </button>
        )}
      </div>

      {/* Material selector */}
      <div className="flex items-center gap-1.5">
        <span style={labelStyle}>Mat:</span>
        <select value={material} onChange={(e) => updateMaterial(e.target.value)} style={selectStyle}>
          {MATERIALS.map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Thickness */}
      <div className="flex items-center gap-1.5">
        <span style={labelStyle}>Grosor:</span>
        <select value={thickness} onChange={(e) => updateThickness(+e.target.value)} style={selectStyle}>
          <option value={12}>12mm</option>
          <option value={15}>15mm</option>
          <option value={18}>18mm</option>
        </select>
      </div>

      {/* Back thickness */}
      <div className="flex items-center gap-1.5">
        <span style={labelStyle}>Fondo:</span>
        <select value={backThickness} onChange={(e) => updateBackThickness(+e.target.value)} style={selectStyle}>
          <option value={3}>3mm</option>
          <option value={4}>4mm</option>
          <option value={6}>6mm</option>
        </select>
      </div>

      {/* Hinge type */}
      <div className="flex items-center gap-1.5">
        <span style={labelStyle}>Bisagra:</span>
        <select value={hingeType} onChange={(e) => updateHingeType(e.target.value)} style={selectStyle}>
          <option value="clip-on">Cazoleta</option>
          <option value="soft-close">Soft-close</option>
          <option value="piano">Piano</option>
        </select>
      </div>

      {/* Door mount */}
      <div className="flex items-center gap-1.5">
        <span style={labelStyle}>Montaje:</span>
        <select value={doorMount} onChange={(e) => updateDoorMount(e.target.value)} style={selectStyle}>
          <option value="overlay">Overlay</option>
          <option value="inset">Inset</option>
        </select>
      </div>

      {/* Door clearance */}
      <div className="flex items-center gap-1.5">
        <span style={labelStyle}>Holg:</span>
        <select value={doorClearance} onChange={(e) => updateDoorClearance(+e.target.value)} style={selectStyle}>
          <option value={2}>2mm</option>
          <option value={3}>3mm</option>
          <option value={4}>4mm</option>
          <option value={5}>5mm</option>
          <option value={6}>6mm</option>
        </select>
      </div>

      {/* Slider clearance */}
      <div className="flex items-center gap-1.5">
        <span style={labelStyle}>Corr:</span>
        <select value={sliderClearance} onChange={(e) => updateSliderClearance(+e.target.value)} style={selectStyle}>
          <option value={17}>17mm</option>
          <option value={25}>25mm</option>
        </select>
      </div>
    </>
  )

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div
        style={{
          height: 48,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 16,
          background: theme.bg.hard,
          borderBottom: `1px solid ${theme.bg.border}`,
        }}
      >
        {/* Brand */}
        <span style={{ fontWeight: 700, fontSize: 14, color: theme.text.primary, userSelect: 'none', letterSpacing: '0.5px' }}>
          corte
        </span>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0 }}>
          {[
            { key: 'designer', label: 'Diseñar' },
            { key: 'bom', label: 'Materiales' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              style={{
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                background: view === tab.key ? theme.accent.orangeSoft : 'transparent',
                color: view === tab.key ? theme.accent.orange : theme.text.secondary,
                borderBottom: view === tab.key ? `2px solid ${theme.accent.orange}` : '2px solid transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {isMobile ? (
          /* Mobile: gear button to toggle settings */
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              background: showSettings ? `${theme.accent.orange}20` : 'transparent',
              border: 'none',
              color: showSettings ? theme.accent.orange : theme.text.secondary,
              fontSize: 18,
              cursor: 'pointer',
              padding: '6px 10px',
              borderRadius: 6,
            }}
          >
            ⚙
          </button>
        ) : (
          /* Desktop: inline controls */
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {settingsContent}
          </div>
        )}
      </div>

      {/* Mobile settings dropdown */}
      {isMobile && showSettings && (
        <div style={{
          position: 'absolute',
          top: 48,
          left: 0,
          right: 0,
          zIndex: 50,
          background: theme.bg.hard,
          borderBottom: `1px solid ${theme.bg.border}`,
          padding: '12px 16px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          {settingsContent}
        </div>
      )}
    </div>
  )
}
