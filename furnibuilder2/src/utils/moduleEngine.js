/**
 * moduleEngine.js — Motor central de cálculo de piezas estructurales
 *
 * Función pura: transforma Module[] + Design en StructuralPiece[]
 * Sin imports del store, sin side effects.
 *
 * Escala: 1 unit Three.js = 1 mm
 * Grosor tablero: 18mm | HDF fondo: 3mm
 */

const THICKNESS = 18
const BACK_THICKNESS = 3
const DEFAULT_SLIDER_CLEARANCE = 25
const DEFAULT_DOOR_CLEARANCE = 5

// Stable piece ID: based on context, not a global counter
function stableId(moduleId, role, index = 0) {
  return `${moduleId}-${role}-${index}`
}

/**
 * Calcula la posición X de una columna
 * col 0: x = 0
 * col n: x = sum(widths of cols 0..n-1)
 */
function getColumnX(modules, col) {
  const colWidths = getColumnWidths(modules)
  let x = 0
  for (let c = 0; c < col; c++) {
    x += colWidths[c] || 0
  }
  return x
}

/**
 * Obtiene el ancho de cada columna (el ancho del módulo más ancho en esa columna)
 */
function getColumnWidths(modules) {
  const widths = {}
  for (const m of modules) {
    if (widths[m.col] === undefined || m.width > widths[m.col]) {
      widths[m.col] = m.width
    }
  }
  return widths
}

/**
 * Calcula la posición Y de un módulo dentro de su columna
 * row 0: y = 0 (apoyado en el suelo)
 * row n: y = sum(heights of modules in col, rows 0..n-1)
 */
function getModuleY(modules, col, row) {
  let y = 0
  const colModules = modules
    .filter((m) => m.col === col)
    .sort((a, b) => a.row - b.row)

  for (const m of colModules) {
    if (m.row < row) {
      y += m.height
    }
  }
  return y
}

/**
 * Obtiene la altura total de una columna
 */
function getColumnHeight(modules, col) {
  return modules
    .filter((m) => m.col === col)
    .reduce((sum, m) => sum + m.height, 0)
}

/**
 * Obtiene los módulos de una columna ordenados por row
 */
function getColumnModules(modules, col) {
  return modules.filter((m) => m.col === col).sort((a, b) => a.row - b.row)
}

/**
 * Obtiene todas las columnas únicas
 */
function getColumns(modules) {
  return [...new Set(modules.map((m) => m.col))].sort((a, b) => a - b)
}

/**
 * Calcula las alturas de cajones según preset.
 * Siempre produce enteros: el último cajón absorbe el residuo de la división.
 */
function calculateDrawerHeights(availableHeight, preset, customHeights) {
  switch (preset) {
    case 'one':
      return [Math.round(availableHeight)]
    case 'two-equal': {
      const base = Math.floor(availableHeight / 2)
      return [base, availableHeight - base]
    }
    case 'three-equal': {
      const base = Math.floor(availableHeight / 3)
      return [base, base, availableHeight - base * 2]
    }
    case 'one-large-two-small': {
      const large = Math.floor(availableHeight * 0.5)
      const small = Math.floor(availableHeight * 0.25)
      return [large, small, availableHeight - large - small]
    }
    case 'custom':
      return customHeights && customHeights.length > 0
        ? customHeights
        : [Math.round(availableHeight)]
    default:
      return [Math.round(availableHeight)]
  }
}

/**
 * Genera piezas de puertas
 */
