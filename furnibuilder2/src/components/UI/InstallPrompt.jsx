import { useState, useEffect } from 'react'
import { theme } from '../../styles/theme'

/**
 * InstallPrompt — Full-screen blocking view on mobile.
 * Forces PWA installation before using the app.
 * Returns null (allows app usage) if already installed (standalone mode).
 */
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [installed, setInstalled] = useState(
    typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches
  )

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => {
    const handler = () => setInstalled(true)
    window.addEventListener('appinstalled', handler)
    return () => window.removeEventListener('appinstalled', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setInstalled(true)
    }
    setDeferredPrompt(null)
  }

  // Already installed or running as standalone — don't block
  if (installed) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 32,
      background: theme.bg.base,
      padding: 32,
    }}>
      {/* Logo */}
      <span style={{
        fontSize: 48,
        fontWeight: 800,
        color: theme.accent.orange,
        letterSpacing: '1px',
        userSelect: 'none',
      }}>
        corte
      </span>

      {/* Message */}
      <p style={{
        color: theme.text.secondary,
        fontSize: 15,
        textAlign: 'center',
        maxWidth: 280,
        lineHeight: 1.5,
        margin: 0,
      }}>
        Instalá la app para usar corte en tu dispositivo
      </p>

      {/* Install button */}
      {deferredPrompt ? (
        <button
          onClick={handleInstall}
          style={{
            background: theme.accent.orange,
            color: '#1d2021',
            border: 'none',
            borderRadius: 10,
            padding: '14px 32px',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: '0.3px',
          }}
        >
          Instalar corte
        </button>
      ) : (
        <p style={{
          color: theme.text.muted,
          fontSize: 13,
          textAlign: 'center',
          maxWidth: 260,
          margin: 0,
          lineHeight: 1.4,
        }}>
          Abrí esta página en Chrome o Safari para instalar la app
        </p>
      )}
    </div>
  )
}
