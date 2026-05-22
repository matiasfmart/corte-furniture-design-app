import { useEffect, useState, useCallback } from 'react'
import { useDesignStore } from './store/designStore'
import FurnitureViewer from './components/Viewer3D/FurnitureViewer'
import DesignEditor from './components/Editor2D/DesignEditor'
import SelectionPanel from './components/Editor2D/SelectionPanel'
import TopBar from './components/UI/TopBar'
import StructuralStatus from './components/UI/StructuralStatus'
import BOMView from './components/UI/BOMView'
import { theme } from './styles/theme'
import { useIsMobile } from './hooks/useIsMobile'

function App() {
  const modules = useDesignStore((s) => s.modules)
  const addModule = useDesignStore((s) => s.addModule)
  const view = useDesignStore((s) => s.view)
  const selectedModuleId = useDesignStore((s) => s.selectedModuleId)
  const [splitPercent, setSplitPercent] = useState(50)
  const [mobilePanel, setMobilePanel] = useState('2d') // '2d' | '3d'
  const isMobile = useIsMobile()

  // Add a default module if none exist
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
    <div className="h-screen w-screen bg-bg-base text-text-primary flex flex-col" style={{ overflow: 'hidden' }}>
      {/* TopBar */}
      <TopBar isMobile={isMobile} />

      {/* Main content */}
      <div className="flex-1 flex min-h-0" style={{ flexDirection: isMobile ? 'column' : 'row' }}>
        {view === 'designer' ? (
          isMobile ? (
            /* MOBILE: tab-switched panels */
            <>
              {/* Mobile tab switcher */}
              <div style={{
                display: 'flex',
                borderBottom: `1px solid ${theme.bg.border}`,
                background: theme.bg.hard,
                flexShrink: 0,
              }}>
                <button
                  onClick={() => setMobilePanel('2d')}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    fontSize: 13,
                    fontWeight: 500,
                    border: 'none',
                    cursor: 'pointer',
                    background: mobilePanel === '2d' ? theme.accent.orangeSoft : 'transparent',
                    color: mobilePanel === '2d' ? theme.accent.orange : theme.text.secondary,
                    borderBottom: mobilePanel === '2d' ? `2px solid ${theme.accent.orange}` : '2px solid transparent',
                  }}
                >
                  Editor 2D
                </button>
                <button
                  onClick={() => setMobilePanel('3d')}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    fontSize: 13,
                    fontWeight: 500,
                    border: 'none',
                    cursor: 'pointer',
                    background: mobilePanel === '3d' ? theme.accent.orangeSoft : 'transparent',
                    color: mobilePanel === '3d' ? theme.accent.orange : theme.text.secondary,
                    borderBottom: mobilePanel === '3d' ? `2px solid ${theme.accent.orange}` : '2px solid transparent',
                  }}
                >
                  Vista 3D
                </button>
              </div>

              {/* Mobile panel content */}
              <div className="flex-1 min-h-0 flex flex-col">
                {mobilePanel === '2d' ? (
                  <>
                    <div className="flex-1 min-h-0 overflow-hidden relative">
                      <DesignEditor />
                    </div>
                    <div style={{
                      minHeight: 64,
                      flexShrink: 0,
                      borderTop: `1px solid ${theme.bg.border}`,
                      background: theme.bg.hard,
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px 12px',
                      overflowX: 'auto',
                    }}>
                      {selectedModule
                        ? <SelectionPanel module={selectedModule} />
                        : <span style={{ color: theme.text.muted, fontSize: 13 }}>
                            Seleccioná un módulo para editarlo
                          </span>
                      }
                    </div>
                  </>
                ) : (
                  <FurnitureViewer />
                )}
              </div>
            </>
          ) : (
            /* DESKTOP: side-by-side split */
            <>
              {/* Left panel - Editor 2D */}
              <div style={{ width: `${splitPercent}%` }} className="border-r border-bg-border flex flex-col">
                <div className="flex-1 min-h-0 overflow-hidden relative">
                  <DesignEditor />
                </div>
                <div style={{
                  minHeight: 72,
                  flexShrink: 0,
                  borderTop: `1px solid ${theme.bg.border}`,
                  background: theme.bg.hard,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px 16px',
                }}>
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
          )
        ) : (
          <BOMView isMobile={isMobile} />
        )}
      </div>

      {/* Structural status bar */}
      <StructuralStatus />
    </div>
  )
}

export default App
