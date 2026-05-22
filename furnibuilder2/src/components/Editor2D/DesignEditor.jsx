/**
 * DesignEditor.jsx — Contenedor del editor 2D
 * SVG con viewBox = tamaño del contenedor en px.
 * Zonas reservadas para botones, labels, módulos.
 * Elementos internos en px fijos — nunca escalan.
 */
import { useMemo, useRef, useState, useEffect } from 'react'
import { useDesignStore } from '../../store/designStore'
import ModuleRect from './ModuleRect'
import { ExternalDimensions } from './DimensionLabel'
import { theme } from '../../styles/theme'

// Zonas internas del SVG (px):
const ZONE = {
  marginTop: 60,
  marginBottom: 60,
  marginLeft: 60,
  marginRight: 60,
  labelHeight: 50,
  buttonRadius: 14,
  buttonOffset: 24,
}

export default function DesignEditor() {
  const modules = useDesignStore((s) => s.modules)
  const selectedModuleId = useDesignStore((s) => s.selectedModuleId)
  const selectModule = useDesignStore((s) => s.selectModule)
  const clearSelection = useDesignStore((s) => s.clearSelection)
  const addModule = useDesignStore((s) => s.addModule)
  const updateModuleWidth = useDesignStore((s) => s.updateModuleWidth)
  const updateModuleHeight = useDesignStore((s) => s.updateModuleHeight)
  const containerRef = useRef(null)
  const svgRef = useRef(null)
  const [editorHovered, setEditorHovered] = useState(false)
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 })

  // Track container pixel dimensions
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) setContainerSize({ width, height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Calculate layout: column positions, module positions, and scale
  const layout = useMemo(() => {
    if (modules.length === 0) return null

    // Get unique columns sorted
    const cols = [...new Set(modules.map((m) => m.col))].sort((a, b) => a - b)

    // Column widths (max width in each column)
    const colWidths = {}
    cols.forEach((col) => {
      const colModules = modules.filter((m) => m.col === col)
      colWidths[col] = Math.max(...colModules.map((m) => m.width))
    })

    // Column heights (sum of heights in each column)
    const colHeights = {}
    cols.forEach((col) => {
      const colModules = modules.filter((m) => m.col === col)
      colHeights[col] = colModules.reduce((sum, m) => sum + m.height, 0)
    })

    // Total dimensions in mm
    const totalWidth = cols.reduce((sum, col) => sum + colWidths[col], 0)
    const maxHeight = Math.max(...Object.values(colHeights))

    // Column X positions in mm
    const colX = {}
    let xAccum = 0
    cols.forEach((col) => {
      colX[col] = xAccum
      xAccum += colWidths[col]
    })

    return { cols, colWidths, colHeights, colX, totalWidth, maxHeight }
  }, [modules])

  // Module positions in SVG coordinates
  const modulePositions = useMemo(() => {
    if (!layout) return []
    // We'll compute final positions in the SVG render using scale
    return modules.map((mod) => {
      const colModules = modules
        .filter((m) => m.col === mod.col)
        .sort((a, b) => a.row - b.row)

      // Y position: sum of heights of modules below (rows < mod.row)
      let yOffset = 0
      for (const cm of colModules) {
        if (cm.row < mod.row) yOffset += cm.height
      }

      return {
        module: mod,
        mmX: layout.colX[mod.col],
        mmY: yOffset,
        mmW: layout.colWidths[mod.col],
        mmH: mod.height,
      }
    })
  }, [modules, layout])

  // Determine edge status for each module
  const edgeStatus = useMemo(() => {
    const status = {}
    const allCols = layout ? layout.cols : []
    const minCol = allCols[0]
    const maxCol = allCols[allCols.length - 1]

    modules.forEach((mod) => {
      const colModules = modules.filter((m) => m.col === mod.col)
      const maxRow = Math.max(...colModules.map((m) => m.row))
      const minRow = Math.min(...colModules.map((m) => m.row))

      const isLeftEdge = mod.col === minCol
      const isRightEdge = mod.col === maxCol

      // Shared lateral rule: taller column draws the shared lateral
      const colIdx = allCols.indexOf(mod.col)
      const myColHeight = layout.colHeights[mod.col]

      // Left lateral: draw if leftmost OR if this column is strictly taller than left neighbor
      let drawLeftLateral = isLeftEdge
      if (!isLeftEdge) {
        const leftCol = allCols[colIdx - 1]
        const leftColHeight = layout.colHeights[leftCol]
        drawLeftLateral = myColHeight > leftColHeight
      }

      // Right lateral: draw if rightmost OR if this column is >= right neighbor height
      let drawRightLateral = isRightEdge
      if (!isRightEdge) {
        const rightCol = allCols[colIdx + 1]
        const rightColHeight = layout.colHeights[rightCol]
        drawRightLateral = myColHeight >= rightColHeight
      }

      status[mod.id] = {
        isTopEdge: mod.row === maxRow,
        isBottomEdge: mod.row === minRow,
        isLeftEdge,
        isRightEdge,
        drawLeftLateral,
        drawRightLateral,
      }
    })
    return status
  }, [modules, layout])

  // Calculate floating panel position based on selected module
  // (Panel is now fixed in App.jsx — this is a no-op kept for compatibility)

  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget || e.target.tagName === 'svg') {
      clearSelection()
    }
  }

  if (!layout || modules.length === 0) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center"
        style={{ backgroundColor: theme.bg.soft }}>
        <span style={{ color: theme.text.muted, fontSize: 13 }}>Sin módulos</span>
      </div>
    )
  }

  // Compute pixel-based scale using zone system
  const { width: svgW, height: svgH } = containerSize
  const drawableW = svgW - ZONE.marginLeft - ZONE.marginRight
  const drawableH = svgH - ZONE.marginTop - ZONE.marginBottom - ZONE.labelHeight
  const scaleX = drawableW * 0.65 / layout.totalWidth
  const scaleY = drawableH * 0.80 / layout.maxHeight
  const scale = Math.min(scaleX, scaleY, 0.34)

  // Furniture pixel dimensions
  const furnitureW = layout.totalWidth * scale
  const furnitureH = layout.maxHeight * scale

  // Origin: center in drawable area
  const originX = ZONE.marginLeft + (drawableW - furnitureW) / 2
  const originY = ZONE.marginTop + (drawableH - furnitureH) / 2

  const viewBox = `0 0 ${svgW} ${svgH}`

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden relative"
      style={{ backgroundColor: theme.bg.soft }}
      onMouseEnter={() => setEditorHovered(true)}
      onMouseLeave={() => setEditorHovered(false)}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        onClick={handleBackgroundClick}
        className="select-none"
      >
        {/* Pattern for open module hover */}
        <defs>
          <pattern
            id="hatch-open"
            patternUnits="userSpaceOnUse"
            width={10} height={10}
            patternTransform="rotate(45)"
          >
            <line x1={0} y1={0} x2={0} y2={10}
              stroke={theme.bg.border} strokeWidth={1.2} />
          </pattern>
        </defs>

        {/* Modules — pixel coordinates */}
        {modulePositions.map(({ module: mod, mmX, mmY, mmW, mmH }) => {
          const px = originX + mmX * scale
          const py = originY + (layout.maxHeight - mmY - mmH) * scale
          const pw = mmW * scale
          const ph = mmH * scale

          return (
            <ModuleRect
              key={mod.id}
              module={mod}
              x={px}
              y={py}
              w={pw}
              h={ph}
              isSelected={mod.id === selectedModuleId}
              onSelect={selectModule}
              onAdd={addModule}
              editorHovered={editorHovered}
              svgRef={svgRef}
              svgWidth={svgW}
              svgHeight={svgH}
              scale={scale}
              onWidthChange={updateModuleWidth}
              onHeightChange={updateModuleHeight}
              {...edgeStatus[mod.id]}
            />
          )
        })}

        {/* External dimensions and column labels */}
        <ExternalDimensions
          layout={layout}
          originX={originX}
          originY={originY}
          scale={scale}
          selectedModuleId={selectedModuleId}
          modulePositions={modulePositions}
          zone={ZONE}
        />
      </svg>
    </div>
  )
}
