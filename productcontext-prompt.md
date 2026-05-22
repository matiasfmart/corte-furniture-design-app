# FurniBuilder 2 — Prompt de inicialización para agente

## Objetivo del producto
Web app para diseñar muebles modulares. El usuario arma el mueble
en un editor 2D de planta (panel izquierdo) y lo ve en 3D en
tiempo real (panel derecho). Al terminar obtiene la lista completa
de materiales para comprar y cortar.

Sin backend. Sin autenticación. Todo en el cliente.
El usuario nunca puede crear algo estructuralmente imposible
porque la unidad de diseño es el módulo — una caja completa,
no piezas sueltas.

---

## Stack tecnológico — NO NEGOCIABLE

- Framework: React 18 + Vite
- 3D: @react-three/fiber + @react-three/drei
- Editor 2D: SVG puro dentro de React (sin librerías externas)
- Estado global: Zustand (un solo store)
- Estilos: Tailwind CSS (dark mode por defecto)
- Exportación PDF: jsPDF (sin html2canvas)
- Animaciones UI: Framer Motion — solo transiciones de paneles
- Sin router. Sin backend. Sin base de datos.

### Instalación exacta
```bash
npm create vite@latest furnibuilder2 -- --template react
cd furnibuilder2
npm install @react-three/fiber @react-three/drei three
npm install zustand
npm install framer-motion
npm install jspdf
npm install tailwindcss @tailwindcss/vite
```

---

## Tema visual — dark CAD moderno

```js
// tailwind.config.js
colors: {
  bg: {
    base:    '#0a0a0c',   // fondo escena 3D y editor 2D
    panel:   '#111114',   // paneles laterales
    surface: '#1a1a20',   // cards, items
    border:  '#2a2a32',
  },
  accent: {
    blue:   '#5c6aff',    // selección, botones primarios
    warn:   '#f59e0b',    // advertencias estructurales
    danger: '#ef4444',    // errores estructurales
    ok:     '#22c55e',    // estructura correcta
  },
  text: {
    primary:   '#e0e0e8',
    secondary: '#888896',
    muted:     '#44444e',
  }
}
```

---

## Arquitectura de archivos — crear en este orden exacto
src/
data/
moduleCatalog.js      # tipos de módulo con configs por defecto
accessories.js        # accesorios de ferretería
store/
designStore.js        # Zustand store
utils/
moduleEngine.js       # cálculo de piezas a partir de módulos
generateBOM.js        # generador de lista de materiales
structuralEngine.js   # motor de reglas de carpintería
optimizeCuts.js       # optimización de corte en tableros
localStorage.js       # persistencia local
generatePDF.js        # exportación PDF
components/
Editor2D/
DesignEditor.jsx    # contenedor del editor 2D
ModuleRect.jsx      # un módulo como rectángulo SVG
AddButton.jsx       # botón + en los bordes
DimensionLabel.jsx  # cotas sobre el plano
SelectionPanel.jsx  # panel inferior de propiedades
Viewer3D/
FurnitureViewer.jsx # canvas R3F — solo visualización
FurnitureFloor.jsx  # suelo reactivo al tamaño del mueble
ModuleObject.jsx    # un módulo como objeto 3D
ExplodedView.jsx    # vista explosionada
ViewControls.jsx    # botones de vista (estado + renderizado)
UI/
TopBar.jsx
BOMView.jsx
ExportButton.jsx
StructuralStatus.jsx  # barra de estado estructural
hooks/
usePersistence.js
App.jsx
main.jsx

---

## Contratos de datos — respetar en todos los archivos

