import Card from '@/components/common/card'
import { Download } from 'lucide-react'

export default function DocumentsCardsView({
  documentos = [],
  loading = false,
  onSelect,
  fileExistsByName,
  downloadingByName,
  onDownload,
}) {
  if (loading) {
    return (
      <div className="py-10 text-center text-gray-600">
        Cargando documentos...
      </div>
    )
  }

  if (!documentos || documentos.length === 0) {
    return (
      <div className="py-10 text-center text-gray-600">
        No hay documentos para este proyecto.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {documentos.map((doc) => (
        <Card
          key={doc.id_documento}
          onClick={() => onSelect?.(doc)}
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="text-xs text-gray-500">
              {doc.codigo_documento_emitido ? 'Emitido' : 'Base'}
            </div>
            {doc.archivo && fileExistsByName?.[doc.archivo] ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onDownload?.(doc)
                }}
                disabled={Boolean(downloadingByName?.[doc.archivo])}
                className="shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                aria-label="Descargar archivo"
              >
                <Download size={14} />
                {downloadingByName?.[doc.archivo] ? 'Descargando...' : 'Descargar'}
              </button>
            ) : null}
          </div>
          <div className="font-semibold text-purple-700 wrap-break-word">
            {doc.codigo_documento_emitido || doc.codigo_documento_base || '-'}
          </div>
        </Card>
      ))}
    </div>
  )
}

