/**
 * generatePDF.js — Exportación a PDF del diseño
 *
 * Genera un PDF con:
 * 1. Portada: nombre, fecha, resumen
 * 2. Lista de cortes completa
 * 3. Hardware y accesorios
 * 4. Orden de armado
 * 5. Ubicación de tornillos (diagrama por pieza)
 * 6. Vistas ortográficas CAD (frente, lateral, planta)
 * 7. Optimización de tableros
 */

import { jsPDF } from 'jspdf'

const fmt = (n) => Number.isInteger(n) ? n : Math.round(n * 10) / 10

const MARGIN = 20
const PAGE_W = 210 // A4 mm
const PAGE_H = 297
const CONTENT_W = PAGE_W - 2 * MARGIN
const CONTENT_H = PAGE_H - 2 * MARGIN

// ------- Assembly order logic -------

function generateAssemblySteps(pieces, design) {
  const steps = []
  const hasDrawers = pieces.some((p) => p.role === 'drawer-body')
  const hasDoors = pieces.some((p) => p.role.startsWith('door-'))
  const hasShelves = pieces.some((p) => p.role === 'shelf')
  const hasBack = pieces.some((p) => p.role === 'back')

  if (hasDrawers) {
    steps.push({
      title: 'Armar cajones',
      description: 'Ensamblar los cuerpos de cajón por separado antes de montar el mueble. Unir laterales, fondo y base de cada cajón con tornillos de 30mm.',
    })
  }

  steps.push({
    title: 'Montar estructura principal',
    description: 'Unir las bases y tapas a los laterales con confirmats. Comenzar con un lateral apoyado en el suelo, fijar base y tapa, luego cerrar con el otro lateral.',
  })

  if (hasShelves) {
    steps.push({
      title: 'Instalar estantes',
      description: 'Colocar los estantes fijos con tornillos o soportes. Si son ajustables, instalar los soportes metálicos.',
    })
  }

  if (hasBack) {
    steps.push({
      title: 'Fijar fondo (HDF)',
      description: `Colocar el panel de HDF (${design.backThickness || 3}mm) en la parte trasera. Fijar con clavos o grapas cada 150mm en todo el perímetro.`,
    })
  }

  if (hasDrawers) {
    steps.push({
      title: 'Instalar correderas y cajones',
      description: 'Fijar las correderas a los laterales internos. Insertar los cajones armados y ajustar. Luego fijar los frentes de cajón.',
    })
  }

  if (hasDoors) {
    steps.push({
      title: 'Instalar bisagras y puertas',
      description: 'Perforar cazoletas a 35mm del borde de la puerta. Fijar bisagras y montar las puertas. Ajustar alineación con los tornillos de regulación.',
    })
  }

  return steps
}

// ------- Screw placement logic -------

function calculateScrewPositions(pieces, design) {
  const T = design.thickness || 18
  const screwSets = []

  const moduleIds = [...new Set(pieces.map((p) => p.moduleId))]

  for (const modId of moduleIds) {
    const modPieces = pieces.filter((p) => p.moduleId === modId)
    const base = modPieces.find((p) => p.role === 'base')
    const top = modPieces.find((p) => p.role === 'top')
    const shelves = modPieces.filter((p) => p.role === 'shelf')

    if (!base) continue

    const W = base.dims.w
    const D = base.dims.d

    // Confirmats on base: 2 per lateral connection (front + back)
    const baseSet = {
      piece: `Base (${fmt(W)}×${fmt(D)}mm)`,
      moduleId: modId,
      width: W,
      depth: D,
      screws: [],
    }
    baseSet.screws.push({ x: 50, y: T / 2 })
    baseSet.screws.push({ x: D - 50, y: T / 2 })
    baseSet.screws.push({ x: 50, y: W - T / 2 })
    baseSet.screws.push({ x: D - 50, y: W - T / 2 })
    if (W > 600) {
      baseSet.screws.push({ x: D / 2, y: T / 2 })
      baseSet.screws.push({ x: D / 2, y: W - T / 2 })
    }
    screwSets.push(baseSet)

    if (top) {
      screwSets.push({
        piece: `Tapa (${fmt(W)}×${fmt(D)}mm)`,
        moduleId: modId,
        width: W,
        depth: D,
        screws: baseSet.screws.map((s) => ({ ...s })),
      })
    }

    for (const shelf of shelves) {
      const shelfSet = {
        piece: `Estante (${fmt(shelf.dims.w)}×${fmt(shelf.dims.d)}mm)`,
        moduleId: modId,
        width: shelf.dims.w,
        depth: shelf.dims.d,
        screws: [],
      }
      shelfSet.screws.push({ x: 50, y: T / 2 })
      shelfSet.screws.push({ x: shelf.dims.d - 50, y: T / 2 })
      shelfSet.screws.push({ x: 50, y: shelf.dims.w - T / 2 })
      shelfSet.screws.push({ x: shelf.dims.d - 50, y: shelf.dims.w - T / 2 })
      screwSets.push(shelfSet)
    }
  }

  return screwSets
}

