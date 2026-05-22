import { useDesignStore } from '../../store/designStore'
import { theme } from '../../styles/theme'
import { useIsMobile } from '../../hooks/useIsMobile'

/**
 * ViewControls — Barra de controles 3D (bottom center).
 * [Cerrado | Abierto | Despiece] · [Sólido | CAD]
 * Iconos: variaciones del mismo cubo 3D isométrico.
 */

const s = 18 // icon size

// Cubo cerrado — caja 3D isométrica
const IconClosed = () => (
  <svg width={s} height={s} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 14V6l6-3.5L16 6v8l-6 3.5L4 14z" />
    <path d="M4 6l6 3.5L16 6" />
    <path d="M10 9.5V17.5" />
  </svg>
)

// Cubo con puerta frontal entreabierta — perspectiva clara
const IconOpen = () => (
  <svg width={s} height={s} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    {/* Cuerpo del cubo (sin cara frontal-izquierda) */}
    <path d="M4 6l6-3.5L16 6" />
    <path d="M16 6v8l-6 3.5" />
    <path d="M4 6v8l6 3.5" />
    <path d="M4 6l6 3.5L16 6" />
    <path d="M10 9.5V17.5" />
    {/* Puerta abierta — pivotea desde arista izquierda, gira hacia afuera */}
    <path d="M4 6L4 14" strokeWidth="1.5" />
    <path d="M4 6L1.5 8L1.5 15.5L4 14" strokeWidth="1.4" />
  </svg>
)

// Cubo explosionado — piezas separadas
const IconExploded = () => (
  <svg width={s} height={s} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    {/* Tapa — arriba */}
    <path d="M4 4l6-2.5L16 4l-6 2.5L4 4z" />
    {/* Base — abajo */}
    <path d="M4 16l6-2.5L16 16l-6 2.5L4 16z" />
    {/* Lado izquierdo */}
    <path d="M2 7v4l4 2v-4L2 7z" />
    {/* Lado derecho */}
    <path d="M18 7v4l-4 2v-4L18 7z" />
  </svg>
)

// Cubo sólido — relleno
const IconSolid = () => (
  <svg width={s} height={s} viewBox="0 0 20 20" fill="currentColor" stroke="none">
    <rect x="4" y="4" width="12" height="12" rx="2.5" />
  </svg>
)

// Cubo wireframe — subdividido
const IconCAD = () => (
  <svg width={s} height={s} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="12" height="12" rx="1.5" />
    <line x1="4" y1="10" x2="16" y2="10" />
    <line x1="10" y1="4" x2="10" y2="16" />
  </svg>
)

function ControlBtn({ active, onClick, title, children, size = 34 }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        transition: 'all 120ms',
        background: active ? `${theme.accent.orange}30` : 'transparent',
        color: active ? theme.accent.orange : theme.text.secondary,
      }}
    >
      {children}
    </button>
  )
}

export default function ViewControls() {
  const isMobile = useIsMobile()
  const btnSize = isMobile ? 42 : 34
  const viewState = useDesignStore((s) => s.viewState)
  const renderMode = useDesignStore((s) => s.renderMode)
  const openAmount = useDesignStore((s) => s.openAmount)
  const setViewState = useDesignStore((s) => s.setViewState)
  const setOpenAmount = useDesignStore((s) => s.setOpenAmount)
  const setRenderMode = useDesignStore((s) => s.setRenderMode)

  const isOpen = openAmount > 0

  const handleNormal = () => {
    setViewState('closed')
    setOpenAmount(0)
  }

  const handleOpen = () => {
    setViewState('closed')
    setOpenAmount(1)
  }

  const handleExploded = () => {
    setViewState('exploded')
    setOpenAmount(0)
  }

  return (
    <div style={{
      position: 'absolute',
      bottom: 16,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      backgroundColor: theme.bg.hard,
      borderRadius: 10,
      padding: '5px 6px',
      border: `1px solid ${theme.bg.border}`,
    }}>
      {/* Estado del mueble: Normal - Abierto - Despiece */}
      <ControlBtn
        active={viewState === 'closed' && !isOpen}
        onClick={handleNormal}
        title="Normal"
        size={btnSize}
      >
        <IconClosed />
      </ControlBtn>
      <ControlBtn
        active={viewState === 'closed' && isOpen}
        onClick={handleOpen}
        title="Abierto"
        size={btnSize}
      >
        <IconOpen />
      </ControlBtn>
      <ControlBtn
        active={viewState === 'exploded'}
        onClick={handleExploded}
        title="Despiece"
        size={btnSize}
      >
        <IconExploded />
      </ControlBtn>

      {/* Separador */}
      <div style={{ width: 1, height: 18, background: theme.bg.border, margin: '0 4px' }} />

      {/* Modo de renderizado */}
      <ControlBtn active={renderMode === 'solid'} onClick={() => setRenderMode('solid')} title="Sólido" size={btnSize}>
        <IconSolid />
      </ControlBtn>
      <ControlBtn active={renderMode === 'cad'} onClick={() => setRenderMode('cad')} title="CAD" size={btnSize}>
        <IconCAD />
      </ControlBtn>
    </div>
  )
}
