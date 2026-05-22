export const MODULE_DEFAULTS = {
  open: {
    defaultWidth: 400,
    defaultHeight: 800,
    config: { shelves: 0 },
  },
  doors: {
    defaultWidth: 600,
    defaultHeight: 800,
    config: { doorType: 'double', shelves: 0 },
  },
  drawers: {
    defaultWidth: 600,
    defaultHeight: 600,
    config: { drawerPreset: 'three-equal', drawerHeights: [] },
  },
}

export const DESIGN_DEFAULTS = {
  depth: 400,
  material: 'mdf-raw',
  thickness: 18,
}

export const MATERIAL_COLORS = {
  'mdf-raw': '#dcc8a8',
  'melamine-white': '#f5f2ed',
  'melamine-black': '#3a3a3a',
  'melamine-walnut': '#a07050',
  'melamine-wenge': '#5c3d2e',
}

export const MATERIAL_LABELS = {
  'mdf-raw': 'MDF crudo',
  'melamine-white': 'Melamina blanca',
  'melamine-black': 'Melamina negra',
  'melamine-walnut': 'Melamina nogal',
  'melamine-wenge': 'Melamina wengué',
}