// ------- Orthographic views drawing -------

function drawOrthographicViews(doc, pieces, design, startY) {
  const T = design.thickness || 18
  const D = design.depth || 400
  const BT = design.backThickness || 3

  // Calculate furniture bounding box
  let maxX = 0, maxY = 0
  for (const p of pieces) {
    const pos = p.position3D
    if (!pos) continue
    const endX = pos.x + p.dims.w
    const endY = pos.y + p.dims.h
    if (endX > maxX) maxX = endX
    if (endY > maxY) maxY = endY
  }

  const totalW = maxX || 600
  const totalH = maxY || 800

  const viewW = CONTENT_W * 0.45
  const viewH = 80

  let y = startY

  // --- FRONT VIEW ---
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('VISTA FRONTAL', MARGIN, y)
  y += 5

  const frontScale = Math.min(viewW / totalW, viewH / totalH)
  const frontOffX = MARGIN + 5
  const frontOffY = y + 2

  doc.setDrawColor(80, 80, 80)
  doc.setLineWidth(0.3)

  for (const p of pieces) {
    if (!p.position3D) continue
    if (p.position3D.z > T && p.role !== 'back') continue
    if (p.role === 'back') continue
    if (p.role === 'drawer-body') continue

    const px = frontOffX + p.position3D.x * frontScale
    const py = frontOffY + (totalH - p.position3D.y - p.dims.h) * frontScale
    const pw = p.dims.w * frontScale
    const ph = p.dims.h * frontScale

    if (p.role.startsWith('door-') || p.role === 'drawer-front') {
      doc.setFillColor(230, 180, 80)
    } else {
      doc.setFillColor(200, 200, 200)
    }
    doc.rect(px, py, pw, ph, 'FD')
  }

  doc.setLineWidth(0.5)
  doc.setDrawColor(40, 40, 40)
  doc.rect(frontOffX, frontOffY, totalW * frontScale, totalH * frontScale)

  // Dimensions
  doc.setLineWidth(0.2)
  doc.setDrawColor(100, 100, 100)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  const dimY = frontOffY + totalH * frontScale + 5
  doc.line(frontOffX, dimY, frontOffX + totalW * frontScale, dimY)
  doc.text(`${fmt(totalW)}mm`, frontOffX + (totalW * frontScale) / 2 - 5, dimY + 4)
  const dimX = frontOffX + totalW * frontScale + 3
  doc.line(dimX, frontOffY, dimX, frontOffY + totalH * frontScale)
  doc.text(`${fmt(totalH)}mm`, dimX + 2, frontOffY + (totalH * frontScale) / 2, { angle: 90 })

  y += viewH + 18

  // --- SIDE VIEW ---
  if (y > PAGE_H - 100) { doc.addPage(); y = MARGIN }

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('VISTA LATERAL', MARGIN, y)
  y += 5

  const sideScale = Math.min(viewW / D, viewH / totalH)
  const sideOffX = MARGIN + 5
  const sideOffY = y + 2
  const sideW = D * sideScale
  const sideH = totalH * sideScale

  doc.setFillColor(210, 210, 210)
  doc.setDrawColor(80, 80, 80)
  doc.setLineWidth(0.3)
  doc.rect(sideOffX, sideOffY, sideW, sideH, 'FD')

  // Base
  doc.setFillColor(180, 180, 180)
  doc.rect(sideOffX, sideOffY + sideH - T * sideScale, sideW, T * sideScale, 'FD')
  // Top
  doc.rect(sideOffX, sideOffY, sideW, T * sideScale, 'FD')
  // Back
  doc.setFillColor(160, 160, 160)
  doc.rect(sideOffX + sideW - BT * sideScale, sideOffY, BT * sideScale, sideH, 'FD')

  doc.setLineWidth(0.5)
  doc.setDrawColor(40, 40, 40)
  doc.rect(sideOffX, sideOffY, sideW, sideH)

  // Dimensions
  doc.setLineWidth(0.2)
  doc.setDrawColor(100, 100, 100)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  const sideDimY = sideOffY + sideH + 5
  doc.line(sideOffX, sideDimY, sideOffX + sideW, sideDimY)
  doc.text(`${fmt(D)}mm`, sideOffX + sideW / 2 - 5, sideDimY + 4)
  const sideDimX = sideOffX + sideW + 3
  doc.line(sideDimX, sideOffY, sideDimX, sideOffY + sideH)
  doc.text(`${fmt(totalH)}mm`, sideDimX + 2, sideOffY + sideH / 2, { angle: 90 })

  y += viewH + 18

  // --- TOP VIEW ---
  if (y > PAGE_H - 100) { doc.addPage(); y = MARGIN }

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('VISTA SUPERIOR (PLANTA)', MARGIN, y)
  y += 5

  const topScale = Math.min(viewW / totalW, viewH / D)
  const topOffX = MARGIN + 5
  const topOffY = y + 2
  const topW2 = totalW * topScale
  const topH2 = D * topScale

  doc.setFillColor(210, 210, 210)
  doc.setDrawColor(80, 80, 80)
  doc.setLineWidth(0.3)
  doc.rect(topOffX, topOffY, topW2, topH2, 'FD')

  // Left lateral
  doc.setFillColor(180, 180, 180)
  if (pieces.find((p) => p.role === 'lateral-left')) {
    doc.rect(topOffX, topOffY, T * topScale, topH2, 'FD')
  }
  // Right laterals
  for (const rl of pieces.filter((p) => p.role === 'lateral-right')) {
    if (!rl.position3D) continue
    const rx = topOffX + rl.position3D.x * topScale
    doc.rect(rx, topOffY, T * topScale, topH2, 'FD')
  }
  // Back
  doc.setFillColor(160, 160, 160)
  doc.rect(topOffX, topOffY + topH2 - BT * topScale, topW2, BT * topScale, 'FD')

  doc.setLineWidth(0.5)
  doc.setDrawColor(40, 40, 40)
  doc.rect(topOffX, topOffY, topW2, topH2)

  // Dimensions
  doc.setLineWidth(0.2)
  doc.setDrawColor(100, 100, 100)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  const topDimY2 = topOffY + topH2 + 5
  doc.line(topOffX, topDimY2, topOffX + topW2, topDimY2)
  doc.text(`${fmt(totalW)}mm`, topOffX + topW2 / 2 - 5, topDimY2 + 4)
  const topDimX = topOffX + topW2 + 3
  doc.line(topDimX, topOffY, topDimX, topOffY + topH2)
  doc.text(`${fmt(D)}mm`, topDimX + 2, topOffY + topH2 / 2, { angle: 90 })

  return y + viewH + 10
}

