import { useMemo } from 'react'
import { useDesignStore } from '../../store/designStore'
import { calculatePieces, getTotalWidth, getMaxHeight } from '../../utils/moduleEngine'
import { MATERIAL_COLORS } from '../../data/moduleCatalog'
import { calculateHandlePositions } from '../../utils/handlePositions'
import PieceMesh from './PieceMesh'

/**
 * Renderiza todos los módulos como objetos 3D.
 * Calcula piezas a partir del store y renderiza cada una.
 */
export default function ModuleObject() {
  const modules = useDesignStore((s) => s.modules)
  const design = useDesignStore((s) => s.design)
  const renderMode = useDesignStore((s) => s.renderMode)
  const viewState = useDesignStore((s) => s.viewState)
  const selectedModuleId = useDesignStore((s) => s.selectedModuleId)
  const selectModule = useDesignStore((s) => s.selectModule)

  const pieces = useMemo(
    () => calculatePieces(modules, design),
    [modules, design]
  )

  // Compute handle holes per piece (relative to piece center)
  const pieceHandles = useMemo(() => {
    const T = design.thickness || 18
    const handleMap = {}  // pieceId → [{x, y, z}] relative to piece center

    // Calculate column X positions
    const cols = [...new Set(modules.map((m) => m.col))].sort((a, b) => a - b)
    const colWidths = {}
    cols.forEach((col) => {
      const colMods = modules.filter((m) => m.col === col)
      colWidths[col] = Math.max(...colMods.map((m) => m.width))
    })
    const colX = {}
    let xAccum = 0
    cols.forEach((col) => {
      colX[col] = xAccum
      xAccum += colWidths[col]
    })

    modules.forEach((mod) => {
      const handles = calculateHandlePositions(mod, T)
      if (handles.length === 0) return

      // Module Y offset
      const colModules = modules.filter((m) => m.col === mod.col).sort((a, b) => a.row - b.row)
      let moduleY = 0
      for (const cm of colModules) {
        if (cm.row < mod.row) moduleY += cm.height
      }
      const modX = colX[mod.col] || 0

      // Find pieces belonging to this module that are doors or drawer fronts
      const modulePieces = pieces.filter(
        (p) => p.moduleId === mod.id &&
          (p.role === 'door-left' || p.role === 'door-right' || p.role === 'door-lift' || p.role === 'drawer-front')
      )

      handles.forEach((hp) => {
        // hp.x, hp.y in mm from module bottom-left
        const worldX = modX + hp.x
        const worldY = moduleY + hp.y

        // Find which piece contains this handle point
        for (const piece of modulePieces) {
          const px = piece.position3D.x
          const py = piece.position3D.y
          const pw = piece.dims.w
          const ph = piece.dims.h
          const pd = piece.dims.d

          if (worldX >= px && worldX <= px + pw && worldY >= py && worldY <= py + ph) {
            // Handle is relative to piece center
            const relX = worldX - px - pw / 2
            const relY = worldY - py - ph / 2
            // Z: on the front face of the piece (negative Z direction = front)
            const relZ = -pd / 2 - 0.5

            if (!handleMap[piece.id]) handleMap[piece.id] = []
            handleMap[piece.id].push([relX, relY, relZ])
            break
          }
        }
      })
    })

    return handleMap
  }, [modules, design, pieces])

  // Centro del mueble para calcular dirección de explosión
  const totalWidth = useMemo(() => getTotalWidth(modules), [modules])
  const center = useMemo(() => ({
    x: totalWidth / 2,
    y: getMaxHeight(modules) / 2,
    z: design.depth / 2,
  }), [modules, design, totalWidth])

  if (pieces.length === 0) return null

  return (
    <group scale={[-1, 1, 1]} position={[totalWidth, 0, 0]}>
      {pieces.map((piece) => (
        <PieceMesh
          key={piece.id}
          piece={piece}
          allPieces={pieces}
          renderMode={renderMode}
          viewState={viewState}
          materialType={design.material}
          center={center}
          isSelected={piece.moduleId === selectedModuleId}
          onSelect={() => selectModule(piece.moduleId)}
          handleHoles={pieceHandles[piece.id] || null}
        />
      ))}
    </group>
  )
}
