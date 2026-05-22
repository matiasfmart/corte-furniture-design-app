/**
 * generateBOM.js — Generador de lista de materiales (Bill of Materials)
 *
 * Función pura: transforma StructuralPiece[] + Design en BOM completo
 * Sin imports del store, sin side effects.
 */

/**
 * Agrupa piezas iguales (mismo material, mismas dimensiones, mismo rol)
 */
function groupCuts(pieces) {
  const groups = {}

  for (const piece of pieces) {
    const cutDims = getCutDimensions(piece)
    // Thickness is the dimension NOT included in the cut rectangle
    const thickness = piece.isBack ? piece.dims.d : getThicknessFromPiece(piece)

    const key = `${piece.role}|${cutDims.cutW}|${cutDims.cutH}|${thickness}|${piece.material}`

    if (!groups[key]) {
      groups[key] = {
        label: getRoleLabel(piece.role),
        cutW: cutDims.cutW,
        cutH: cutDims.cutH,
        thickness,
        qty: 0,
        material: piece.material,
        note: piece.isBack ? `HDF ${thickness}mm` : 'Corte estándar',
      }
    }
    groups[key].qty++
  }

  return Object.values(groups)
}

/**
 * Determina las 2 dimensiones de corte de una pieza (excl. grosor).
 * El grosor es siempre la dimensión que corresponde al espesor del tablero.
 */
function getCutDimensions(piece) {
  const { w, h, d } = piece.dims
  const role = piece.role

  // Laterales: el grosor es w (18mm), corte = h × d
  if (role === 'lateral-left' || role === 'lateral-right') {
    return { cutW: h, cutH: d }
  }
  // Tapa, base, estante: el grosor es h (18mm), corte = w × d
  if (role === 'top' || role === 'base' || role === 'shelf') {
    return { cutW: w, cutH: d }
  }
  // Fondo: el grosor es d (3mm), corte = w × h
  if (role === 'back') {
    return { cutW: w, cutH: h }
  }
  // Puertas: el grosor es d (18mm), corte = w × h
  if (role === 'door-left' || role === 'door-right' || role === 'door-lift') {
    return { cutW: w, cutH: h }
  }
  // Frente cajón: el grosor es d (18mm), corte = w × h
  if (role === 'drawer-front') {
    return { cutW: w, cutH: h }
  }
  // Cuerpo cajón: es un compuesto, usar las 2 mayores
  const sorted = [w, h, d].sort((a, b) => b - a)
  return { cutW: sorted[0], cutH: sorted[1] }
}

/**
 * Obtiene el grosor de tablero de una pieza según su rol
 */
function getThicknessFromPiece(piece) {
  const { w, h, d } = piece.dims
  const role = piece.role
  if (role === 'lateral-left' || role === 'lateral-right') return w
  if (role === 'top' || role === 'base' || role === 'shelf') return h
  if (role === 'door-left' || role === 'door-right' || role === 'door-lift') return d
  if (role === 'drawer-front') return d
  // fallback: smallest dimension
  return Math.min(w, h, d)
}

function getRoleLabel(role) {
  const labels = {
    'lateral-left': 'Lateral izquierdo',
    'lateral-right': 'Lateral derecho',
    'top': 'Tapa superior',
    'base': 'Base',
    'back': 'Fondo (HDF)',
    'shelf': 'Estante',
    'door-left': 'Puerta izquierda',
    'door-right': 'Puerta derecha',
    'door-lift': 'Puerta abatible',
    'drawer-front': 'Frente de cajón',
    'drawer-body': 'Cuerpo de cajón',
  }
  return labels[role] || role
}

/**
 * Calcula bisagras necesarias según altura de puerta y tipo de bisagra
 */
function calculateHinges(pieces, hingeType) {
  const doors = pieces.filter((p) =>
    p.role === 'door-left' || p.role === 'door-right' || p.role === 'door-lift'
  )

  if (doors.length === 0) return []

  if (hingeType === 'piano') {
    // Bisagra de piano: una por puerta, largo = alto puerta
    return doors.map((door) => ({
      name: 'Bisagra de piano',
      qty: 1,
      spec: `largo ${Math.round(door.dims.h)}mm`,
      note: 'Cortar a medida en ferretería',
    }))
  }

  // Cazoleta estándar o soft-close
  let totalQty = 0
  for (const door of doors) {
    const h = door.dims.h
    if (h <= 900) totalQty += 2
    else if (h <= 1400) totalQty += 3
    else if (h <= 1800) totalQty += 4
    else totalQty += 5
  }

  const name = hingeType === 'soft-close'
    ? 'Bisagra cazoleta soft-close 35mm'
    : 'Bisagra cazoleta estándar 35mm'

  return [{ name, qty: totalQty, spec: '35mm', note: '' }]
}

