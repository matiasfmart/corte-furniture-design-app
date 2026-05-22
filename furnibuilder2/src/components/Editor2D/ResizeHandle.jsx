/**
 * ResizeHandle.jsx — Handles arrastrables en los bordes de módulos
 * Permite redimensionar ancho (columna) y alto (módulo) con drag.
 * Snap a 50mm. Muestra ghost preview durante drag.
 */
import { useRef, useCallback, useState } from 'react'

const SNAP = 50 // mm
const HANDLE_SIZE = 8

export default function ResizeHandle({
  direction,
  x,
  y,
  length,
  onResize,
  onResizeEnd,
  onResizeStart,
  svgRef,
  viewBoxWidth,
  viewBoxHeight,
}) {
  const dragging = useRef(false)
  const startPos = useRef(0)
  const accumulated = useRef(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const getSvgScale = useCallback(() => {
    if (!svgRef?.current) return 1
    const rect = svgRef.current.getBoundingClientRect()
    if (direction === 'horizontal') {
      return viewBoxWidth / rect.width
    }
    return viewBoxHeight / rect.height
  }, [svgRef, viewBoxWidth, viewBoxHeight, direction])

  const handlePointerDown = useCallback((e) => {
    e.stopPropagation()
    e.preventDefault()
    dragging.current = true
    accumulated.current = 0
    startPos.current = direction === 'horizontal' ? e.clientX : e.clientY
    setIsDragging(true)
    setDragOffset(0)
    onResizeStart?.()

    const handlePointerMove = (ev) => {
      if (!dragging.current) return
      const scale = getSvgScale()
      const current = direction === 'horizontal' ? ev.clientX : ev.clientY
      const deltaPx = current - startPos.current
      const deltaMm = deltaPx * scale

      // Show ghost at pixel-level precision
      setDragOffset(deltaMm)

      // Snap to SNAP increments for actual resize
      const snapped = Math.round(deltaMm / SNAP) * SNAP
      if (snapped !== accumulated.current) {
        const diff = snapped - accumulated.current
        accumulated.current = snapped
        onResize(diff)
      }
    }

    const handlePointerUp = () => {
      dragging.current = false
      setIsDragging(false)
      setDragOffset(0)
      onResizeEnd?.()
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }, [direction, getSvgScale, onResize, onResizeEnd, onResizeStart])

  if (direction === 'horizontal') {
    return (
      <g>
        {/* Ghost line during drag */}
        {isDragging && (
          <line
            x1={x + dragOffset}
            y1={y}
            x2={x + dragOffset}
            y2={y + length}
            stroke="#5c6aff"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            opacity={0.7}
          />
        )}
        {/* Handle */}
        <rect
          x={x - HANDLE_SIZE / 2}
          y={y}
          width={HANDLE_SIZE}
          height={length}
          fill="#5c6aff"
          fillOpacity={isDragging ? 0.25 : 0}
          className="cursor-col-resize hover:fill-opacity-20"
          onPointerDown={handlePointerDown}
        />
      </g>
    )
  }

  return (
    <g>
      {/* Ghost line during drag */}
      {isDragging && (
        <line
          x1={x}
          y1={y + dragOffset}
          x2={x + length}
          y2={y + dragOffset}
          stroke="#5c6aff"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          opacity={0.7}
        />
      )}
      {/* Handle */}
      <rect
        x={x}
        y={y - HANDLE_SIZE / 2}
        width={length}
        height={HANDLE_SIZE}
        fill="#5c6aff"
        fillOpacity={isDragging ? 0.25 : 0}
        className="cursor-row-resize hover:fill-opacity-20"
        onPointerDown={handlePointerDown}
      />
    </g>
  )
}
