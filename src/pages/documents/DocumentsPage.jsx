import { useEffect, useMemo, useRef, useState } from 'react'
import Header from '@/components/common/header'
import Select from '@/components/common/select'
import { useProyects } from '@/hooks/useProyects'
import { useDocumentsExcel } from '@/hooks/useDocumentsExcel'
import { useDocuments } from '@/hooks/useDocuments'
import ProjectDisciplinesView from './views/ProjectDisciplinesView'
import DocumentsCardsView from './views/DocumentsCardsView'
import DocumentDetailView from './views/DocumentDetailView'
import { supabase } from '@/api/supabase'
import { saveAs } from 'file-saver'
import { Download, Upload, X, FileUp, ArrowLeft, RefreshCw } from 'lucide-react'

function Toast({ toast, onClose }) {
  if (!toast?.open) return null
  const variant =
    toast.type === 'success'
      ? 'bg-green-50 border-green-300 text-green-900'
      : 'bg-red-50 border-red-300 text-red-900'
  return (
    <div className="fixed z-60 top-6 right-6 max-w-md w-[92vw] md:w-[420px]">
      <div className={`border shadow-lg rounded-xl p-4 ${variant}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="text-sm font-semibold leading-snug">{toast.message}</div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/5"
            aria-label="Cerrar toast"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

function Modal({ isOpen, title, onClose, children, footer, busy = false }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-6 border-b-2 border-purple-600">
          <h2 className="text-xl font-bold text-purple-600">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={busy}
            aria-label="Cerrar"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        <div className="p-6 space-y-4">{children}</div>
        {footer ? <div className="p-6 pt-0">{footer}</div> : null}
      </div>
    </div>
  )
}

export default function DocumentsPage({ isOpen }) {
  const { proyectos, fetchProyectos, loading: loadingProyectos } = useProyects()
  const {
    loading: loadingCrud,
    error: crudError,
    clearError: clearCrudError,
    fetchDocumentsByProject: fetchDocsByProjectCrud,
    fetchDisciplinas,
    fetchTipoDocumento,
    fetchDisciplinasDeProyecto,
    updateDocumento,
    deleteDocumento,
  } = useDocuments()
  const {
    loading: loadingExcel,
    error: excelError,
    clearError,
    downloadProjectDocumentsExcel,
    uploadProjectDocumentsExcel,
  } = useDocumentsExcel()

  const [docs, setDocs] = useState([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [activeProjectId, setActiveProjectId] = useState('')
  const [currentView, setCurrentView] = useState('disciplines') // 'disciplines' | 'documents' | 'detail'
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [disciplinasProy, setDisciplinasProy] = useState([])
  const [loadingDisciplinasProy, setLoadingDisciplinasProy] = useState(false)
  const [selectedDisciplinaTipo, setSelectedDisciplinaTipo] = useState('')
  const [storageExistsByName, setStorageExistsByName] = useState({})
  const [downloadingByName, setDownloadingByName] = useState({})

  const [disciplinas, setDisciplinas] = useState([])
  const [tiposDocumento, setTiposDocumento] = useState([])

  const [downloadOpen, setDownloadOpen] = useState(false)
  const [downloadProjectId, setDownloadProjectId] = useState('')

  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadProjectId, setUploadProjectId] = useState('')
  const [uploadFile, setUploadFile] = useState(null)

  const fileInputRef = useRef(null)
  const toastTimerRef = useRef(null)

  const [toast, setToast] = useState({ open: false, type: 'error', message: '' })

  const showToast = (type, message) => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    setToast({ open: true, type, message })
    toastTimerRef.current = window.setTimeout(() => {
      setToast((t) => ({ ...t, open: false }))
    }, 6000)
  }

  useEffect(() => {
    fetchProyectos()
    ;(async () => {
      try {
        const [d, t] = await Promise.all([fetchDisciplinas(), fetchTipoDocumento()])
        setDisciplinas(d)
        setTiposDocumento(t)
      } catch (e) {
        console.error('Error al cargar catálogos:', e)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const proyectoOptions = useMemo(() => {
    return (proyectos || []).map((p) => ({ id: String(p.id_proyecto), nombre: p.nombre }))
  }, [proyectos])

  const getProyectoById = (id) => {
    const pid = Number(id)
    return (proyectos || []).find((p) => Number(p.id_proyecto) === pid) || null
  }

  const refreshDocs = async (id_proyecto) => {
    if (!id_proyecto) return
    setLoadingDocs(true)
    try {
      const data = await fetchDocsByProjectCrud(Number(id_proyecto))
      setDocs(data)
    } catch (e) {
      console.error('Error al obtener documentos:', e)
      showToast('error', e?.message || 'Error al obtener documentos.')
    } finally {
      setLoadingDocs(false)
    }
  }

  const STORAGE_BUCKET = 'documentos_ingenieria'

  const checkStorageExistsFor = async (filenames) => {
    const unique = Array.from(
      new Set((filenames || []).map((n) => String(n || '').trim()).filter(Boolean))
    )
    const pending = unique.filter((n) => storageExistsByName[n] == null)
    if (pending.length === 0) return

    // Concurrencia simple para no saturar
    const limit = 5
    for (let i = 0; i < pending.length; i += limit) {
      const chunk = pending.slice(i, i + limit)
      // eslint-disable-next-line no-await-in-loop
      await Promise.all(
        chunk.map(async (name) => {
          try {
            const { data, error } = await supabase
              .storage
              .from(STORAGE_BUCKET)
              .list('', { search: name })
            if (error) throw error
            const found = (data || []).some((o) => o?.name === name)
            setStorageExistsByName((prev) => ({ ...prev, [name]: found }))
          } catch {
            setStorageExistsByName((prev) => ({ ...prev, [name]: false }))
          }
        })
      )
    }
  }

  const downloadFromStorage = async (filename) => {
    const name = String(filename || '').trim()
    if (!name) return
    setDownloadingByName((p) => ({ ...p, [name]: true }))
    try {
      const { data, error } = await supabase.storage.from(STORAGE_BUCKET).download(name)
      if (error) throw error
      saveAs(data, name)
    } catch (e) {
      showToast('error', e?.message || 'No se pudo descargar el archivo.')
      throw e
    } finally {
      setDownloadingByName((p) => ({ ...p, [name]: false }))
    }
  }

  const refreshDisciplinasProy = async (id_proyecto, docsForCount) => {
    if (!id_proyecto) return
    setLoadingDisciplinasProy(true)
    try {
      const list = await fetchDisciplinasDeProyecto(Number(id_proyecto))
      const counts = new Map()
      for (const d of docsForCount || []) {
        const tipo = d?.disciplinas_de_proyectos?.disciplinas?.tipo
        if (!tipo) continue
        counts.set(tipo, (counts.get(tipo) || 0) + 1)
      }
      setDisciplinasProy(
        (list || []).map((x) => ({
          ...x,
          documentCount: counts.get(x?.disciplinas?.tipo) || 0,
        }))
      )
    } catch (e) {
      console.error('Error al obtener disciplinas del proyecto:', e)
      showToast('error', e?.message || 'Error al obtener disciplinas del proyecto.')
    } finally {
      setLoadingDisciplinasProy(false)
    }
  }

  const openDownloadModal = () => {
    clearError()
    setDownloadProjectId('')
    setDownloadOpen(true)
  }

  const openUploadModal = () => {
    clearError()
    setUploadProjectId('')
    setUploadFile(null)
    setUploadOpen(true)
  }

  const handleDownload = async () => {
    const proyecto = getProyectoById(downloadProjectId)
    if (!proyecto) return
    try {
      await downloadProjectDocumentsExcel(proyecto)
      showToast('success', `Excel descargado para "${proyecto.nombre}".`)
      setActiveProjectId(String(proyecto.id_proyecto))
      setCurrentView('disciplines')
      setSelectedDoc(null)
      const data = await fetchDocsByProjectCrud(Number(proyecto.id_proyecto))
      setDocs(data)
      await refreshDisciplinasProy(String(proyecto.id_proyecto), data)
      setDownloadOpen(false)
    } catch (e) {
      showToast('error', e?.message || 'No se pudo descargar el Excel.')
    }
  }

  const handlePickFile = () => fileInputRef.current?.click()

  const handleFileChange = (e) => {
    const f = e.target.files?.[0] || null
    setUploadFile(f)
  }

  const handleUpload = async () => {
    const proyecto = getProyectoById(uploadProjectId)
    if (!proyecto || !uploadFile) return
    try {
      const result = await uploadProjectDocumentsExcel({ proyecto, file: uploadFile })
      setActiveProjectId(String(proyecto.id_proyecto))
      setCurrentView('disciplines')
      setSelectedDoc(null)
      const data = await fetchDocsByProjectCrud(Number(proyecto.id_proyecto))
      setDocs(data)
      await refreshDisciplinasProy(String(proyecto.id_proyecto), data)
      setUploadOpen(false)
      showToast(
        'success',
        `Carga finalizada. Insertados: ${result.inserted}. Actualizados: ${result.updated}.`
      )
    } catch (e) {
      showToast('error', e?.message || 'No se pudo cargar el Excel.')
    }
  }

  return (
    <div className="p-8 overflow-hidden w-full">
      <Toast toast={toast} onClose={() => setToast((t) => ({ ...t, open: false }))} />
      <div
        className={`bg-white rounded-xl shadow-lg p-8 transition-all duration-300 ${
          isOpen ? 'ml-52' : 'ml-16'
        }`}
      >
        {currentView !== 'detail' ? (
          <>
            <Header
              variant="page"
              title="Documentos"
              actions={[
                <button
                  key="download"
                  onClick={openDownloadModal}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-semibold shadow-lg"
                >
                  <Download size={20} />
                  Descargar
                </button>,
                <button
                  key="upload"
                  onClick={openUploadModal}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-800 transition-colors font-semibold"
                >
                  <Upload size={20} />
                  Cargar
                </button>,
              ]}
            />

            <div className="mb-6">
              <Select
                label="Proyecto"
                value={activeProjectId}
                onChange={async (v) => {
                  clearError()
                  clearCrudError()
                  setActiveProjectId(v)
                  setSelectedDoc(null)
                  setSelectedDisciplinaTipo('')
                  setCurrentView(v ? 'disciplines' : 'disciplines')
                  if (v) {
                    const data = await fetchDocsByProjectCrud(Number(v))
                    setDocs(data)
                    await refreshDisciplinasProy(v, data)
                  } else {
                    setDocs([])
                    setDisciplinasProy([])
                  }
                }}
                options={proyectoOptions}
                className="w-full"
                required={false}
              />
              {loadingProyectos ? (
                <div className="text-sm text-gray-600 mt-2">Cargando proyectos...</div>
              ) : null}
            </div>

            {excelError ? (
              <div className="bg-linear-to-br from-red-50 to-red-100 text-red-900 p-3 rounded-xl mb-4 text-sm font-medium border-l-4 border-red-600">
                {excelError}
              </div>
            ) : null}
            {crudError ? (
              <div className="bg-linear-to-br from-red-50 to-red-100 text-red-900 p-3 rounded-xl mb-4 text-sm font-medium border-l-4 border-red-600">
                {crudError}
              </div>
            ) : null}

            {currentView === 'disciplines' ? (
              <ProjectDisciplinesView
                disciplinas={disciplinasProy}
                loading={loadingDisciplinasProy}
                onSelect={(dp) => {
                  const tipo = dp?.disciplinas?.tipo || ''
                  setSelectedDisciplinaTipo(tipo)
                  setCurrentView('documents')
                  // Verificar existencia de archivos para esta disciplina (solo los visibles)
                  const names = docs
                    .filter(
                      (d) =>
                        d?.disciplinas_de_proyectos?.disciplinas?.tipo === tipo
                    )
                    .map((d) => d.archivo)
                  checkStorageExistsFor(names)
                }}
              />
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-600">
                    {selectedDisciplinaTipo
                      ? `Disciplina: ${selectedDisciplinaTipo}`
                      : 'Disciplina'}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView('disciplines')
                      setSelectedDisciplinaTipo('')
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                  >
                    <ArrowLeft size={18} />
                    Volver a disciplinas
                  </button>
                </div>

                <DocumentsCardsView
                  documentos={docs.filter(
                    (d) =>
                      d?.disciplinas_de_proyectos?.disciplinas?.tipo ===
                      selectedDisciplinaTipo
                  )}
                  loading={loadingDocs}
                  onSelect={(doc) => {
                    setSelectedDoc(doc)
                    setCurrentView('detail')
                  }}
                  fileExistsByName={storageExistsByName}
                  downloadingByName={downloadingByName}
                  onDownload={(doc) => downloadFromStorage(doc.archivo)}
                />
              </>
            )}
          </>
        ) : (
          <DocumentDetailView
            key={`${selectedDoc?.id_documento ?? 'none'}-${selectedDoc?.archivo ?? ''}-${selectedDoc?.codigo_documento_base ?? ''}`}
            isOpen={currentView === 'detail'}
            documento={selectedDoc}
            proyecto={getProyectoById(activeProjectId)}
            disciplinas={disciplinas}
            tiposDocumento={tiposDocumento}
            loading={loadingCrud}
            showToast={showToast}
            onBack={async () => {
              setCurrentView('documents')
              setSelectedDoc(null)
              if (activeProjectId) {
                const data = await fetchDocsByProjectCrud(Number(activeProjectId))
                setDocs(data)
                await refreshDisciplinasProy(activeProjectId, data)
              }
            }}
            onUpdate={async (args) => {
              const updated = await updateDocumento(args)
              setSelectedDoc(updated)
              return updated
            }}
            onDelete={async (id_documento) => {
              await deleteDocumento(id_documento)
            }}
          />
        )}

      </div>

      {/* Modal Descargar */}
      <Modal
        isOpen={downloadOpen}
        title="Descargar documentos por proyecto"
        onClose={() => setDownloadOpen(false)}
        busy={loadingExcel}
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setDownloadOpen(false)}
              disabled={loadingExcel}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={!downloadProjectId || loadingExcel}
              className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loadingExcel ? 'Descargando...' : 'Descargar Excel'}
            </button>
          </div>
        }
      >
        <Select
          label="Proyecto"
          value={downloadProjectId}
          onChange={setDownloadProjectId}
          options={proyectoOptions}
          className="w-full"
        />
        {loadingProyectos ? (
          <div className="text-sm text-gray-600">Cargando proyectos...</div>
        ) : null}
      </Modal>

      {/* Modal Cargar */}
      <Modal
        isOpen={uploadOpen}
        title="Cargar Excel de documentos"
        onClose={() => setUploadOpen(false)}
        busy={loadingExcel}
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setUploadOpen(false)}
              disabled={loadingExcel}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={!uploadProjectId || !uploadFile || loadingExcel}
              className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loadingExcel ? 'Cargando...' : 'Cargar'}
            </button>
          </div>
        }
      >
        <Select
          label="Proyecto"
          value={uploadProjectId}
          onChange={(v) => {
            setUploadProjectId(v)
            setUploadFile(null)
          }}
          options={proyectoOptions}
          className="w-full"
        />

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-purple-800">Archivo</div>
              <div className="text-sm text-gray-700 truncate">
                {uploadFile ? uploadFile.name : 'Ningún archivo seleccionado'}
              </div>
            </div>
            <button
              type="button"
              onClick={handlePickFile}
              disabled={!uploadProjectId || loadingExcel}
              className="shrink-0 flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {uploadFile ? (
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
          </div>
          <div className="mt-2 text-xs text-gray-600">
            Selecciona el Excel descargado para este proyecto. Se validarán los headers y se
            insertarán solo documentos nuevos.
          </div>
        </div>
      </Modal>
    </div>
  )
}