// ------- Main PDF generation -------

export async function generatePDF({ design, bom, optimization, pieces }) {
  const doc = new jsPDF()
  let y = MARGIN

  // --- Page 1: Cover ---
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('corte', MARGIN, y + 10)
  y += 20

  doc.setFontSize(14)
  doc.text(design.name || 'Mueble sin nombre', MARGIN, y)
  y += 12

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-AR')}`, MARGIN, y)
  y += 7
  doc.text(`Material: ${design.material}`, MARGIN, y)
  y += 7
  doc.text(`Profundidad: ${design.depth}mm`, MARGIN, y)
  y += 7
  doc.text(`Módulos: ${design.modules?.length || 0}`, MARGIN, y)
  y += 7
  doc.text(`Piezas totales: ${bom.totalPieces}`, MARGIN, y)
  y += 7
  doc.text(`Tableros necesarios: ${optimization?.totalBoards || 0}`, MARGIN, y)
  y += 7
  doc.text(`Desperdicio: ${optimization?.wastePercent || 0}%`, MARGIN, y)
  y += 20

  // --- Page 2: Cut list ---
  doc.addPage()
  y = MARGIN

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Lista de Cortes', MARGIN, y)
  y += 10

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Pieza', MARGIN, y)
  doc.text('Espesor', MARGIN + 55, y)
  doc.text('Ancho', MARGIN + 75, y)
  doc.text('Alto', MARGIN + 95, y)
  doc.text('Cant.', MARGIN + 115, y)
  doc.text('Nota', MARGIN + 130, y)
  y += 6

  doc.setFont('helvetica', 'normal')
  for (const cut of bom.cuts) {
    if (y > 270) {
      doc.addPage()
      y = MARGIN
    }
    doc.text(cut.label, MARGIN, y)
    doc.text(`${cut.thickness}mm`, MARGIN + 55, y)
    doc.text(`${fmt(cut.cutW)}mm`, MARGIN + 75, y)
    doc.text(`${fmt(cut.cutH)}mm`, MARGIN + 95, y)
    doc.text(`${cut.qty}`, MARGIN + 115, y)
    doc.text(cut.note || '', MARGIN + 130, y)
    y += 5.5
  }

  // --- Hardware ---
  y += 10
  if (y > 250) { doc.addPage(); y = MARGIN }

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Herrajes y Accesorios', MARGIN, y)
  y += 10

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  for (const hw of bom.hardware) {
    if (y > 270) { doc.addPage(); y = MARGIN }
    doc.text(`${hw.name}`, MARGIN, y)
    doc.text(`× ${hw.totalUnits || hw.qty} ${hw.unit}`, MARGIN + 100, y)
    y += 5.5
  }

  if (bom.accessories && bom.accessories.length > 0) {
    y += 8
    doc.setFont('helvetica', 'bold')
    doc.text('Accesorios seleccionados', MARGIN, y)
    y += 7
    doc.setFont('helvetica', 'normal')
    for (const acc of bom.accessories) {
      doc.text(`${acc.name} × ${acc.qty}`, MARGIN, y)
      y += 5.5
    }
  }

  // --- Assembly order ---
  if (pieces && pieces.length > 0) {
    doc.addPage()
    y = MARGIN

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Orden de Armado', MARGIN, y)
    y += 12

    const steps = generateAssemblySteps(pieces, design)

    doc.setFontSize(10)
    for (let i = 0; i < steps.length; i++) {
      if (y > 260) { doc.addPage(); y = MARGIN }
      doc.setFont('helvetica', 'bold')
      doc.text(`${i + 1}. ${steps[i].title}`, MARGIN, y)
      y += 6
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      const lines = doc.splitTextToSize(steps[i].description, CONTENT_W)
      doc.text(lines, MARGIN + 5, y)
      y += lines.length * 4.5 + 8
      doc.setFontSize(10)
    }
  }

  // --- Screw placement ---
  if (pieces && pieces.length > 0) {
    doc.addPage()
    y = MARGIN

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Ubicación de Fijaciones', MARGIN, y)
    y += 6
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text('Confirmats 7×50mm — posiciones en mm desde el borde frontal', MARGIN, y)
    y += 10

    const screwSets = calculateScrewPositions(pieces, design)

    for (const set of screwSets) {
      if (y > 230) { doc.addPage(); y = MARGIN }

      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(set.piece, MARGIN, y)
      y += 5

      if (set.width && set.depth) {
        const diagScale = Math.min(60 / set.depth, 30 / set.width, 0.08)
        const diagW = set.depth * diagScale
        const diagH = set.width * diagScale
        const diagX = MARGIN + 5
        const diagY = y + 1

        doc.setDrawColor(100, 100, 100)
        doc.setLineWidth(0.4)
        doc.setFillColor(245, 245, 245)
        doc.rect(diagX, diagY, diagW, diagH, 'FD')

        doc.setFillColor(180, 50, 50)
        for (const screw of set.screws) {
          const sx = diagX + screw.x * diagScale
          const sy = diagY + screw.y * diagScale
          doc.circle(sx, sy, 0.8, 'F')
        }

        // Position labels
        doc.setFontSize(6)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(120, 120, 120)
        const shown = new Set()
        for (const screw of set.screws) {
          const key = `${fmt(screw.x)}`
          if (!shown.has(key)) {
            shown.add(key)
            const sx = diagX + screw.x * diagScale
            doc.text(`${fmt(screw.x)}`, sx - 2, diagY + diagH + 4)
          }
        }
        doc.setTextColor(0, 0, 0)

        y += diagH + 10
      } else {
        y += 4
      }
    }
  }

  // --- Orthographic views ---
  if (pieces && pieces.length > 0) {
    doc.addPage()
    y = MARGIN

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Vistas Ortográficas', MARGIN, y)
    y += 12

    y = drawOrthographicViews(doc, pieces, design, y)
  }

  // --- Optimization ---
  if (optimization && optimization.boards && optimization.boards.length > 0) {
    doc.addPage()
    y = MARGIN

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Optimización de Tableros', MARGIN, y)
    y += 10

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Tablero estándar: 1830 × 2440mm`, MARGIN, y)
    y += 6
    doc.text(`Tableros necesarios: ${optimization.totalBoards}`, MARGIN, y)
    y += 6
    doc.text(`Desperdicio total: ${optimization.wastePercent}%`, MARGIN, y)
    y += 12

    doc.setFontSize(9)
    for (const board of optimization.boards) {
      if (y > 260) { doc.addPage(); y = MARGIN }
      const usage = Math.round((board.usedArea / (1830 * 2440)) * 100)
      doc.setFont('helvetica', 'bold')
      doc.text(`Tablero ${board.boardIndex + 1} — ${usage}% aprovechamiento`, MARGIN, y)
      y += 5.5
      doc.setFont('helvetica', 'normal')
      for (const p of board.pieces) {
        if (y > 270) { doc.addPage(); y = MARGIN }
        const label = p.cutItem.label || 'Pieza'
        const rotLabel = p.rotated ? ' (rotada)' : ''
        doc.text(`  ${label} — ${p.cutItem.width}×${p.cutItem.depth || p.cutItem.height}mm${rotLabel}`, MARGIN, y)
        y += 5
      }
      y += 4
    }
  }

  // Save
  const filename = `${(design.name || 'mueble').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
}
