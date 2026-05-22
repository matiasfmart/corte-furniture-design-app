import { useState, useMemo } from 'react'
import { useDesignStore } from '../../store/designStore'
import { analyzeStructure } from '../../utils/structuralEngine'
import { theme } from '../../styles/theme'

export default function StructuralStatus() {
  const modules = useDesignStore((s) => s.modules)
  const design = useDesignStore((s) => s.design)
  const [expanded, setExpanded] = useState(false)

  const report = useMemo(
    () => analyzeStructure(modules, design),
    [modules, design]
  )

  if (modules.length === 0) return null

  const hasDanger = report.warnings.some((w) => w.severity === 'danger')
  const warnCount = report.warnings.filter((w) => w.severity === 'warn').length
  const dangerCount = report.warnings.filter((w) => w.severity === 'danger').length

  return (
    <div className="shrink-0 border-t border-bg-border" style={{ backgroundColor: theme.bg.hard }}>
      {/* Status bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2 flex items-center gap-2 text-xs hover:bg-bg-surface/50 transition-colors"
      >
        {report.isOk ? (
          <>
            <span className="text-accent-ok">✓</span>
            <span className="text-accent-ok font-medium">Estructura correcta</span>
          </>
        ) : hasDanger ? (
          <>
            <span className="text-accent-danger">✗</span>
            <span className="text-accent-danger font-medium">
              {report.warnings[0].message}
            </span>
          </>
        ) : (
          <>
            <span className="text-accent-warn">⚠</span>
            <span className="text-accent-warn font-medium">
              {warnCount} advertencia{warnCount > 1 ? 's' : ''}
            </span>
          </>
        )}

        {!report.isOk && (
          <span className="ml-auto text-text-muted">
            {expanded ? '▲' : '▼'}
          </span>
        )}
      </button>

      {/* Expanded detail */}
      {expanded && !report.isOk && (
        <div className="px-4 pb-3 space-y-2">
          {/* Warnings */}
          {report.warnings.map((w, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 text-xs px-3 py-2 rounded ${
                w.severity === 'danger'
                  ? 'bg-accent-danger/10 text-accent-danger'
                  : 'bg-accent-warn/10 text-accent-warn'
              }`}
            >
              <span>{w.severity === 'danger' ? '✗' : '⚠'}</span>
              <span>{w.message}</span>
            </div>
          ))}

          {/* Required additions */}
          {report.additions.filter((a) => a.required).length > 0 && (
            <div className="mt-2 pt-2 border-t border-bg-border">
              <p className="text-text-secondary text-xs mb-1 font-medium">Requerido:</p>
              {report.additions
                .filter((a) => a.required)
                .map((a, i) => (
                  <div key={i} className="text-xs text-text-primary flex items-center gap-2">
                    <span className="text-accent-danger">•</span>
                    <span>{a.item} × {a.qty} {a.unit}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