/**
 * Calcula corredores necesarios según profundidad y tipo
 */
function calculateSliders(pieces, depth, sliderClearance) {
  const drawers = pieces.filter((p) => p.role === 'drawer-front')
  const qty = drawers.length

  if (qty === 0) return []

  const sliderLength = depth <= 400 ? 350 : 450
  const typeName = sliderClearance <= 17
    ? 'Corredera cajón estándar'
    : 'Corredera telescópica'

  return [{
    name: `${typeName} ${sliderLength}mm`,
    qty,
    spec: `par ${sliderLength}mm`,
    note: sliderClearance <= 17
      ? 'Corredera económica — espacio lateral 17mm total'
      : 'Corredera telescópica — espacio lateral 25mm total',
  }]
}

/**
 * Calcula tornillos Confirmat según uniones y grosor
 */
function calculateConfirmats(pieces, thickness) {
  const horizontals = pieces.filter((p) =>
    ['base', 'top', 'shelf'].includes(p.role)
  )

  let totalConfirmats = 0

  for (const h of horizontals) {
    const length = h.dims.w
    let confirmatsPerSide
    if (length <= 300) confirmatsPerSide = 2
    else if (length <= 600) confirmatsPerSide = 3
    else confirmatsPerSide = 4

    // 2 lados (izquierdo y derecho)
    totalConfirmats += confirmatsPerSide * 2
  }

  // Spec depends on thickness
  let spec
  if (thickness <= 12) spec = '5×50mm'
  else if (thickness <= 15) spec = '7×60mm'
  else spec = '7×70mm'

  return { qty: totalConfirmats, spec }
}

/**
 * Calcula ángulos metálicos para estantes largos
 */
function calculateShelfAngles(pieces) {
  const shelves = pieces.filter((p) => p.role === 'shelf')
  let qty = 0
  for (const s of shelves) {
    if (s.dims.w > 600) qty += 2
  }
  return qty
}

/**
 * Aplica 10% de excedente redondeado hacia arriba
 */
function withExcess(qty) {
  return Math.ceil(qty * 1.1)
}

/**
 * FUNCIÓN PRINCIPAL
 */
export function generateBOM(pieces, design, selectedAccessoryIds, accessoryCatalog) {
  if (!pieces || pieces.length === 0) {
    return {
      cuts: [],
      hardware: [],
      accessories: [],
      optimization: null,
      totalPieces: 0,
      hasCustomCuts: false,
    }
  }

  const thickness = design.thickness || 18
  const sliderClearance = design.sliderClearance || 25
  const hingeType = design.hingeType || 'clip-on'

  // --- Cortes ---
  const cuts = groupCuts(pieces)

  // --- Hardware ---
  const hardware = []

  // Bisagras
  const hingeItems = calculateHinges(pieces, hingeType)
  for (const item of hingeItems) {
    hardware.push({
      id: `bisagra-${hingeType}`,
      name: item.name,
      qty: withExcess(item.qty),
      unit: hingeType === 'piano' ? 'unidad' : 'unidad',
      note: item.note,
      spec: item.spec,
    })
  }

  // Corredores
  const sliderItems = calculateSliders(pieces, design.depth, sliderClearance)
  for (const item of sliderItems) {
    hardware.push({
      id: 'corredor',
      name: item.name,
      qty: withExcess(item.qty),
      unit: 'par',
      note: item.note,
      spec: item.spec,
    })
  }

  // Confirmats
  const confirmats = calculateConfirmats(pieces, thickness)
  if (confirmats.qty > 0) {
    const boxes = Math.ceil(withExcess(confirmats.qty) / 50)
    hardware.push({
      id: 'tornillo-confirmat',
      name: `Tornillo Confirmat ${confirmats.spec}`,
      qty: boxes,
      unit: 'caja x50',
      totalUnits: withExcess(confirmats.qty),
    })
  }

  // Ángulos metálicos para estantes
  const shelfAngles = calculateShelfAngles(pieces)
  if (shelfAngles > 0) {
    hardware.push({
      id: 'angulo-metalico',
      name: 'Ángulo metálico de unión 40×40mm',
      qty: withExcess(shelfAngles),
      unit: 'unidad',
      note: 'Fija el estante sin tornillos visibles desde exterior',
    })
  }

  // --- Accesorios opcionales ---
  const accessories = (selectedAccessoryIds || [])
    .map((id) => {
      const acc = (accessoryCatalog || []).find((a) => a.id === id)
      if (!acc) return null
      return { ...acc, qty: 1 }
    })
    .filter(Boolean)

  return {
    cuts,
    hardware,
    accessories,
    optimization: null, // se calcula con optimizeCuts
    totalPieces: pieces.length,
    hasCustomCuts: cuts.some((c) => !c.note.startsWith('Corte estándar') && !c.note.startsWith('HDF')),
  }
}