function generateDoorPieces(moduleId, config, moduleWidth, moduleHeight, colX, moduleY, depth, material, leftInset, designParams) {
  const pieces = []
  const doorType = config.doorType || 'double'
  const T = designParams.thickness
  const DC = designParams.doorClearance
  const doorMount = designParams.doorMount
  const hasLeftNeighbor = designParams.hasLeftNeighbor || false
  const hasRightNeighbor = designParams.hasRightNeighbor || false

  let doorW, doorH, posX, posY, posZ

  if (doorMount === 'overlay') {
    // Overlay: door covers the frame from outside
    posZ = -T
    posY = moduleY + DC / 2
    doorH = moduleHeight - DC

    // Calculate overlay per side:
    // External lateral: door covers full lateral face (T)
    // Shared lateral: door covers half the lateral face (T/2)
    const leftOverlay = hasLeftNeighbor ? T / 2 : T
    const rightOverlay = hasRightNeighbor ? T / 2 : T

    // Inner width between lateral inner faces
    const rightInset = T
    const innerW = moduleWidth - leftInset - rightInset

    // Effective width the doors span (inner + overlays on each side)
    const effectiveW = innerW + leftOverlay + rightOverlay

    if (doorType === 'single') {
      doorW = effectiveW - DC
    } else if (doorType === 'double') {
      doorW = Math.floor((effectiveW - 2 * DC) / 2)
    } else {
      // lift-up
      doorW = effectiveW - DC
    }

    posX = colX + leftInset - leftOverlay + DC / 2
  } else {
    // Inset: door sits inside the frame
    const topT = designParams.topT !== undefined ? designParams.topT : T
    const rightInset = T
    const innerW = moduleWidth - leftInset - rightInset
    const innerH = moduleHeight - T - topT
    posZ = 0
    posY = moduleY + T + DC / 2

    if (doorType === 'single') {
      doorW = innerW - DC
      doorH = innerH - DC
    } else if (doorType === 'double') {
      doorW = Math.floor((innerW - 2 * DC) / 2)
      doorH = innerH - DC
    } else {
      // lift-up
      doorW = innerW - DC
      doorH = innerH - DC
    }

    posX = colX + leftInset + DC / 2
  }

  if (doorType === 'single') {
    const side = config.doorSide === 'left' ? 'door-left' : 'door-right'
    pieces.push({
      id: stableId(moduleId, side),
      moduleId,
      role: side,
      dims: { w: doorW, h: doorH, d: T },
      position3D: { x: posX, y: posY, z: posZ },
      material,
      isBack: false,
    })
  } else if (doorType === 'double') {
    pieces.push({
      id: stableId(moduleId, 'door-left'),
      moduleId,
      role: 'door-left',
      dims: { w: doorW, h: doorH, d: T },
      position3D: { x: posX, y: posY, z: posZ },
      material,
      isBack: false,
    })
    pieces.push({
      id: stableId(moduleId, 'door-right'),
      moduleId,
      role: 'door-right',
      dims: { w: doorW, h: doorH, d: T },
      position3D: { x: posX + doorW + DC, y: posY, z: posZ },
      material,
      isBack: false,
    })
  } else if (doorType === 'lift-up') {
    pieces.push({
      id: stableId(moduleId, 'door-lift'),
      moduleId,
      role: 'door-lift',
      dims: { w: doorW, h: doorH, d: T },
      position3D: { x: posX, y: posY, z: posZ },
      material,
      isBack: false,
    })
  }

  return pieces
}

/**
 * Genera piezas de cajones
 */