```js
// Módulo — unidad atómica de diseño
Module = {
  id:       string,           // uuid
  col:      number,           // columna en la grilla (0-indexed)
  row:      number,           // fila dentro de la columna (0-indexed)
  width:    number,           // mm — editable por módulo
  height:   number,           // mm — editable por módulo
  type:     ModuleType,
  config:   ModuleConfig,
  material: string,           // hereda del diseño global
}

ModuleType =
  'open'     |   // estante abierto sin puertas
  'doors'    |   // puertas batientes
  'drawers'  |   // cajones
  'mixed'        // parte cajones parte puertas

ModuleConfig = {
  // Para type='doors':
  doorType:    'single' | 'double' | 'lift-up',

  // Para type='drawers':
  drawerPreset: 'one' | 'two-equal' | 'three-equal' |
                'one-large-two-small' | 'custom',
  drawerHeights: number[],    // solo si preset='custom', mm

  // Para type='mixed':
  splitHeight:  number,       // mm desde abajo — cajones abajo, puerta arriba
  drawerPreset: string,       // preset para la sección de cajones
  doorType:     string,       // tipo para la sección de puerta
}

// Diseño completo
Design = {
  version:   '1.0',
  id:        string,
  name:      string,
  createdAt: string,          // ISO
  depth:     number,          // mm — profundidad global del mueble
  material:  MaterialType,
  thickness: 18,              // grosor de tablero — siempre 18mm
  modules:   Module[],
  selectedAccessories: string[],
}

MaterialType =
  'mdf-raw'         |   // MDF crudo — color #c8a882
  'melamine-white'  |   // Melamina blanca — color #f0ede8
  'melamine-black'  |   // Melamina negra — color #1a1a1a
  'melamine-walnut' |   // Melamina nogal — color #8B5E3C
  'melamine-wenge'      // Melamina wengué — color #2C1A0E

// Pieza estructural calculada (output de moduleEngine)
StructuralPiece = {
  id:         string,
  moduleId:   string,
  role:       PieceRole,
  dims:       { w, h, d },    // mm
  position3D: { x, y, z },   // posición absoluta en escena
  material:   string,
  isBack:     boolean,        // true → HDF 3mm
}

PieceRole =
  'lateral-left'  |
  'lateral-right' |
  'top'           |
  'base'          |
  'back'          |   // HDF 3mm
  'shelf'         |   // estante interior
  'door-left'     |
  'door-right'    |
  'door-lift'     |
  'drawer-front'  |
  'drawer-body'       // laterales + base + fondo del cajón (simplificado)
```

---

## moduleCatalog.js — tipos de módulo

```js
export const MODULE_DEFAULTS = {
  open: {
    defaultWidth:  400,
    defaultHeight: 800,
    config: {}
  },
  doors: {
    defaultWidth:  600,
    defaultHeight: 800,
    config: { doorType: 'double' }
  },
  drawers: {
    defaultWidth:  600,
    defaultHeight: 600,
    config: { drawerPreset: 'three-equal', drawerHeights: [] }
  },
  mixed: {
    defaultWidth:  600,
    defaultHeight: 900,
    config: {
      splitHeight: 400,
      drawerPreset: 'two-equal',
      doorType: 'single'
    }
  },
}

export const DESIGN_DEFAULTS = {
  depth:     400,    // mm profundidad global
  material:  'mdf-raw',
  thickness: 18,
}
```

---

## accessories.js — reutilizar del proyecto anterior

```js
[
  { id:'bisagra-cazoleta',   name:'Bisagra cazoleta 35mm',
    category:'bisagra',     ferreteria:true, unitQty:'unidad' },
  { id:'corredor-350',       name:'Corredor telescópico 350mm',
    category:'corredor',    ferreteria:true, unitQty:'par' },
  { id:'corredor-450',       name:'Corredor telescópico 450mm',
    category:'corredor',    ferreteria:true, unitQty:'par' },
  { id:'manija-barra-128',   name:'Manija barra 128mm',
    category:'manija',      ferreteria:true, unitQty:'unidad' },
  { id:'tornillo-confirmat', name:'Tornillo Confirmat 7×70mm',
    category:'tornillo',    ferreteria:true, unitQty:'caja x50' },
  { id:'taco-fisher-6',      name:'Taco fisher 6mm',
    category:'fijacion',    ferreteria:true, unitQty:'bolsa x20' },
  { id:'cantonera-metal',    name:'Cantonera metálica 90°',
    category:'fijacion',    ferreteria:true, unitQty:'unidad' },
  { id:'barral-ropero',      name:'Barral ropero redondo 25mm',
    category:'interior',    ferreteria:true, unitQty:'metro' },
  { id:'pata-regulable',     name:'Pata regulable 100-150mm',
    category:'pata',        ferreteria:true, unitQty:'unidad' },
  { id:'canto-melamina',     name:'Canto de melamina 22mm',
    category:'terminacion', ferreteria:true, unitQty:'metro' },
]
```

---

