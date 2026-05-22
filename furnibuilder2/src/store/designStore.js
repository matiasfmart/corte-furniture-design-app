import { create } from 'zustand'
import { MODULE_DEFAULTS, DESIGN_DEFAULTS } from '../data/moduleCatalog'

function generateId() {
  return crypto.randomUUID()
}

function createModule(type, col, row, overrides = {}) {
  const defaults = MODULE_DEFAULTS[type]
  return {
    id: generateId(),
    col,
    row,
    width: defaults.defaultWidth,
    height: defaults.defaultHeight,
    type,
    config: { ...defaults.config },
    material: DESIGN_DEFAULTS.material,
    ...overrides,
  }
}

export const useDesignStore = create((set, get) => ({
  // --- State ---
  modules: [],

  design: {
    version: '1.0',
    id: generateId(),
    name: 'Nuevo mueble',
    createdAt: new Date().toISOString(),
    depth: DESIGN_DEFAULTS.depth,
    material: DESIGN_DEFAULTS.material,
    thickness: DESIGN_DEFAULTS.thickness,
    backThickness: 3,
    sliderClearance: 25,
    doorClearance: 5,
    doorMount: 'overlay',
    hingeType: 'clip-on',
    selectedAccessories: [],
  },

  selectedModuleId: null,
  view: 'designer',
  viewState: 'closed',
  openAmount: 0,
  renderMode: 'solid',

  // --- Actions: Modules ---

  addModule: (placement, referenceId) => {
    set((state) => {
      const modules = [...state.modules]

      // If no modules exist, create the first one
      if (modules.length === 0) {
        const newModule = createModule('open', 0, 0)
        return { modules: [newModule] }
      }

      const refModule = modules.find((m) => m.id === referenceId)
      if (!refModule) return state

      let newCol, newRow, type
      type = refModule.type

      if (placement === 'above') {
        newCol = refModule.col
        newRow = refModule.row + 1
        // Shift modules above
        const updated = modules.map((m) => {
          if (m.col === newCol && m.row >= newRow) {
            return { ...m, row: m.row + 1 }
          }
          return m
        })
        const newModule = createModule(type, newCol, newRow, {
          width: refModule.width,
          material: state.design.material,
        })
        return { modules: [...updated, newModule] }
      }

      if (placement === 'below') {
        newCol = refModule.col
        newRow = refModule.row
        // Shift ref and modules above
        const updated = modules.map((m) => {
          if (m.col === newCol && m.row >= newRow) {
            return { ...m, row: m.row + 1 }
          }
          return m
        })
        const newModule = createModule(type, newCol, newRow, {
          width: refModule.width,
          material: state.design.material,
        })
        return { modules: [...updated, newModule] }
      }

      if (placement === 'left') {
        newCol = refModule.col
        // Shift all modules in this col and to the right
        const updated = modules.map((m) => {
          if (m.col >= newCol) {
            return { ...m, col: m.col + 1 }
          }
          return m
        })
        const newModule = createModule(type, newCol, 0, {
          material: state.design.material,
        })
        return { modules: [...updated, newModule] }
      }

      if (placement === 'right') {
        newCol = refModule.col + 1
        // Shift all modules to the right of refCol
        const updated = modules.map((m) => {
          if (m.col >= newCol) {
            return { ...m, col: m.col + 1 }
          }
          return m
        })
        const newModule = createModule(type, newCol, 0, {
          material: state.design.material,
        })
        return { modules: [...updated, newModule] }
      }

      return state
    })
  },

  removeModule: (id) => {
    set((state) => {
      const target = state.modules.find((m) => m.id === id)
      if (!target) return state

      let modules = state.modules.filter((m) => m.id !== id)

      // Re-index rows in the same column
      const colModules = modules
        .filter((m) => m.col === target.col)
        .sort((a, b) => a.row - b.row)

      modules = modules.map((m) => {
        if (m.col === target.col) {
          const idx = colModules.findIndex((cm) => cm.id === m.id)
          return { ...m, row: idx }
        }
        return m
      })

      // If column is now empty, shift columns to the left
      const hasModulesInCol = modules.some((m) => m.col === target.col)
      if (!hasModulesInCol) {
        modules = modules.map((m) => {
          if (m.col > target.col) {
            return { ...m, col: m.col - 1 }
          }
          return m
        })
      }

      return {
        modules,
        selectedModuleId:
          state.selectedModuleId === id ? null : state.selectedModuleId,
      }
    })
  },

  updateModuleType: (id, type) => {
    set((state) => ({
      modules: state.modules.map((m) =>
        m.id === id
          ? { ...m, type, config: { ...MODULE_DEFAULTS[type].config } }
          : m
      ),
    }))
  },

  updateModuleWidth: (id, width) => {
    set((state) => {
      const target = state.modules.find((m) => m.id === id)
      if (!target) return state
      // Update ALL modules in the same column
      return {
        modules: state.modules.map((m) =>
          m.col === target.col ? { ...m, width } : m
        ),
      }
    })
  },

  updateModuleHeight: (id, height) => {
    set((state) => ({
      modules: state.modules.map((m) =>
        m.id === id ? { ...m, height } : m
      ),
    }))
  },

  updateModuleConfig: (id, configPatch) => {
    set((state) => ({
      modules: state.modules.map((m) =>
        m.id === id ? { ...m, config: { ...m.config, ...configPatch } } : m
      ),
    }))
  },

  selectModule: (id) => set({ selectedModuleId: id }),
  clearSelection: () => set({ selectedModuleId: null }),

  // --- Actions: Design global ---

  updateDepth: (depth) => {
    set((state) => ({
      design: { ...state.design, depth },
    }))
  },

  updateMaterial: (material) => {
    set((state) => ({
      design: { ...state.design, material },
      modules: state.modules.map((m) => ({ ...m, material })),
    }))
  },

  renameDesign: (name) => {
    set((state) => ({
      design: { ...state.design, name },
    }))
  },

  updateThickness: (thickness) => {
    set((state) => ({
      design: { ...state.design, thickness },
    }))
  },

  updateBackThickness: (backThickness) => {
    set((state) => ({
      design: { ...state.design, backThickness },
    }))
  },

  updateSliderClearance: (sliderClearance) => {
    set((state) => ({
      design: { ...state.design, sliderClearance },
    }))
  },

  updateDoorClearance: (doorClearance) => {
    set((state) => ({
      design: { ...state.design, doorClearance },
    }))
  },

  updateDoorMount: (doorMount) => {
    set((state) => ({
      design: { ...state.design, doorMount },
    }))
  },

  updateHingeType: (hingeType) => {
    set((state) => ({
      design: { ...state.design, hingeType },
    }))
  },

  // --- Actions: Views ---

  setView: (view) => set({ view }),
  setViewState: (viewState) => set({ viewState }),
  setOpenAmount: (openAmount) => set({ openAmount }),
  setRenderMode: (renderMode) => set({ renderMode }),

  // --- Actions: Accessories ---

  toggleAccessory: (accessoryId) => {
    set((state) => {
      const selected = [...state.design.selectedAccessories]
      const idx = selected.indexOf(accessoryId)
      if (idx >= 0) {
        selected.splice(idx, 1)
      } else {
        selected.push(accessoryId)
      }
      return { design: { ...state.design, selectedAccessories: selected } }
    })
  },

  // --- Actions: Persistence ---

  exportDesign: () => {
    const state = get()
    return {
      ...state.design,
      modules: state.modules,
    }
  },

  importDesign: (design) => {
    const { modules, ...designData } = design
    // Ensure new fields have defaults for old snapshots
    const merged = {
      backThickness: 3,
      sliderClearance: 25,
      doorClearance: 5,
      doorMount: 'overlay',
      hingeType: 'clip-on',
      ...designData,
    }
    set({
      modules: modules || [],
      design: merged,
      selectedModuleId: null,
      view: 'designer',
      viewState: 'closed',
      renderMode: 'solid',
    })
  },

  clearDesign: () => {
    set({
      modules: [],
      design: {
        version: '1.0',
        id: generateId(),
        name: 'Nuevo mueble',
        createdAt: new Date().toISOString(),
        depth: DESIGN_DEFAULTS.depth,
        material: DESIGN_DEFAULTS.material,
        thickness: DESIGN_DEFAULTS.thickness,
        backThickness: 3,
        sliderClearance: 25,
        doorClearance: 5,
        doorMount: 'overlay',
        hingeType: 'clip-on',
        selectedAccessories: [],
      },
      selectedModuleId: null,
    })
  },
}))
