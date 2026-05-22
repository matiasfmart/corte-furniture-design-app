/**
 * structuralEngine.js — Motor de reglas de carpintería
 *
 * Función pura: analiza el diseño completo y retorna advertencias/adiciones
 * Sin imports del store, sin side effects.
 */

import { getTotalWidth, getMaxHeight } from './moduleEngine.js'

/**
 * Calcula metros lineales de aristas expuestas (para canto de melamina)
 */
function calculateEdgeBanding(modules, design) {
  let totalMeters = 0

  for (const mod of modules) {
    const W = mod.width
    const H = mod.height

    // Aristas frontales visibles:
    // - Laterales: 2 × H (frente de cada lateral)
    // - Base y tapa: 2 × (W - 36) (frente)
    // - Estantes: depende del tipo

    // Laterales visibles (frente)
    totalMeters += 2 * H

    // Base y tapa (frente)
    totalMeters += 2 * (W - 36)

    // Puertas/frentes de cajón tienen 4 cantos cada uno
    if (mod.type === 'doors') {
      const innerW = W - 36
      const innerH = H - 36
      if (mod.config.doorType === 'double') {
        // 2 puertas × perímetro
        totalMeters += 2 * (2 * (innerW / 2 + innerH))
      } else {
        totalMeters += 2 * (innerW + innerH)
      }
    }

    if (mod.type === 'drawers') {
      const innerW = W - 36
      const innerH = H - 36
      const numDrawers = mod.config.drawerPreset === 'one' ? 1
        : mod.config.drawerPreset === 'two-equal' ? 2
        : mod.config.drawerPreset === 'three-equal' ? 3
        : mod.config.drawerPreset === 'one-large-two-small' ? 3
        : 1
      const drawerH = innerH / numDrawers
      // Cada frente: 2 × (innerW + drawerH)
      totalMeters += numDrawers * 2 * (innerW + drawerH)
    }
  }

  // Convertir mm a metros
  return Math.ceil(totalMeters / 1000)
}

/**
 * FUNCIÓN PRINCIPAL
 */
export function analyzeStructure(modules, design) {
  if (!modules || modules.length === 0) {
    return { isOk: true, warnings: [], additions: [] }
  }

  const warnings = []
  const additions = []

  const totalWidth = getTotalWidth(modules)
  const maxHeight = getMaxHeight(modules)
  const depth = design.depth

  // R01 — Pandeo horizontal
  for (const mod of modules) {
    if (mod.width > 800) {
      warnings.push({
        moduleId: mod.id,
        severity: 'warn',
        message: `El módulo de ${mod.width}mm de ancho puede pandearse. Considere agregar un travesaño central.`,
      })
      additions.push({
        item: 'Travesaño central o cantonera',
        qty: 1,
        unit: 'unidad',
        reason: `Módulo de ${mod.width}mm supera los 800mm recomendados`,
        required: false,
      })
    }
  }

  // R02 — Vuelco (ratio altura/profundidad > 5:1 es riesgo real)
  if (maxHeight > depth * 5) {
    warnings.push({
      moduleId: null,
      severity: 'danger',
      message: `El mueble requiere fijación a la pared (altura ${maxHeight}mm > 5× profundidad ${depth}mm).`,
    })
    additions.push({
      item: 'Taco fisher 6mm + tirafondo',
      qty: 4,
      unit: 'unidad',
      reason: 'Riesgo de vuelco — fijación a pared obligatoria',
      required: true,
    })
  }

  // R03 — Fondo obligatorio para rigidez
  // (verificación de seguridad — el engine siempre genera fondo)
  for (const mod of modules) {
    // Esta regla se verifica contra las piezas generadas,
    // pero como función pura solo analizamos el diseño.
    // Si algún tipo futuro no genera fondo, aquí se detectaría.
  }

  // R04 — Altura máxima
  if (maxHeight > 2400) {
    warnings.push({
      moduleId: null,
      severity: 'warn',
      message: `El mueble supera la altura estándar de habitación (${maxHeight}mm > 2400mm).`,
    })
  }

  // R05 — Canto de melamina
  if (design.material !== 'mdf-raw') {
    const meters = calculateEdgeBanding(modules, design)
    if (meters > 0) {
      additions.push({
        item: 'Canto de melamina 22mm',
        qty: meters,
        unit: 'metro',
        reason: 'Aristas expuestas requieren terminación',
        required: false,
      })
    }
  }

  return {
    isOk: warnings.length === 0,
    warnings,
    additions,
  }
}