## Layout general de la UI
┌─────────────────────────────────────────────────────────────┐
│ TopBar                                                       │
│ [◆ FurniBuilder] [Diseñar][Materiales]  [Prof:400mm][Mat:▼] │
│                                         [Guardar] [PDF]     │
├──────────────────────────┬──────────────────────────────────┤
│                          │                                  │
│   Editor 2D              │   Viewer 3D                      │
│   (panel izquierdo)      │   (panel derecho)                │
│                          │                                  │
│   SVG interactivo        │   Canvas R3F                     │
│   módulos como           │   reactivo al store              │
│   rectángulos            │                                  │
│   con cotas              │   ┌─────────────────────────┐    │
│                          │   │ [○][⊞][❋]  [■][⬡]      │    │
│                          │   └─────────────────────────┘    │
│                          │   Estado: cerrado/abierto/expl.  │
│                          │   Render: sólido / CAD           │
│                          │                                  │
├──────────────────────────┴──────────────────────────────────┤
│ SelectionPanel (cuando hay módulo seleccionado)             │
│ Tipo: [doors▼]  Ancho: [600]mm  Alto: [800]mm  [Eliminar]  │
│ Config: [○ Simple] [○ Doble] [○ Abatible]                   │
├─────────────────────────────────────────────────────────────┤
│ StructuralStatus                                            │
│ ✓ Estructura correcta    (o advertencias en naranja/rojo)   │
└─────────────────────────────────────────────────────────────┘

---

## Editor 2D — spec completa

### Qué es
Un SVG que ocupa todo el panel izquierdo. Muestra los módulos
como rectángulos organizados en columnas. Las columnas se
determinan automáticamente a partir de los datos del store.

### Cómo se calculan las posiciones SVG

```js
// Cada columna tiene su propio ancho (el ancho del módulo más ancho
// en esa columna, ya que todos los módulos de una columna
// comparten el mismo ancho — el usuario ajusta el ancho
// de la columna completa, no de módulos individuales).

// La altura de cada módulo es independiente.

// columnX(col) = sum of widths of columns 0..col-1 × scale + padding
// moduleY(col, row) = sum of heights of modules in col, rows 0..row-1 × scale + padding

// scale: calculado para que el mueble completo encaje en el panel
// con márgenes de 40px en cada lado para las cotas externas.
```

### Cotas en el plano 2D

**Cotas internas** (dentro de cada módulo):
- Centradas en el rectángulo
- Formato: "600 × 800" (ancho × alto en mm)
- Font size: 11px, color: text.secondary
- Solo se muestran si el rectángulo tiene suficiente espacio
  (ancho SVG del módulo > 60px Y alto SVG > 40px)

**Cotas externas** (bordes del conjunto completo):
- Cota de ancho total: debajo del conjunto, con líneas de extensión
- Cota de alto total por columna: a la derecha de cada columna
- Cota de ancho por columna: debajo de cada columna
- Estilo: línea fina color text.muted, flecha en los extremos,
  texto centrado sobre la línea

### Interacción del Editor 2D

**Click en módulo:**
→ store.selectModule(id)
→ módulo se resalta con borde accent.blue
→ SelectionPanel aparece con sus propiedades

**Click en botón + (AddButton):**
Cada módulo tiene 4 botones + en sus bordes:
- + arriba → store.addModule('above', referenceId)
- + abajo → store.addModule('below', referenceId)
- + izquierda → store.addModule('left', referenceId)
- + derecha → store.addModule('right', referenceId)

Los botones + solo se muestran en los bordes externos del
conjunto (no entre módulos ya existentes).
Al hacer hover sobre el módulo → aparecen los + disponibles.

**Click fuera de módulos:**
→ store.clearSelection()
→ SelectionPanel se oculta

### SelectionPanel — propiedades del módulo seleccionado
Tipo:   [open▼] [doors▼] [drawers▼] [mixed▼]
Ancho:  [600] mm   ← cambia el ancho de TODA la columna
Alto:   [800] mm   ← cambia solo este módulo
[Si type='doors':]
Puerta: (○) Simple  (○) Doble  (○) Abatible
[Si type='drawers':]
Cajones:
[img: 1]  [img: 2 iguales]  [img: 3 iguales]
[img: 1 grande + 2 chicos]  [img: custom]
Si custom: campos de altura por cajón
[Si type='mixed':]
División: [400] mm desde abajo
Abajo: preset de cajones (igual que drawers)
Arriba: tipo de puerta (igual que doors)
[Botón rojo: Eliminar módulo]