function generateDrawerPieces(moduleId, config, moduleWidth, sectionHeight, colX, sectionY, depth, material, leftInset, designParams) {
  const pieces = []
  const preset = config.drawerPreset || 'three-equal'
  const T = designParams.thickness
  const BT = designParams.backThickness
  const SC = designParams.sliderClearance
  const DC = designParams.doorClearance
  const doorMount = designParams.doorMount
  const hasLeftNeighbor = designParams.hasLeftNeighbor || false
  const hasRightNeighbor = designParams.hasRightNeighbor || false
  const GAP = 3 // mm gap between drawer fronts

  const numDrawers = calculateDrawerHeights(sectionHeight, preset, config.drawerHeights).length
  const totalGap = GAP * (numDrawers - 1)
  const drawerHeights = calculateDrawerHeights(sectionHeight - totalGap, preset, config.drawerHeights)

  // Inner width between lateral inner faces
  const rightInset = T
  const innerW = moduleWidth - leftInset - rightInset

  // Drawer front dimensions (same overlay logic as doors)
  let frontW, frontStartX

  if (doorMount === 'overlay') {
    const leftOverlay = hasLeftNeighbor ? T / 2 : T
    const rightOverlay = hasRightNeighbor ? T / 2 : T
    const effectiveW = innerW + leftOverlay + rightOverlay
    frontW = effectiveW - DC
    frontStartX = colX + leftInset - leftOverlay + DC / 2
  } else {
    frontW = innerW - DC
    frontStartX = colX + leftInset + DC / 2
  }

  // Drawer body internal dimensions (always inside the frame)
  const bodyW = innerW - SC   // subtract slider clearance
  const bodyD = depth - T - BT - 50  // 50mm gap to back

  let currentY = sectionY

  for (let i = 0; i < drawerHeights.length; i++) {
    const dh = drawerHeights[i]

    // Frente del cajón
    const frontH = doorMount === 'overlay' ? dh : dh - DC
    const frontZ = doorMount === 'overlay' ? -T : 0
    pieces.push({
      id: stableId(moduleId, 'drawer-front', i),
      moduleId,
      role: 'drawer-front',
      dims: { w: frontW, h: frontH, d: T },
      position3D: { x: frontStartX, y: currentY, z: frontZ },
      material,
      isBack: false,
    })

    // Cuerpo simplificado del cajón (representado como una caja)
    const bodyH = dh - T
    const bodyZ = doorMount === 'overlay' ? 0 : T
    pieces.push({
      id: stableId(moduleId, 'drawer-body', i),
      moduleId,
      role: 'drawer-body',
      dims: { w: bodyW, h: bodyH > 0 ? bodyH : dh, d: bodyD > 0 ? bodyD : depth - 50 },
      position3D: { x: colX + leftInset + SC / 2, y: currentY + T / 2, z: bodyZ },
      material,
      isBack: false,
    })

    currentY += dh + GAP
  }

  return pieces
}

/**
 * FUNCIÓN PRINCIPAL
 * Transforma Module[] en StructuralPiece[]
 */
