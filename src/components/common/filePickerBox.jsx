import { useRef } from 'react'
import { FileUp, RefreshCw } from 'lucide-react'

export default function FilePickerBox({
  filename,
  exists,
  accept,
  editable = false,
  selectedFile,
  onFileSelected,
  onUpload,
  uploading = false,
  onDownload,
  downloading = false,
  checking = false,
  disabled = false,
}) {
  const inputRef = useRef(null)

  const pick = () => inputRef.current?.click()

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-purple-800">Archivo</div>
          <div className="text-sm text-gray-700 truncate">
            {checking
              ? 'Verificando en Storage...'
              : exists
                ? `Archivo seleccionado: ${filename}`
                : 'Ningún archivo seleccionado'}
          </div>
          {!exists && editable ? (
            <div className="mt-1 text-xs text-gray-600">
              Selecciona un archivo para subir a Storage con el nombre exacto del documento.
            </div>
          ) : null}
          {selectedFile ? (
            <div className="mt-2 text-xs text-gray-700">
              Archivo local: <span className="font-semibold">{selectedFile.name}</span>
            </div>
          ) : null}
        </div>

        {editable ? (
          <div className="flex flex-col gap-2 shrink-0">
            {exists && filename ? (
              <button
                type="button"
                onClick={onDownload}
                disabled={disabled || checking || uploading || downloading}
                className="px-4 py-2 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {downloading ? 'Descargando...' : 'Descargar'}
              </button>
            ) : null}

            <button
              type="button"
              onClick={pick}
              disabled={disabled || uploading}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {selectedFile ? (
                <>
                  <RefreshCw size={18} />
                  Cambiar
                </>
              ) : (
                <>
                  <FileUp size={18} />
                  Seleccionar
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onUpload}
              disabled={disabled || uploading || !selectedFile}
              className="px-4 py-2 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {uploading ? 'Subiendo...' : 'Subir'}
            </button>
          </div>
        ) : (
          <div className="shrink-0">
            {exists && filename ? (
              <button
                type="button"
                onClick={onDownload}
                disabled={disabled || checking || downloading}
                className="px-4 py-2 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {downloading ? 'Descargando...' : 'Descargar'}
              </button>
            ) : null}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onFileSelected?.(e.target.files?.[0] || null)}
      />
    </div>
  )
}