Nota importante sobre el ancho:
El ancho es por columna completa. Si el usuario cambia el
ancho de un módulo, cambia el ancho de todos los módulos
de esa columna. Esto se comunica visualmente:
badge informativo "Cambia toda la columna".

---

## Viewer 3D — spec completa

### Qué es
Canvas R3F de solo lectura. No tiene interacción de diseño.
El usuario puede orbitar (click derecho + drag), hacer zoom
(scroll) y pan (click medio). Nada más.
Se recalcula completo cada vez que el store cambia.

### El suelo (FurnitureFloor)

El suelo es un plano que se adapta al tamaño del mueble:

```js
// Dimensiones del suelo:
floorWidth  = totalFurnitureWidth  + 80   // 40mm de margen por lado
floorDepth  = design.depth + 80           // 40mm de margen por lado

// El suelo siempre está en Y=0
// Centro del suelo: centro del mueble en X, depth/2 en Z

// En vista explosionada: suelo NO se renderiza
// En vista cerrada y abierta: suelo visible

// Material del suelo:
// Sólido: MeshStandardMaterial color #1a1a20, roughness 1
// CAD: invisible (el suelo no tiene sentido en vista técnica)
```

### Sistema de vistas — DOS controles independientes

**Control A — Estado del mueble** (3 opciones)
[○ Cerrado]  [⊞ Abierto]  [❋ Explosionado]

- Cerrado: mueble como queda terminado
- Abierto: puertas a 110°, cajones al 75% de su profundidad
- Explosionado: las piezas estructurales se separan en el espacio.
  Cada pieza se desplaza desde su posición original hacia afuera
  del centro del mueble. Sin suelo.

**Control B — Tipo de renderizado** (2 opciones)
[■ Sólido]  [⬡ CAD]

- Sólido: MeshStandardMaterial, color por tipo de módulo
  (ver paleta de colores por módulo más abajo)
- CAD: aristas visibles + superficies casi transparentes
  + cotas flotantes sobre el mueble

Los dos controles son combinables: 6 vistas posibles.
Los botones viven dentro del Viewer3D, en la esquina
superior derecha del panel, sobre el canvas.

### Paleta de colores por módulo (vista sólida)

```js
MODULE_COLORS = {
  open:    '#5c8aff',   // azul
  doors:   '#f5a623',   // amarillo/naranja (como madera.app)
  drawers: '#f5a623',   // igual que doors
  mixed:   '#f5a623',   // igual
  // La estructura (laterales, base, tapa, fondo):
  frame:   material === 'mdf-raw' ? '#c8a882' : materialColor,
}

// En vista sólida: la estructura del módulo (caja)
// tiene el color del material elegido.
// Las puertas y frentes de cajón tienen el color
// del tipo de módulo (amarillo en madera.app).
// Esto da la lectura visual de "caja gris + contenido amarillo"
// que hace que el mueble sea legible de un vistazo.
```

### Vista CAD — especificación de renderizado

Cada pieza se renderiza con DOS capas:

**Capa 1 — Superficie:**
MeshStandardMaterial, color #c8c8ff, opacity 0.04,
transparent true, depthWrite false

**Capa 2 — Aristas:**
LineSegments con EdgesGeometry,
color #a0a8ff, opacity 0.7, transparent true

**Cotas en vista CAD:**
Las cotas se renderizan como texto 3D flotante usando
@react-three/drei `<Text>` sobre las aristas principales:

- Ancho total del mueble: cota horizontal debajo del mueble
  en Y=-30, texto "[Xmm]", líneas de extensión verticales
- Alto de cada columna: cota vertical a la derecha
- Profundidad: cota diagonal en la arista superior derecha

Formato de cotas: números en mm, sin decimales.
Font: monospace, size: 40 (= 40mm en escena), color #a0a8ff.

### Vista Explosionada — especificación

