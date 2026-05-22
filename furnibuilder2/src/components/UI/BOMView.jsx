import { useMemo, useState } from 'react'
import { useDesignStore } from '../../store/designStore'
import { calculatePieces } from '../../utils/moduleEngine'
import { generateBOM } from '../../utils/generateBOM'
import { optimizeCuts } from '../../utils/optimizeCuts'
import { analyzeStructure } from '../../utils/structuralEngine'
import { MATERIAL_LABELS } from '../../data/moduleCatalog'
import { theme } from '../../styles/theme'
import BoardDiagram from './BoardDiagram'
import ExportButton from './ExportButton'
import PiecePreview from './PiecePreview'

const STANDARD_BOARD = { w: 1830, h: 2440 }

/** Format dimension: integer if whole, otherwise 1 decimal */
const fmt = (n) => Number.isInteger(n) ? n : Math.round(n * 10) / 10

export default function BOMView({ isMobile }) {
  const modules = useDesignStore((s) => s.modules)
  const design = useDesignStore((s) => s.design)
  const setView = useDesignStore((s) => s.setView)
  const [highlightedCut, setHighlightedCut] = useState(null)

  const pieces = useMemo(() => calculatePieces(modules, design), [modules, design])
  const bom = useMemo(
    () => generateBOM(pieces, design, design.selectedAccessories),
    [pieces, design]
  )
  const optimization = useMemo(() => optimizeCuts(bom.cuts), [bom.cuts])
  const structural = useMemo(() => analyzeStructure(modules, design), [modules, design])

  // Merge edge banding into hardware from structural additions
  const allHardware = useMemo(() => {
    const hw = [...bom.hardware]
    const edgeBanding = structural.additions?.find((a) => a.item?.includes('Canto'))
    if (edgeBanding) {
      hw.push({
        id: 'canto-melamina',
        name: edgeBanding.item,
        qty: edgeBanding.qty,
        unit: edgeBanding.unit,
      })
    }
    return hw
  }, [bom.hardware, structural.additions])

  // Only real warnings (not edge banding additions)
  const notes = useMemo(() => {
    return structural.warnings || []
  }, [structural.warnings])

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '100%', background: theme.bg.base, overflow: isMobile ? 'auto' : undefined }}>
      {/* Left: Main list */}
      <div style={{ flex: isMobile ? 'none' : '0 0 60%', overflow: isMobile ? 'visible' : 'auto', padding: isMobile ? '16px' : '24px 32px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <button
            onClick={() => setView('designer')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: theme.accent.blue, fontSize: 13,
            }}
          >← Volver al diseño</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: theme.text.muted }}>
              {bom.totalPieces} piezas · {optimization.totalBoards} tablero{optimization.totalBoards !== 1 ? 's' : ''}
            </span>
            <ExportButton bom={bom} optimization={optimization} />
          </div>
        </div>

        {/* Parameters (fixed reference) */}
        <div style={{
          background: theme.bg.elevated, border: `1px solid ${theme.bg.border}`,
          borderRadius: 8, padding: '10px 16px', marginBottom: 24,
        }}>
          <p style={{ fontSize: 11, color: theme.text.muted, marginBottom: 6, letterSpacing: 0.5 }}>
            PARÁMETROS DEL CÁLCULO
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: theme.text.primary }}>
            <span>Grosor: <strong>{design.thickness}mm</strong></span>
            <span>Fondo: <strong>{design.backThickness}mm</strong></span>
            <span>Profundidad: <strong>{design.depth}mm</strong></span>
            <span>Montaje: <strong>{design.doorMount === 'overlay' ? 'Overlay' : 'Inset'}</strong></span>
            <span>Correderas: <strong>{design.sliderClearance}mm</strong></span>
            <span>Holgura: <strong>{design.doorClearance}mm</strong></span>
            <span>Material: <strong>{MATERIAL_LABELS[design.material] || design.material}</strong></span>
          </div>
        </div>

        {/* Cuts */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 11, fontWeight: 600, color: theme.text.muted, marginBottom: 10, letterSpacing: 0.5 }}>
            LISTA DE CORTES
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {bom.cuts.map((cut, i) => (
              <div
                key={i}
                onMouseEnter={() => setHighlightedCut(i)}
                onMouseLeave={() => setHighlightedCut(null)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', borderRadius: 6,
                  background: highlightedCut === i ? `${theme.accent.orange}15` : theme.bg.elevated,
                  border: `1px solid ${highlightedCut === i ? theme.accent.orange : theme.bg.border}`,
                  cursor: 'default', transition: 'all 120ms',
                }}
              >
                <div>
                  <span style={{ fontSize: 13, color: theme.text.primary, fontWeight: 500 }}>
                    {cut.label}
                  </span>
                  <span style={{ fontSize: 13, color: theme.text.muted, marginLeft: 8 }}>
                    {fmt(cut.cutW)} × {fmt(cut.cutH)} mm
                  </span>
                  {cut.thickness !== design.thickness && (
                    <span style={{ fontSize: 12, color: theme.text.muted, marginLeft: 6 }}>
                      · {cut.thickness}mm
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 13, color: theme.accent.yellow, fontWeight: 600 }}>
                  ×{cut.qty}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Hardware */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 11, fontWeight: 600, color: theme.text.muted, marginBottom: 10, letterSpacing: 0.5 }}>
            HERRAJES Y ACCESORIOS
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {allHardware.map((hw, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', borderRadius: 6,
                  background: theme.bg.elevated,
                  border: `1px solid ${theme.bg.border}`,
                }}
              >
                <span style={{ fontSize: 13, color: theme.text.primary }}>{hw.name}</span>
                <span style={{ fontSize: 13, color: theme.text.secondary }}>
                  ×{hw.totalUnits || hw.qty} {hw.unit}
                </span>
              </div>
            ))}
            {allHardware.length === 0 && (
              <p style={{ fontSize: 13, color: theme.text.muted }}>Sin herrajes requeridos</p>
            )}
          </div>
        </section>

        {/* Board optimization */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 11, fontWeight: 600, color: theme.text.muted, marginBottom: 4, letterSpacing: 0.5 }}>
            OPTIMIZACIÓN DE TABLEROS
          </h2>
          <p style={{ fontSize: 12, color: theme.text.muted, marginBottom: 10 }}>
            Tablero estándar {STANDARD_BOARD.w} × {STANDARD_BOARD.h} mm
          </p>
          {optimization.boards.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {optimization.boards.map((board, i) => (
                <div key={i} style={{
                  background: theme.bg.elevated, border: `1px solid ${theme.bg.border}`,
                  borderRadius: 6, padding: 12,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: theme.text.primary, fontWeight: 500 }}>
                      Tablero {i + 1}
                    </span>
                    <span style={{ fontSize: 12, color: theme.text.secondary }}>
                      Aprovechamiento: {Math.round((board.usedArea / (STANDARD_BOARD.w * STANDARD_BOARD.h)) * 100)}%
                    </span>
                  </div>
                  <BoardDiagram board={board} />
                </div>
              ))}
              <p style={{ fontSize: 12, color: theme.text.muted }}>
                Desperdicio total: {optimization.wastePercent}%
              </p>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: theme.text.muted }}>Sin piezas para optimizar</p>
          )}
        </section>

        {/* Notes / Warnings */}
        {notes.length > 0 && (
          <section>
            <h2 style={{ fontSize: 11, fontWeight: 600, color: theme.text.muted, marginBottom: 10, letterSpacing: 0.5 }}>
              NOTAS
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {notes.map((w, i) => (
                <div key={i} style={{
                  fontSize: 13, padding: '6px 12px', borderRadius: 6,
                  background: w.severity === 'danger' ? '#ff444415' : '#ffaa0015',
                  color: w.severity === 'danger' ? '#ff6666' : '#ffcc44',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span>{w.severity === 'danger' ? '—' : '—'}</span>
                  <span>{w.message}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Right: Piece preview panel */}
      <div style={{ flex: isMobile ? 'none' : '0 0 40%' }}>
        <PiecePreview cuts={bom.cuts} highlightedIndex={highlightedCut} />
      </div>
    </div>
  )
}