export function calculatePieces(modules, design) {
  if (!modules || modules.length === 0) return []

  const pieces = []
  const { depth, material } = design
  const T = design.thickness || THICKNESS
  const BT = design.backThickness || BACK_THICKNESS
  const SC = design.sliderClearance || DEFAULT_SLIDER_CLEARANCE
  const DC = design.doorClearance || DEFAULT_DOOR_CLEARANCE
  const doorMount = design.doorMount || 'overlay'
  const columns = getColumns(modules)

  const designParams = { thickness: T, backThickness: BT, sliderClearance: SC, doorClearance: DC, doorMount }

  // --- LATERALES CONTINUOS POR COLUMNA ---
  // Los laterales son continuos para toda la columna (no por módulo)
  for (const col of columns) {
    const colModules = getColumnModules(modules, col)
    const colX = getColumnX(modules, col)
    const colHeight = getColumnHeight(modules, col)
    const colWidth = colModules[0].width // Todos tienen el mismo ancho en una columna

    // Lateral izquierdo de la columna
    // Solo se genera si es la primera columna (col === 0)
    // o no hay columna a la izquierda
    const hasLeftNeighbor = columns.includes(col - 1)
    if (!hasLeftNeighbor) {
      pieces.push({
        id: stableId(`col${col}`, 'lateral-left'),
        moduleId: colModules[0].id,
        role: 'lateral-left',
        dims: { w: T, h: colHeight, d: depth },
        position3D: { x: colX, y: 0, z: 0 },
        material,
        isBack: false,
      })
    }

    // Lateral derecho de la columna
    // Siempre se genera (es el lateral compartido con la columna siguiente)
    // Altura = max entre esta columna y la columna vecina derecha
    const rightNeighborCol = columns.includes(col + 1) ? col + 1 : null
    const rightColHeight = rightNeighborCol !== null
      ? getColumnHeight(modules, rightNeighborCol)
      : 0
    const sharedHeight = Math.max(colHeight, rightColHeight)
    pieces.push({
      id: stableId(`col${col}`, 'lateral-right'),
      moduleId: colModules[colModules.length - 1].id,
      role: 'lateral-right',
      dims: { w: T, h: sharedHeight, d: depth },
      position3D: { x: colX + colWidth - T, y: 0, z: 0 },
      material,
      isBack: false,
    })
  }

  // --- PIEZAS POR MÓDULO ---
  for (const mod of modules) {
    const colX = getColumnX(modules, mod.col)
    const moduleY = getModuleY(modules, mod.col, mod.row)
    const W = mod.width
    const H = mod.height
    const D = depth

    // Determinar si esta columna comparte lateral izquierdo con vecino
    const hasLeftNeighbor = columns.includes(mod.col - 1)
    const hasRightNeighbor = columns.includes(mod.col + 1)
    const hasModuleAbove = modules.some(
      (m) => m.col === mod.col && m.row === mod.row + 1
    )

    // Ajustar ancho interior y offset X según laterales compartidos
    const leftInset = hasLeftNeighbor ? 0 : T
    const rightInset = T  // siempre tiene lateral derecho propio
    const innerWidth = W - leftInset - rightInset
    const innerX = colX + leftInset
    const topT = hasModuleAbove ? 0 : T  // 0 si no hay tapa propia
    const innerHeight = H - T - topT

    // Base del módulo
    pieces.push({
      id: stableId(mod.id, 'base'),
      moduleId: mod.id,
      role: 'base',
      dims: { w: innerWidth, h: T, d: D },
      position3D: { x: innerX, y: moduleY, z: 0 },
      material,
      isBack: false,
    })

    // Tapa — solo si no hay módulo arriba en la misma columna
    if (!hasModuleAbove) {
      pieces.push({
        id: stableId(mod.id, 'top'),
        moduleId: mod.id,
        role: 'top',
        dims: { w: innerWidth, h: T, d: D },
        position3D: { x: innerX, y: moduleY + H - T, z: 0 },
        material,
        isBack: false,
      })
    }

    // Fondo (HDF)
    // Si no hay tapa (módulo arriba), el fondo se extiende hasta el tope
    const backHeight = hasModuleAbove ? H - T : H - 2 * T
    pieces.push({
      id: stableId(mod.id, 'back'),
      moduleId: mod.id,
      role: 'back',
      dims: { w: innerWidth, h: backHeight, d: BT },
      position3D: { x: innerX, y: moduleY + T, z: D - BT },
      material,
      isBack: true,
    })

    // --- PIEZAS SEGÚN TIPO ---
    switch (mod.type) {
      case 'open': {
        // Estantes configurables (default 0)
        const numShelves = mod.config.shelves || 0
        if (numShelves > 0) {
          for (let s = 1; s <= numShelves; s++) {
            const shelfY = moduleY + T + s * (innerHeight / (numShelves + 1))
            pieces.push({
              id: stableId(mod.id, 'shelf', s),
              moduleId: mod.id,
              role: 'shelf',
              dims: { w: innerWidth, h: T, d: D - BT - 10 },
              position3D: { x: innerX, y: shelfY, z: 0 },
              material,
              isBack: false,
            })
          }
        }
        break
      }

      case 'doors': {
        generateDoorPieces(
          mod.id, mod.config, W, H,
          colX, moduleY, D, material, leftInset, { ...designParams, topT, hasLeftNeighbor, hasRightNeighbor }
        ).forEach((p) => pieces.push(p))
        // Estantes configurables detrás de las puertas
        const doorShelves = mod.config.shelves || 0
        if (doorShelves > 0) {
          // In inset mode, door occupies T depth at front — shelf must sit behind it
          const shelfZ = doorMount === 'inset' ? T : 0
          const shelfD = D - BT - 10 - (doorMount === 'inset' ? T : 0)
          for (let s = 1; s <= doorShelves; s++) {
            const shelfY = moduleY + T + s * (innerHeight / (doorShelves + 1))
            pieces.push({
              id: stableId(mod.id, 'shelf', s),
              moduleId: mod.id,
              role: 'shelf',
              dims: { w: innerWidth, h: T, d: shelfD },
              position3D: { x: innerX, y: shelfY, z: shelfZ },
              material,
              isBack: false,
            })
          }
        }
        break
      }

      case 'drawers': {
        generateDrawerPieces(
          mod.id, mod.config, W, innerHeight,
          colX, moduleY + T, D, material, leftInset, { ...designParams, topT, hasLeftNeighbor, hasRightNeighbor }
        ).forEach((p) => pieces.push(p))
        break
      }


    }
  }

  return pieces
}