```js
// Cada StructuralPiece se desplaza desde su posición original
// multiplicando su offset desde el centro del mueble:

explosionOffset(piece, center, factor) → position
// factor: 0 = posición normal, 1 = explosionado completo
// La animación va de factor 0 a factor 1 con useSpring de drei

// Dirección de explosión por rol:
// lateral-left:  desplazar en -X
// lateral-right: desplazar en +X
// top:           desplazar en +Y
// base:          desplazar en -Y
// back:          desplazar en -Z
// door-*:        desplazar en +Z (hacia el frente)
// drawer-front:  desplazar en +Z
// drawer-body:   desplazar en +Z + -Y (abre hacia abajo)
// shelf:         desplazar en +Y proporcional a su altura

// Sin suelo en vista explosionada.
// Fondo de la escena: bg.base (#0a0a0c) — las piezas flotan
// en negro, lo que da lectura de "desmontado en el aire".

// La cámara hace un pequeño zoom out automático al activar
// la vista explosionada para que todas las piezas quepan.
```

---

## moduleEngine.js — el motor central

```js
// Función pura — transforma Module[] en StructuralPiece[]
// Es la función más importante del sistema.

calculatePieces(modules, design) → StructuralPiece[]

// Para cada módulo, genera sus piezas estructurales
// considerando que los módulos comparten laterales
// con sus vecinos de la misma columna.

// ─── POSICIONAMIENTO EN ESCENA ──────────────────────────

// Escala: 1 unit Three.js = 1 mm

// Posición X de cada columna:
// col 0: x = 0
// col n: x = sum(widths of cols 0..n-1)

// Posición Y de cada módulo dentro de su columna:
// row 0: y = 0 (apoyado en el suelo)
// row n: y = sum(heights of modules in col, rows 0..n-1)

// Profundidad: todos los módulos tienen depth = design.depth

// ─── PIEZAS DE UN MÓDULO ────────────────────────────────

// Para un módulo en col C, row R, width W, height H, depth D:

// lateral-left:
//   Solo si no hay módulo a la izquierda en el mismo col
//   o si es el módulo más a la izquierda de su col.
//   dims: { w:18, h:H, d:D }
//   pos:  { x: colX, y: moduleY, z: 0 }

// lateral-right:
//   Solo si no hay módulo a la derecha en el mismo col.
//   dims: { w:18, h:H, d:D }
//   pos:  { x: colX + W - 18, y: moduleY, z: 0 }

// IMPORTANTE — laterales compartidos:
// Si dos módulos están en la misma columna (mismo col),
// el lateral-right del módulo inferior es el mismo
// que el lateral-left del módulo superior.
// No duplicar — generar una sola pieza con
// h = sum(heights of both modules).
// moduleEngine debe detectar este caso y generar
// laterales continuos por columna completa.

// base:
//   dims: { w: W - 36, h: 18, d: D }
//   pos:  { x: colX + 18, y: moduleY, z: 0 }

// top:
//   Solo si no hay módulo arriba en la misma columna.
//   dims: { w: W - 36, h: 18, d: D }
//   pos:  { x: colX + 18, y: moduleY + H - 18, z: 0 }

// back:
//   dims: { w: W - 36, h: H - 36, d: 3 }  ← HDF 3mm
//   pos:  { x: colX + 18, y: moduleY + 18, z: D - 3 }
//   isBack: true

// ─── PIEZAS SEGÚN TIPO ──────────────────────────────────

// type='open': solo las piezas de caja arriba descritas
// Agregar estantes si la altura > 600mm:
//   1 estante cada 400mm de altura libre

// type='doors', doorType='double':
//   door-left:  { w: (W-36)/2, h: H-36, d:18 }
//               pos: frente del módulo, z=0
//   door-right: igual, desplazado en X

// type='doors', doorType='single':
//   door-left:  { w: W-36, h: H-36, d:18 }

// type='doors', doorType='lift-up':
//   door-lift:  { w: W-36, h: H-36, d:18 }
//               eje de rotación en arista superior

// type='drawers':
//   Calcular alturas de cajones según drawerPreset:
//   'one':               [H - 36]
//   'two-equal':         [(H-36)/2, (H-36)/2]
//   'three-equal':       [(H-36)/3, (H-36)/3, (H-36)/3]
//   'one-large-two-small': [(H-36)*0.5, (H-36)*0.25, (H-36)*0.25]
//   'custom':            design.config.drawerHeights
//   Por cada cajón: drawer-front + drawer-body simplificado

// type='mixed':
//   Sección inferior (cajones): hasta splitHeight
//   Sección superior (puerta): desde splitHeight hasta H

// ─── ESTADO ABIERTO ─────────────────────────────────────

// calculatePieces retorna siempre posiciones en estado cerrado.
// El Viewer3D aplica offsets de apertura según viewState:

// viewState = 'open':
// door-left:  rotación Y = -110° (abre hacia la izquierda)
// door-right: rotación Y = +110°
// door-lift:  rotación X = -95° (abre hacia arriba)
// drawer-front + drawer-body: offset Z = -dims.d * 0.75
```

