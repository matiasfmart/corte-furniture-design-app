/**
 * localStorage.js — Persistencia local de diseños
 *
 * Función pura para operaciones CRUD en localStorage.
 * Sin imports del store, sin side effects (excepto localStorage).
 */

const KEY = 'furnibuilder2_designs'

function getStore() {
  try {
    const data = localStorage.getItem(KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function setStore(designs) {
  localStorage.setItem(KEY, JSON.stringify(designs))
}

export function saveDesign(design) {
  const designs = getStore()
  const idx = designs.findIndex((d) => d.id === design.id)
  if (idx >= 0) {
    designs[idx] = design
  } else {
    designs.push(design)
  }
  setStore(designs)
}

export function loadDesigns() {
  return getStore()
}

export function deleteDesign(id) {
  const designs = getStore().filter((d) => d.id !== id)
  setStore(designs)
}

export function getDesign(id) {
  return getStore().find((d) => d.id === id) || null
}
