/**
 * ModuleRect.jsx — Un módulo como piezas separadas en SVG
 * Cada pieza estructural (lateral, tapa, base) se dibuja como un rectángulo independiente.
 * Los frentes de cajón/puerta son rectángulos sólidos.
 * Las manijas se muestran en posición exacta (mm).
 * x, y, w, h llegan en píxeles. scale = px/mm.
 */
import { useMemo, useState, useCallback } from 'react'
import AddButton from './AddButton'
import { theme } from '../../styles/theme'
import { useDesignStore } from '../../store/designStore'
import { calculateHandlePositions } from '../../utils/handlePositions'

// Colors — single accent color for all pieces (structure + fronts)
const PIECE_COLOR = '#d79921'       // gold — all module pieces
const PIECE_HOVER = '#e5a922'       // slightly brighter gold — hovered (with content)
const PIECE_SELECTED = '#fabd2f'    // brighter gold — selected / resizing
const HANDLE_COLOR = '#1d2021'      // dark — handle holes
const GAP = 8                       // px gap between pieces (autocad-like)

export default function ModuleRect({
  module,
  x,
  y,
  w,
  h,
  isSelected,
  onSelect,
  onAdd,
  editorHovered,
  svgRef,
  svgWidth,
  svgHeight,
  scale,
  onWidthChange,
  onHeightChange,
  isTopEdge,
  isBottomEdge,
  isLeftEdge,
  isRightEdge,
  drawLeftLateral: drawLeftLateralProp,
  drawRightLateral: drawRightLateralProp,
}) {
  const [isHovered, setIsHovered] = useState(false)

  const snap10 = useCallback((val) => Math.round(val / 10) * 10, [])

  const pxToMm = useCallback((pxDelta) => {
    // Since viewBox = container px, 1 viewBox unit = 1 px
    // scale = px/mm, so mm = px / scale
    return pxDelta / scale
  }, [scale])

  const handleResizeDrag = useCallback((e, direction, sign) => {
    e.stopPropagation()
    e.preventDefault()
    const startX = e.clientX
    const startY = e.clientY
    const startWidth = module.width
    const startHeight = module.height

    const onMove = (ev) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      if (direction === 'horizontal') {
        const deltaMm = pxToMm(dx * sign)
        const newWidth = snap10(Math.max(200, Math.min(1200, startWidth + deltaMm)))
        if (newWidth !== module.width) onWidthChange(module.id, newWidth)
      } else {
        const deltaMm = pxToMm(dy * sign)
        const newHeight = snap10(Math.max(200, Math.min(2400, startHeight + deltaMm)))
        if (newHeight !== module.height) onHeightChange(module.id, newHeight)
      }
    }

    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [module, pxToMm, onWidthChange, onHeightChange, snap10])

  // Add button positions — fixed 20px from module edges
  const addButtons = useMemo(() => {
    const buttons = []
    if (isTopEdge) buttons.push({ placement: 'above', x: x + w / 2, y: y - 22 })
    if (isBottomEdge) buttons.push({ placement: 'below', x: x + w / 2, y: y + h + 22 })
    if (isLeftEdge) buttons.push({ placement: 'left', x: x - 22, y: y + h / 2 })
    if (isRightEdge) buttons.push({ placement: 'right', x: x + w + 22, y: y + h / 2 })
    return buttons
  }, [x, y, w, h, isTopEdge, isBottomEdge, isLeftEdge, isRightEdge])

  // Design params from store
  const design = useDesignStore((s) => s.design)
  const T = design.thickness || 18
  const hasModuleAbove = !isTopEdge || false  // simplified: isTopEdge means no module above in context

  // Piece dimensions in px
  const tPx = Math.max(4, T * scale)  // lateral/top/base thickness in px

  // Determine which structural pieces to draw
  const drawLeftLateral = drawLeftLateralProp !== undefined ? drawLeftLateralProp : isLeftEdge
  const drawRightLateral = drawRightLateralProp !== undefined ? drawRightLateralProp : true
  const hasTopPiece = isTopEdge  // top piece only if no module above
  const hasBasePiece = true      // base always

  // Handle positions (in mm, relative to module)
  const handles = useMemo(() => {
    return calculateHandlePositions(module, T)
  }, [module, T])

  // Whether this module has content (doors or drawers)
  const hasContent = module.type === 'doors' || module.type === 'drawers'

  // Structural frame pieces
  const framePieces = useMemo(() => {
    const els = []
    const color = isSelected ? PIECE_SELECTED : (isHovered && hasContent) ? PIECE_HOVER : PIECE_COLOR

    // Left lateral (only if this module is at left edge)
    if (drawLeftLateral) {
      els.push(
        <rect key="lat-l" x={x} y={y} width={tPx} height={h}
          fill={color} />
      )
    }

    // Right lateral
    if (drawRightLateral) {
      els.push(
        <rect key="lat-r" x={x + w - tPx} y={y} width={tPx} height={h}
          fill={color} />
      )
    }

    // Top piece — always inset with GAP from laterals on BOTH sides
    if (hasTopPiece) {
      const topX = x + (drawLeftLateral ? tPx + GAP : GAP)
      const topW = w - (drawLeftLateral ? tPx + GAP : GAP) - (drawRightLateral ? tPx + GAP : GAP)
      els.push(
        <rect key="top" x={topX} y={y} width={topW} height={tPx}
          fill={color} />
      )
    }

    // Base piece — always inset with GAP from laterals on BOTH sides
    if (hasBasePiece) {
      const baseX = x + (drawLeftLateral ? tPx + GAP : GAP)
      const baseW = w - (drawLeftLateral ? tPx + GAP : GAP) - (drawRightLateral ? tPx + GAP : GAP)
      els.push(
        <rect key="base" x={baseX} y={y + h - tPx} width={baseW} height={tPx}
          fill={color} />
      )
    }

    return els
  }, [x, y, w, h, tPx, isSelected, isHovered, hasContent, drawLeftLateral, drawRightLateral, hasTopPiece, hasBasePiece])

  // Content: door/drawer fronts + handles
  const content = useMemo(() => {
    const els = []
    const { type, config } = module

    // Inner area (between structural pieces — always GAP from each side)
    const innerX = x + (drawLeftLateral ? tPx + GAP : GAP)
    const innerW = w - (drawLeftLateral ? tPx + GAP : GAP) - (drawRightLateral ? tPx + GAP : GAP)
    const innerY = y + (hasTopPiece ? tPx + GAP : GAP)
    const innerH = h - (hasTopPiece ? tPx + GAP : GAP) - (hasBasePiece ? tPx + GAP : GAP)

    const contentColor = isSelected ? PIECE_SELECTED : (isHovered ? PIECE_HOVER : PIECE_COLOR)

    if (type === 'doors') {
      const doorType = config?.doorType || 'double'

      if (doorType === 'double') {
        const doorW = (innerW - GAP) / 2
        // Left door front
        els.push(
          <rect key="door-l" x={innerX} y={innerY} width={doorW} height={innerH}
            fill={contentColor} />
        )
        // Right door front
        els.push(
          <rect key="door-r" x={innerX + doorW + GAP} y={innerY} width={doorW} height={innerH}
            fill={contentColor} />
        )
      } else if (doorType === 'single') {
        // Single door front
        els.push(
          <rect key="door-s" x={innerX} y={innerY} width={innerW} height={innerH}
            fill={contentColor} />
        )
      } else {
        // Lift-up
        els.push(
          <rect key="door-lift" x={innerX} y={innerY} width={innerW} height={innerH}
            fill={contentColor} />
        )
      }
    } else if (type === 'drawers') {
      const preset = config?.drawerPreset || 'three-equal'
      let fractions = []
      if (preset === 'one') fractions = [1]
      else if (preset === 'two-equal') fractions = [0.5, 0.5]
      else if (preset === 'three-equal') fractions = [0.333, 0.334, 0.333]
      else if (preset === 'one-large-two-small') fractions = [0.5, 0.25, 0.25]
      else fractions = [0.333, 0.334, 0.333]

      let currentY = innerY
      fractions.forEach((frac, i) => {
        const drawerH = innerH * frac - (i < fractions.length - 1 ? GAP : 0)
        els.push(
          <rect key={`drawer-${i}`}
            x={innerX} y={currentY}
            width={innerW} height={drawerH}
            fill={contentColor} />
        )
        currentY += drawerH + GAP
      })
    }

    // Handle positions (shown as dark dots on the fronts)
    handles.forEach((hp, i) => {
      // Convert mm position to px (relative to module top-left)
      const hx = x + hp.x * scale
      const hy = y + (module.height - hp.y) * scale  // flip Y (mm is bottom-up)
      const r = Math.max(3, 4 * scale)
      els.push(
        <circle key={`handle-${i}`}
          cx={hx} cy={hy} r={r}
          fill={HANDLE_COLOR} opacity={0.9} />
      )
    })

    return els
  }, [module, x, y, w, h, tPx, scale, handles, isSelected, isHovered, drawLeftLateral, drawRightLateral, hasTopPiece, hasBasePiece])

  // No resize handles — selection/resizing indicated by brighter color only
  // Resize still works via invisible edge zones for drag
  const resizeEdges = useMemo(() => {
    if (!isSelected) return null
    const edgeSize = 8
    return (
      <g>
        <rect key="re-r" x={x + w - edgeSize / 2} y={y} width={edgeSize} height={h}
          fill="transparent" className="cursor-ew-resize"
          onMouseDown={(e) => handleResizeDrag(e, 'horizontal', 1)} />
        <rect key="re-l" x={x - edgeSize / 2} y={y} width={edgeSize} height={h}
          fill="transparent" className="cursor-ew-resize"
          onMouseDown={(e) => handleResizeDrag(e, 'horizontal', -1)} />
        <rect key="re-t" x={x} y={y - edgeSize / 2} width={w} height={edgeSize}
          fill="transparent" className="cursor-ns-resize"
          onMouseDown={(e) => handleResizeDrag(e, 'vertical', -1)} />
        <rect key="re-b" x={x} y={y + h - edgeSize / 2} width={w} height={edgeSize}
          fill="transparent" className="cursor-ns-resize"
          onMouseDown={(e) => handleResizeDrag(e, 'vertical', 1)} />
      </g>
    )
  }, [isSelected, x, y, w, h, handleResizeDrag])

  return (
    <g
      onClick={() => onSelect(module.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Hit area (invisible) */}
      <rect
        x={x} y={y} width={w} height={h}
        fill="transparent"
        className="cursor-pointer"
      />

      {/* Structural frame pieces (laterals, top, base) */}
      {framePieces}

      {/* Door/drawer fronts + handle positions */}
      {content}

      {/* Diagonal lines on EMPTY modules: shown on hover OR when selected */}
      {(isHovered || isSelected) && !hasContent && (
        <g clipPath={`url(#clip-${module.id})`}>
          <defs>
            <clipPath id={`clip-${module.id}`}>
              <rect x={x + GAP} y={y + GAP} width={w - GAP * 2} height={h - GAP * 2} />
            </clipPath>
          </defs>
          {Array.from({ length: Math.ceil((w + h) / 20) }, (_, i) => {
            const offset = i * 20
            return (
              <line key={`hov-${i}`}
                x1={x + offset} y1={y}
                x2={x + offset - h} y2={y + h}
                stroke={isSelected ? PIECE_SELECTED : PIECE_COLOR} strokeWidth={4}
                strokeLinecap="round" />
            )
          })}
        </g>
      )}

      {/* Invisible resize edges (no visual handles) */}
      {resizeEdges}

      {/* Add buttons */}
      {addButtons.map((btn) => (
        <AddButton
          key={btn.placement}
          x={btn.x}
          y={btn.y}
          placement={btn.placement}
          referenceId={module.id}
          onAdd={onAdd}
          visible={editorHovered}
        />
      ))}
    </g>
  )
}