/**
 * Calcula el ancho total del mueble
 */
export function getTotalWidth(modules) {
  if (!modules || modules.length === 0) return 0
  const widths = getColumnWidths(modules)
  return Object.values(widths).reduce((sum, w) => sum + w, 0)
}

/**
 * Calcula la altura máxima del mueble
 */
export function getMaxHeight(modules) {
  if (!modules || modules.length === 0) return 0
  const columns = getColumns(modules)
  let maxH = 0
  for (const col of columns) {
    const h = getColumnHeight(modules, col)
    if (h > maxH) maxH = h
  }
  return maxH
}

// ─── TESTS MANUALES ──────────────────────────────────────────────────

/*
// Test 1: Módulo open simple
const testDesign = { depth: 400, material: 'mdf-raw', thickness: 18 }
const testOpen = [{
  id: 'mod-1', col: 0, row: 0, width: 600, height: 800,
  type: 'open', config: {}, material: 'mdf-raw'
}]
console.log('--- Test OPEN ---')
console.log(JSON.stringify(calculatePieces(testOpen, testDesign), null, 2))
// Esperado: lateral-left, lateral-right, base, top, back, 1 shelf (innerH=764 > 600)

// Test 2: Módulo doors doble
const testDoors = [{
  id: 'mod-2', col: 0, row: 0, width: 600, height: 800,
  type: 'doors', config: { doorType: 'double' }, material: 'mdf-raw'
}]
console.log('--- Test DOORS ---')
console.log(JSON.stringify(calculatePieces(testDoors, testDesign), null, 2))
// Esperado: lateral-left, lateral-right, base, top, back, door-left, door-right

// Test 3: Módulo drawers con 3 cajones iguales
const testDrawers = [{
  id: 'mod-3', col: 0, row: 0, width: 600, height: 600,
  type: 'drawers', config: { drawerPreset: 'three-equal', drawerHeights: [] },
  material: 'mdf-raw'
}]
console.log('--- Test DRAWERS ---')
console.log(JSON.stringify(calculatePieces(testDrawers, testDesign), null, 2))
// Esperado: lateral-left, lateral-right, base, top, back,
//           3× drawer-front, 3× drawer-body

// Test 4: Dos módulos apilados (laterales compartidos)
const testStacked = [
  { id: 'mod-5a', col: 0, row: 0, width: 600, height: 400,
    type: 'open', config: {}, material: 'mdf-raw' },
  { id: 'mod-5b', col: 0, row: 1, width: 600, height: 400,
    type: 'doors', config: { doorType: 'single' }, material: 'mdf-raw' },
]
console.log('--- Test STACKED ---')
console.log(JSON.stringify(calculatePieces(testStacked, testDesign), null, 2))
// Esperado: 1 lateral-left (h=800), 1 lateral-right (h=800)
// No se duplican laterales. La tapa solo en el módulo superior.

// Test 6: Dos columnas lado a lado
const testTwoCols = [
  { id: 'mod-6a', col: 0, row: 0, width: 400, height: 800,
    type: 'open', config: {}, material: 'mdf-raw' },
  { id: 'mod-6b', col: 1, row: 0, width: 600, height: 800,
    type: 'doors', config: { doorType: 'double' }, material: 'mdf-raw' },
]
console.log('--- Test TWO COLUMNS ---')
console.log(JSON.stringify(calculatePieces(testTwoCols, testDesign), null, 2))
// Esperado: col0 lateral-left + lateral-right, col1 lateral-right
// (col1 no genera lateral-left porque col0 ya tiene lateral-right en esa posición)
// Nota: el lateral-right de col0 y lateral-left de col1 comparten posición X
*/
