/**
 * ExplodedView.jsx
 *
 * La lógica de explosión está integrada directamente en PieceMesh.jsx
 * para evitar duplicar el cálculo de posiciones.
 *
 * Cuando viewState === 'exploded':
 * - Cada pieza se desplaza desde su posición original según su rol
 * - lateral-left:  desplazar en -X
 * - lateral-right: desplazar en +X
 * - top:           desplazar en +Y
 * - base:          desplazar en -Y
 * - back:          desplazar en +Z (alejarse del frente)
 * - door-*:        desplazar en -Z (hacia el espectador)
 * - drawer-front:  desplazar en -Z
 * - drawer-body:   desplazar en -Z + -Y
 * - shelf:         desplazar en +Y proporcional a su altura
 *
 * El suelo NO se renderiza en vista explosionada (manejado por FurnitureViewer)
 * La cámara no hace zoom out automático en esta versión (el usuario puede
 * hacer scroll para ajustar).
 *
 * Este archivo existe para documentar el comportamiento y mantener
 * la arquitectura de archivos definida en el spec.
 */

export { default } from './ModuleObject'
