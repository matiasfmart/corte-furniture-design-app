import { useDesignStore } from '../../store/designStore'
import { generatePDF } from '../../utils/generatePDF'
import { calculatePieces } from '../../utils/moduleEngine'

export default function ExportButton({ bom, optimization }) {
  const design = useDesignStore((s) => s.design)
  const modules = useDesignStore((s) => s.modules)

  const handleExport = async () => {
    try {
      const pieces = calculatePieces(modules, design)
      await generatePDF({
        design: { ...design, modules },
        bom,
        optimization,
        pieces,
      })
    } catch (err) {
      console.error('Error generating PDF:', err)
    }
  }

  return (
    <button
      onClick={handleExport}
      className="px-3 py-1.5 bg-accent-blue text-white text-xs font-medium rounded hover:bg-accent-blue/80 transition-colors"
    >
      Exportar PDF
    </button>
  )
}