---

## designStore.js

```js
state = {
  // Diseño
  modules:    Module[],
  design:     Design,              // depth, material, name, etc.

  // UI
  selectedModuleId:  string | null,
  view:              'designer' | 'bom',
  viewState:         'closed' | 'open' | 'exploded',
  renderMode:        'solid' | 'cad',
}

actions = {
  // Módulos
  addModule(placement, referenceId)
  // placement: 'above'|'below'|'left'|'right'
  // referenceId: id del módulo de referencia
  // Crea módulo con defaults según tipo de la columna destino

  removeModule(id)
  updateModuleType(id, type)
  updateModuleWidth(id, width)
  // Actualiza TODA la columna — todos los módulos del mismo col
  updateModuleHeight(id, height)
  updateModuleConfig(id, configPatch)
  selectModule(id)
  clearSelection()

  // Diseño global
  updateDepth(depth)
  updateMaterial(material)
  renameDesign(name)

  // Vistas
  setView(view)
  setViewState(viewState)
  setRenderMode(renderMode)

  // Accesorios
  toggleAccessory(accessoryId)

  // Persistencia
  exportDesign()   → Design
  importDesign(design)
  clearDesign()
}

// Selector derivado — no guardar en state, calcular on-demand:
// getPieces(state) → StructuralPiece[]
// Llama moduleEngine.calculatePieces(state.modules, state.design)
// Usar useMemo en los componentes que lo necesiten
```

---

## generateBOM.js

```js
// Función pura — reutilizable del proyecto anterior
// con adaptaciones para el nuevo modelo

generateBOM(pieces, design, selectedAccessoryIds,
            accessoryCatalog) → BOM

BOM = {
  cuts:          CutItem[],
  hardware:      HardwareItem[],
  accessories:   AccessoryItem[],
  optimization:  CutOptimization,
  totalPieces:   number,
  hasCustomCuts: boolean,
}

CutItem = {
  label:     string,
  width:     number,
  height:    number,
  thickness: number,    // 18 o 3
  qty:       number,
  material:  string,
  note:      string,
}

// Hardware calculado automáticamente:
// Por cada door-*: bisagras según altura
//   h <= 1000mm → 2 bisagras
//   h <= 1500mm → 3 bisagras
//   h >  1500mm → 4 bisagras
// Por cada cajón: 1 par de corredores
//   depth <= 400mm → corredor 350mm
//   depth >  400mm → corredor 450mm
// Por cada unión entre piezas → tornillos Confirmat
//   longitud <= 300mm → 2 Confirmats
//   longitud <= 600mm → 3 Confirmats
//   longitud >  600mm → 4 Confirmats
// Todo + 10% de excedente redondeado hacia arriba
```

---

## optimizeCuts.js

```js
// Función pura
// Calcula cómo distribuir los cortes en tableros enteros
// minimizando el desperdicio.

STANDARD_BOARD = { w: 1830, h: 2440 }  // mm — tablero estándar

optimizeCuts(cuts) → CutOptimization

CutOptimization = {
  boards:      BoardLayout[],    // uno por tablero necesario
  totalBoards: number,
  wastePercent: number,
}

BoardLayout = {
  boardIndex: number,
  pieces:     PlacedCut[],      // piezas ubicadas en este tablero
  usedArea:   number,           // mm²
  wasteArea:  number,           // mm²
}

PlacedCut = {
  cutItem:  CutItem,
  x:        number,             // posición en el tablero
  y:        number,
  rotated:  boolean,            // si se rotó para optimizar
}

// Algoritmo: First Fit Decreasing (FFD) simplificado
// Ordenar piezas de mayor a menor área.
// Para cada pieza, intentar ubicarla en el primer tablero
// donde quepa. Si no cabe en ninguno, abrir un tablero nuevo.
// No es óptimo matemáticamente pero es correcto y simple
// de implementar — suficiente para v1.
```

