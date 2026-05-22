import { useEffect, useState, useCallback } from 'react'
import { useDesignStore } from './store/designStore'
import FurnitureViewer from './components/Viewer3D/FurnitureViewer'
import DesignEditor from './components/Editor2D/DesignEditor'
import SelectionPanel from './components/Editor2D/SelectionPanel'
import TopBar from './components/UI/TopBar'
import StructuralStatus from './components/UI/StructuralStatus'
import BOMView from './components/UI/BOMView'
import { theme } from './styles/theme'

function App() {
  const modules = useDesignStore((s) => s.modules)
  const addModule = useDesignStore((s) => s.addModule)
  const view = useDesignStore((s) => s.view)
  const selectedModuleId = useDesignStore((s) => s.selectedModuleId)
  const [splitPercent, setSplitPercent] = useState(50)

  // Add a default module if none exist (for testing)
  useEffect(() => {
    if (modules.length === 0) {
      addModule(null, null)
    }
  }, [])

  const selectedModule = modules.find((m) => m.id === selectedModuleId) || null

  const handleDividerDrag = useCallback((e) => {
    e.preventDefault()
    const startX = e.clientX
    const startPercent = splitPercent
    const containerWidth = window.innerWidth

    const onMove = (ev) => {
      const dx = ev.clientX - startX
      const newPercent = startPercent + (dx / containerWidth) * 100
      setSplitPercent(Math.max(25, Math.min(75, newPercent)))
    }

    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [splitPercent])

  return (
    <div className="h-screen w-screen bg-bg-base text-text-primary flex flex-col">
      {/* TopBar */}
      <TopBar />

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {view === 'designer' ? (
          <>
            {/* Left panel - Editor 2D */}
            <div style={{ width: `${splitPercent}%` }} className="border-r border-bg-border flex flex-col">
              {/* ZONA 1 — Editor SVG */}
              <div className="flex-1 min-h-0 overflow-hidden relative">
                <DesignEditor />
              </div>

              {/* ZONA 2 — Panel de propiedades — altura auto (2 filas) */}
              <div
                style={{
                  minHeight: 72,
                  flexShrink: 0,
                  borderTop: `1px solid ${theme.bg.border}`,
                  background: theme.bg.hard,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px 16px',
                }}
              >
                {selectedModule
                  ? <SelectionPanel module={selectedModule} />
                  : <span style={{ color: theme.text.muted, fontSize: 13 }}>
                      Seleccioná un módulo para editarlo
                    </span>
                }
              </div>
            </div>

            {/* Resizable divider */}
            <div
              onMouseDown={handleDividerDrag}
              style={{
                width: 5,
                cursor: 'col-resize',
                background: 'transparent',
                position: 'relative',
                zIndex: 10,
                marginLeft: -3,
                marginRight: -2,
              }}
            >
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 3,
                height: 40,
                borderRadius: 2,
                background: theme.bg.border,
                opacity: 0.6,
              }} />
            </div>

            {/* Right panel - Viewer 3D */}
            <div style={{ width: `${100 - splitPercent}%` }}>
              <FurnitureViewer />
            </div>
          </>
        ) : (
          <BOMView />
        )}
      </div>

      {/* Structural status bar */}
      <StructuralStatus />
    </div>
  )
}

export default App
