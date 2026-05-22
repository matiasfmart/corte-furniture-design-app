/**
 * handlePositions.js — Calcula posiciones exactas de manijas/perforaciones
 *
 * Retorna un array de { x, y, type } en mm relativos al módulo (origen = esquina inferior-izquierda)
 * 
 * Estándar carpintería:
 * - Cajón: manija centrada horizontalmente, a mitad de altura del frente
 *   - 2 agujeros separados 96mm (norma europea) si el ancho > 200mm, sino 1 agujero
 * - Puerta single: 40mm desde borde opuesto a bisagras, a 38% desde arriba
 * - Puerta double: 40mm desde borde interior (donde se juntan), a 38% desde arriba
 * - Lift-up: centrada horizontalmente, 30mm desde borde inferior de la puerta
 */

const HANDLE_SPACING = 96  // mm entre agujeros (norma europea)
const DOOR_HANDLE_INSET = 40  // mm desde el borde del lado de apertura
const DOOR_HANDLE_HEIGHT_RATIO = 0.62  // desde abajo (= 0.38 desde arriba)
const LIFTUP_HANDLE_BOTTOM_OFFSET = 30  // mm desde abajo

/**
 * Calcula posiciones de manija para un módulo
 * @param {Object} module - { width, height, type, config }
 * @param {number} T - grosor del tablero (mm)
 * @returns {Array<{x: number, y: number, type: string}>} posiciones en mm desde esquina inferior-izquierda
 */
export function calculateHandlePositions(module, T) {
  const { type, config, width: W, height: H } = module
  if (!type || type === 'open') return []

  const positions = []

  if (type === 'doors') {
    const doorType = config?.doorType || 'double'
    const doorSide = config?.doorSide || 'right'

    if (doorType === 'double') {
      // Dos puertas: manija a 40mm del borde interior (centro), a 62% de altura
      const handleY = T + (H - 2 * T) * DOOR_HANDLE_HEIGHT_RATIO
      // Left door handle: from center toward left, 40mm from center edge
      positions.push({ x: W / 2 - DOOR_HANDLE_INSET, y: handleY, type: 'door' })
      // Right door handle: from center toward right, 40mm from center edge
      positions.push({ x: W / 2 + DOOR_HANDLE_INSET, y: handleY, type: 'door' })
    } else if (doorType === 'single') {
      const handleY = T + (H - 2 * T) * DOOR_HANDLE_HEIGHT_RATIO
      if (doorSide === 'left') {
        // Bisagra izquierda → manija a la derecha (40mm desde borde derecho interior)
        positions.push({ x: W - T - DOOR_HANDLE_INSET, y: handleY, type: 'door' })
      } else {
        // Bisagra derecha → manija a la izquierda (40mm desde borde izquierdo interior)
        positions.push({ x: T + DOOR_HANDLE_INSET, y: handleY, type: 'door' })
      }
    } else if (doorType === 'lift-up') {
      // Centrada horizontalmente, 30mm desde abajo de la puerta
      const handleY = T + LIFTUP_HANDLE_BOTTOM_OFFSET
      positions.push({ x: W / 2, y: handleY, type: 'lift' })
    }
  } else if (type === 'drawers') {
    const preset = config?.drawerPreset || 'three-equal'
    let fractions
    switch (preset) {
      case 'one': fractions = [1]; break
      case 'two-equal': fractions = [0.5, 0.5]; break
      case 'three-equal': fractions = [0.333, 0.334, 0.333]; break
      case 'one-large-two-small': fractions = [0.5, 0.25, 0.25]; break
      default: fractions = [0.333, 0.334, 0.333]
    }

    const innerH = H - 2 * T  // espacio interior (sin base ni tapa)
    const GAP_MM = 3
    const totalGap = GAP_MM * (fractions.length - 1)
    const availableH = innerH - totalGap

    let currentY = T  // empieza desde la base

    for (let i = 0; i < fractions.length; i++) {
      const drawerH = availableH * fractions[i]
      const centerY = currentY + drawerH / 2

      if (W - 2 * T > HANDLE_SPACING + 40) {
        // 2 agujeros separados 96mm
        positions.push({ x: W / 2 - HANDLE_SPACING / 2, y: centerY, type: 'drawer' })
        positions.push({ x: W / 2 + HANDLE_SPACING / 2, y: centerY, type: 'drawer' })
      } else {
        // 1 agujero centrado
        positions.push({ x: W / 2, y: centerY, type: 'drawer' })
      }

      currentY += drawerH + GAP_MM
    }
  }

  return positions
}