---

## structuralEngine.js

```js
// Función pura — analiza el diseño completo

analyzeStructure(modules, design) → StructuralReport

StructuralReport = {
  isOk:       boolean,
  warnings:   StructuralWarning[],
  additions:  RequiredAddition[],
}

StructuralWarning = {
  moduleId:  string | null,
  severity:  'warn' | 'danger',
  message:   string,            // en español, lenguaje simple
}

RequiredAddition = {
  item:      string,
  qty:       number,
  unit:      string,
  reason:    string,
  required:  boolean,
}

// Reglas:

// R01 — Pandeo horizontal
// Si cualquier módulo tiene width > 800mm
// → warn "El módulo de Xmm de ancho puede pandearse"
// → addition: travesaño central o cantonera

// R02 — Vuelco
// Si altura total del mueble > profundidad × 3
// → danger "El mueble requiere fijación a la pared"
// → addition: taco + tirafondo × 4, required: true

// R03 — Fondo obligatorio para rigidez
// Si algún módulo no genera pieza 'back'
// → warn "Sin fondo el módulo pierde rigidez"
// (no debería ocurrir con el engine, pero verificar)

// R04 — Altura máxima
// Si altura total > 2400mm
// → warn "Supera la altura estándar de habitación (2400mm)"

// R05 — Canto de melamina
// Calcular metros lineales de aristas expuestas
// → addition: canto de melamina, qty en metros
```

---

## StructuralStatus — barra de estado

Barra fija en la parte inferior de la UI, siempre visible.
Si isOk:
[✓ verde] Estructura correcta
Si hay warnings:
[⚠ naranja] 2 advertencias — click para ver detalle
Si hay danger:
[✗ rojo] El mueble requiere fijación a la pared · ...

Click en la barra → expande un panel con el detalle de cada
advertencia en lenguaje simple. Sin bloquear el flujo.

---

## BOMView — vista de materiales

Tab "Materiales" en el TopBar activa esta vista.
Reemplaza el Editor2D y el Viewer3D con la vista completa
del BOM.
┌──────────────────────────────────────────────────────────┐
│ [← Volver al diseño]                                     │
├─────────────────────────┬────────────────────────────────┤
│ Lista de cortes         │ Optimización de tableros       │
│ ─────────────────────   │ ──────────────────────────     │
│ Lateral columna A       │ Tablero 1 de 3                 │
│ 18 × 1800 × 400mm × 2  │ [diagrama SVG del tablero      │
│ Corte estándar ✓        │  con piezas distribuidas       │
│                         │  y colores]                    │
│ Tapa superior           │ Aprovechamiento: 78%           │
│ 564 × 18 × 400mm × 1   │                                │
│ Corte estándar ✓        │ Tablero 2 de 3...              │
├─────────────────────────┴────────────────────────────────┤
│ Hardware calculado      │ Accesorios opcionales          │
│ ──────────────────       │ ──────────────────────────     │
│ Confirmat 7×70mm × 32   │ ☐ Manija barra 128mm          │
│ Bisagra cazoleta × 8    │ ☐ Barral ropero 25mm          │
│ Corredor 350mm × 3 par  │ ☐ Pata regulable              │
├─────────────────────────┴────────────────────────────────┤
│ Advertencias estructurales:                              │
│ ⚠ Requiere fijación a pared — taco fisher × 4          │
├─────────────────────────────────────────────────────────┤
│                    [Exportar PDF]                        │
└──────────────────────────────────────────────────────────┘

---

## generatePDF.js

```js
generatePDF(params) → Promise<void>

params = {
  design:       Design,
  bom:          BOM,
  captureView:  (viewId) → Promise<string>,
  // viewId: 'solid-closed'|'solid-open'|'solid-exploded'|'cad-closed'
}

// Páginas del PDF:
// 1. Portada: nombre, fecha, resumen
// 2. Vista 3D sólida cerrada
// 3. Vista 3D sólida explosionada
// 4. Vista 3D CAD con cotas
// 5. Lista de cortes completa
// 6. Diagrama de optimización de tableros (SVG → jsPDF)
// 7. Hardware y accesorios
```

