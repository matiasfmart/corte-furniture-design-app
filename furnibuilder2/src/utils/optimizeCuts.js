/**
 * optimizeCuts.js — Optimización de corte en tableros
 *
 * Función pura: distribuye cortes en tableros estándar minimizando desperdicio
 * Algoritmo: First Fit Decreasing (FFD) simplificado
 * Sin imports del store, sin side effects.
 */

const STANDARD_BOARD = { w: 1830, h: 2440 }

/**
 * Intenta ubicar una pieza en un tablero usando un enfoque de shelf packing
 */
function tryPlace(board, pieceW, pieceH) {
  // Intentar en cada shelf existente
  for (const shelf of board.shelves) {
    if (shelf.remainingW >= pieceW && shelf.h >= pieceH) {
      const x = STANDARD_BOARD.w - shelf.remainingW
      const y = shelf.y
      shelf.remainingW -= pieceW
      return { x, y, rotated: false }
    }
  }

  // Intentar crear un nuevo shelf
  const usedH = board.shelves.reduce((sum, s) => Math.max(sum, s.y + s.h), 0)
  const remainingH = STANDARD_BOARD.h - usedH

  if (remainingH >= pieceH && STANDARD_BOARD.w >= pieceW) {
    board.shelves.push({
      y: usedH,
      h: pieceH,
      remainingW: STANDARD_BOARD.w - pieceW,
    })
    return { x: 0, y: usedH, rotated: false }
  }

  return null
}

/**
 * FUNCIÓN PRINCIPAL
 * Calcula cómo distribuir los cortes en tableros enteros
 */
export function optimizeCuts(cuts) {
  if (!cuts || cuts.length === 0) {
    return {
      boards: [],
      totalBoards: 0,
      wastePercent: 0,
    }
  }

  // Expandir cuts con qty > 1 en piezas individuales
  const allPieces = []
  for (const cut of cuts) {
    for (let i = 0; i < cut.qty; i++) {
      allPieces.push({
        cutItem: cut,
        w: cut.cutW,
        h: cut.cutH,
      })
    }
  }

  // Ordenar de mayor a menor área (FFD)
  allPieces.sort((a, b) => b.w * b.h - a.w * a.h)

  const boards = []
  const boardArea = STANDARD_BOARD.w * STANDARD_BOARD.h

  for (const piece of allPieces) {
    let placed = false
    let pw = piece.w
    let ph = piece.h

    // Asegurar que las dimensiones no excedan el tablero
    if (pw > STANDARD_BOARD.w && ph > STANDARD_BOARD.w) continue
    if (ph > STANDARD_BOARD.h && pw > STANDARD_BOARD.h) continue

    // Intentar en tableros existentes
    for (const board of boards) {
      // Intentar sin rotar
      let pos = tryPlace(board, pw, ph)
      if (pos) {
        board.pieces.push({ cutItem: piece.cutItem, x: pos.x, y: pos.y, rotated: false })
        board.usedArea += pw * ph
        placed = true
        break
      }

      // Intentar rotado
      if (pw !== ph) {
        pos = tryPlace(board, ph, pw)
        if (pos) {
          board.pieces.push({ cutItem: piece.cutItem, x: pos.x, y: pos.y, rotated: true })
          board.usedArea += pw * ph
          placed = true
          break
        }
      }
    }

    // Si no cabe en ningún tablero existente, crear uno nuevo
    if (!placed) {
      const newBoard = {
        boardIndex: boards.length,
        pieces: [],
        shelves: [],
        usedArea: 0,
        wasteArea: 0,
      }

      let pos = tryPlace(newBoard, pw, ph)
      let rotated = false

      if (!pos && pw !== ph) {
        pos = tryPlace(newBoard, ph, pw)
        rotated = true
      }

      if (pos) {
        newBoard.pieces.push({ cutItem: piece.cutItem, x: pos.x, y: pos.y, rotated })
        newBoard.usedArea += pw * ph
      }

      boards.push(newBoard)
    }
  }

  // Calcular desperdicio
  let totalUsed = 0
  for (const board of boards) {
    board.wasteArea = boardArea - board.usedArea
    totalUsed += board.usedArea
    // Limpiar shelves del output
    delete board.shelves
  }

  const totalArea = boards.length * boardArea
  const wastePercent = totalArea > 0
    ? Math.round(((totalArea - totalUsed) / totalArea) * 100)
    : 0

  return {
    boards,
    totalBoards: boards.length,
    wastePercent,
  }
}
