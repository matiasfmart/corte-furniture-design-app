// src/styles/theme.js — Variables de color globales (Gruvbox-inspired)

export const theme = {
  // Fondos
  bg: {
    hard:    '#1d2021',   // panels, topbar
    base:    '#282828',   // fondo principal
    soft:    '#32302f',   // cards, áreas de trabajo
    elevated:'#3c3836',   // superficies elevadas, inputs
    border:  '#504945',   // bordes generales
    borderStrong: '#665c54', // bordes con más peso
  },

  // Texto
  text: {
    primary:   '#ebdbb2',  // texto principal — crema cálido
    secondary: '#a89984',  // texto secundario
    muted:     '#665c54',  // texto muted
    disabled:  '#504945',
  },

  // Acentos
  accent: {
    orange:  '#d65d0e',   // acento principal
    yellow:  '#d79921',   // acento secundario / dorado
    aqua:    '#689d6a',   // positivo / estructura
    blue:    '#458588',   // info / neutro
    purple:  '#b16286',   // especial
    red:     '#cc241d',   // danger
    // Versiones suaves para backgrounds
    orangeSoft: '#d65d0e22',
    yellowSoft: '#d7992122',
    aquaSoft:   '#689d6a22',
    blueSoft:   '#45858822',
  },

  // Módulos 2D — borde por tipo
  module: {
    open:    '#665c54',   // gris cálido muted — vacío
    doors:   '#d65d0e',   // naranja — puertas
    drawers: '#d79921',   // dorado — cajones
  },

  // 3D — colores de piezas (no cambian)
  piece: {
    structure: '#4a90d9',
    top:       '#3dbf7a',
    door:      '#f5a623',
    drawerFront: '#f5a623',
    drawerBody:  '#b0b8c8',
    shelf:     '#b0b8c8',
    back:      '#2a5a8a',
  },
}