---

## localStorage.js

```js
const KEY = 'furnibuilder2_designs'

saveDesign(design)    → void
loadDesigns()         → Design[]
deleteDesign(id)      → void
getDesign(id)         → Design | null
```

---

## Fases de implementación

### Fase 1 — Datos y store
Archivos: `data/moduleCatalog.js`, `data/accessories.js`,
`store/designStore.js`
Done: `exportDesign()` retorna Design válido con modules:[]

### Fase 2 — Motor de módulos
Archivo: `utils/moduleEngine.js`
Done: `calculatePieces([mockModule], mockDesign)` retorna
array de StructuralPiece[] correcto ejecutado en consola.
Incluir tests manuales en comentarios para cada tipo de módulo.

### Fase 3 — Utils puros
Archivos: `utils/generateBOM.js`, `utils/structuralEngine.js`,
`utils/optimizeCuts.js`, `utils/localStorage.js`
Done: cada función ejecutable en consola con datos mock.

### Fase 4 — Viewer 3D base
Archivos: `components/Viewer3D/FurnitureViewer.jsx`,
`components/Viewer3D/FurnitureFloor.jsx`,
`components/Viewer3D/ViewControls.jsx`
Done: canvas oscuro, suelo reactivo al tamaño del mueble,
controles de vista visibles, cámara orbital.

### Fase 5 — Módulos en 3D
Archivo: `components/Viewer3D/ModuleObject.jsx`
Done: un módulo hardcodeado se renderiza en 3D en vista
sólida y CAD. El suelo se adapta a su tamaño.

### Fase 6 — Vista explosionada
Archivo: `components/Viewer3D/ExplodedView.jsx`
Done: las piezas se separan con animación al activar
el estado 'exploded'. Sin suelo en esa vista.

### Fase 7 — Editor 2D
Archivos: `components/Editor2D/DesignEditor.jsx`,
`components/Editor2D/ModuleRect.jsx`,
`components/Editor2D/AddButton.jsx`,
`components/Editor2D/DimensionLabel.jsx`,
`components/Editor2D/SelectionPanel.jsx`
Done: se pueden agregar módulos con los botones +,
se muestran las cotas internas y externas,
SelectionPanel edita tipo, ancho y alto.

### Fase 8 — Sincronización 2D ↔ 3D
Done: cualquier cambio en el editor 2D se refleja
instantáneamente en el Viewer 3D.

### Fase 9 — TopBar y UI global
Archivo: `components/UI/TopBar.jsx`,
`components/UI/StructuralStatus.jsx`
Done: controles de profundidad y material funcionan,
barra estructural muestra estado en tiempo real.

### Fase 10 — BOM, optimización y PDF
Archivos: `components/UI/BOMView.jsx`,
`components/UI/ExportButton.jsx`,
`utils/optimizeCuts.js`, `utils/generatePDF.js`
Done: vista de materiales completa, diagrama de
optimización de tableros, PDF exportable.

### Fase 11 — Persistencia
Archivo: `hooks/usePersistence.js`
Done: diseño sobrevive F5, múltiples diseños
guardables desde TopBar.

---

## Al completar cada fase

1. Listar archivos creados o modificados
2. Confirmar criterio de done
3. Indicar qué queda para la fase siguiente
4. Esperar confirmación antes de continuar

---

## Restricciones absolutas

1. No tocar archivos de fases anteriores salvo
   extensiones mínimas explícitamente indicadas
2. utils/ son funciones puras: sin imports del store,
   sin side effects
3. El Viewer3D es de solo lectura — nunca modifica el store
4. El Editor2D nunca llama a Three.js
5. Escala 3D: 1 unit = 1 mm siempre
6. Grosor de tablero: 18mm fijo (HDF fondo: 3mm)
7. No instalar librerías no listadas sin confirmar
8. No agregar features no listadas
9. Al terminar cada fase: listar, confirmar, esperar

---

## Lo que NO construir en v1

- Texturas fotorrealistas
- Exportación a formatos CAD
- Simulación de peso/resistencia real
- Múltiples usuarios o colaboración
- Backend o autenticación
- Módulos en forma de L o no rectangulares
- Cálculo de costos de materiales
- Vista de instrucciones de armado paso a paso

Estas features son v2. No anticiparlas.