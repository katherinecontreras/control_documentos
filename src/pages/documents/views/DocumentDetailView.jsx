import { useEffect, useMemo, useState } from 'react'
import Header from '@/components/common/header'
import Input from '@/components/common/input'
import Select from '@/components/common/select'
import Button from '@/components/common/button'
import FilePickerBox from '@/components/common/filePickerBox'
import { supabase } from '@/api/supabase'
import { saveAs } from 'file-saver'
import { ArrowLeft, Pencil, Trash2, X } from 'lucide-react'

const STORAGE_BUCKET = 'documentos_ingenieria'

function normalizeExtension(value) {
  const v = String(value ?? '').trim().toLowerCase()
  if (!v) return ''
  return v.startsWith('.') ? v.slice(1) : v
}

function ConfirmModal({ isOpen, title, message, onCancel, onConfirm, loading }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b-2 border-purple-600">
          <h2 className="text-xl font-bold text-purple-600">{title}</h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
            aria-label="Cerrar"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-700">{message}</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Eliminando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DocumentDetailView({
  isOpen,
  documento,
  proyecto,
  disciplinas = [],
  tiposDocumento = [],
  loading = false,
  onBack,
  onUpdate,
  onDelete,
  showToast,
}) {
  const [editMode, setEditMode] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [fileChecking, setFileChecking] = useState(false)
  const [fileExists, setFileExists] = useState(false)
  const [fileUploading, setFileUploading] = useState(false)
  const [fileDownloading, setFileDownloading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)

  const canEdit = useMemo(() => {
    if (!documento) return false
    return !documento.cod_emision && !documento.codigo_documento_emitido
  }, [documento])

  const disciplinaOptions = useMemo(() => {
    return (disciplinas || []).map((d) => ({
      id: String(d.id_disciplina),
      tipo: d.tipo,
      descripcion: d.descripcion,
    }))
  }, [disciplinas])

  const tipoDocOptions = useMemo(() => {
    return (tiposDocumento || []).map((t) => ({
      id: String(t.id_tipo_doc),
      nombre: `${t.tipo}${t.descripcion ? ` - ${t.descripcion}` : ''}`,
      tipo: t.tipo,
    }))
  }, [tiposDocumento])

  const initialForm = useMemo(() => {
    return {
      id_disciplina: documento?.disciplinas_de_proyectos?.disciplinas?.id_disciplina
        ? String(documento.disciplinas_de_proyectos.disciplinas.id_disciplina)
        : '',
      id_tipo_documento: documento?.tipo_documento?.id_tipo_doc
        ? String(documento.tipo_documento.id_tipo_doc)
        : '',
      yacimiento: documento?.yacimiento ?? '',
      instalacion: documento?.instalacion ?? '',
      nro_consecutivo: documento?.nro_consecutivo ?? '',
      descripcion: documento?.descripcion ?? '',
      tipo_archivo: documento?.tipo_archivo ?? '',
      tipo_accion: documento?.tipo_accion ?? '',
      formato_hojas: documento?.formato_hojas ?? '',
      nro_hojas: documento?.nro_hojas ?? '',
      hh_internas: documento?.hh_internas ?? '',
      hh_externas: documento?.hh_externas ?? '',
      nro_sub_proyecto: documento?.nro_sub_proyecto ?? '',
      fecha_base: documento?.fecha_base ?? '',
      fecha_emision_prevista: documento?.fecha_emision_prevista ?? '',
    }
  }, [documento])

  const [form, setForm] = useState(() => initialForm)

  if (!isOpen || !documento) return null

  useEffect(() => {
    let cancelled = false
    const filename = documento?.archivo
    if (!filename) {
      setFileExists(false)
      return () => {
        cancelled = true
      }
    }

    ;(async () => {
      setFileChecking(true)
      try {
        const { data, error } = await supabase
          .storage
          .from(STORAGE_BUCKET)
          .list('', { search: filename })
        if (error) throw error
        const found = (data || []).some((o) => o?.name === filename)
        if (!cancelled) setFileExists(found)
      } catch (e) {
        if (!cancelled) setFileExists(false)
        showToast?.('error', e?.message || 'No se pudo verificar el archivo en Storage.')
      } finally {
        if (!cancelled) setFileChecking(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [documento?.archivo]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const handleSave = async () => {
    try {
      const updated = await onUpdate?.({
        proyecto,
        documentoId: documento.id_documento,
        values: form,
        disciplinas,
        tiposDocumento,
      })
      showToast?.('success', 'Documento actualizado.')
      setEditMode(false)
      return updated
    } catch (e) {
      showToast?.('error', e?.message || 'No se pudo actualizar el documento.')
      throw e
    }
  }

  const handleDelete = async () => {
    try {
      await onDelete?.(documento.id_documento)
      showToast?.('success', 'Documento eliminado.')
      setConfirmDeleteOpen(false)
      onBack?.()
    } catch (e) {
      showToast?.('error', e?.message || 'No se pudo eliminar el documento.')
      throw e
    }
  }

  const handleUploadFile = async () => {
    if (!selectedFile) return
    if (!canEdit || !editMode) return
    if (!documento.archivo) {
      showToast?.('error', 'El documento no tiene nombre de archivo.')
      return
    }

    const expectedExt = normalizeExtension(documento.tipo_archivo)
    if (expectedExt) {
      const actualExt = String(selectedFile.name.split('.').pop() || '').trim().toLowerCase()
      if (actualExt !== expectedExt) {
        showToast?.(
          'error',
          `El archivo seleccionado debe ser .${expectedExt}. (Seleccionaste .${actualExt || '?'})`
        )
        return
      }
    }

    setFileUploading(true)
    try {
      const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(
        documento.archivo,
        selectedFile,
        {
          upsert: true,
          contentType: selectedFile.type || undefined,
        }
      )
      if (error) throw error
      setFileExists(true)
      setSelectedFile(null)
      showToast?.('success', 'Archivo subido a Storage.')
    } catch (e) {
      showToast?.('error', e?.message || 'No se pudo subir el archivo.')
      throw e
    } finally {
      setFileUploading(false)
    }
  }

  const handleDownloadFile = async () => {
    if (!documento?.archivo) return
    setFileDownloading(true)
    try {
      const { data, error } = await supabase
        .storage
        .from(STORAGE_BUCKET)
        .download(documento.archivo)
      if (error) throw error
      saveAs(data, documento.archivo)
    } catch (e) {
      showToast?.('error', e?.message || 'No se pudo descargar el archivo.')
      throw e
    } finally {
      setFileDownloading(false)
    }
  }

  const accept = useMemo(() => {
    const ext = normalizeExtension(documento?.tipo_archivo)
    return ext ? `.${ext}` : undefined
  }, [documento?.tipo_archivo])

  return (
    <div className="space-y-6">
      <Header
        variant="page"
        title={documento.archivo || `Documento #${documento.id_documento}`}
        actions={[
          <button
            key="back"
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-semibold"
          >
            <ArrowLeft size={20} />
            Volver
          </button>,
          canEdit ? (
            editMode ? (
              <button
                key="cancel"
                onClick={() => {
                  setForm(initialForm)
                  setEditMode(false)
                }}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
              >
                <X size={20} />
                Cancelar
              </button>
            ) : (
              <button
                key="edit"
                onClick={() => setEditMode(true)}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-semibold shadow-lg"
              >
                <Pencil size={20} />
                Modificar
              </button>
            )
          ) : null,
          canEdit ? (
            <button
              key="delete"
              onClick={() => setConfirmDeleteOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold"
            >
              <Trash2 size={20} />
              Eliminar
            </button>
          ) : null,
        ]}
      />

      {!canEdit ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-900">
          Este documento ya fue emitido. No se puede modificar ni eliminar.
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Yacimiento"
          type="text"
          value={form.yacimiento}
          onChange={handleChange('yacimiento')}
          required={editMode}
          placeholder="Ej: ABCD"
          disabled={!editMode}
        />
        <Input
          label="Instalación"
          type="text"
          value={form.instalacion}
          onChange={handleChange('instalacion')}
          required={editMode}
          placeholder="Ej: PLANTA01"
          disabled={!editMode}
        />
        <div>
          <Select
            label="Disciplina"
            value={form.id_disciplina}
            onChange={(v) => setForm((p) => ({ ...p, id_disciplina: v }))}
            options={disciplinaOptions}
            className="w-full"
            disabled={!editMode}
            required={editMode}
          />
        </div>
        <div>
          <Select
            label="Tipo Documento"
            value={form.id_tipo_documento}
            onChange={(v) => setForm((p) => ({ ...p, id_tipo_documento: v }))}
            options={tipoDocOptions}
            className="w-full"
            disabled={!editMode}
            required={editMode}
          />
        </div>
        <Input
          label="Nro Doc"
          type="number"
          value={form.nro_consecutivo}
          onChange={handleChange('nro_consecutivo')}
          required={editMode}
          disabled={!editMode}
        />
        <Input
          label="Descripción"
          type="text"
          value={form.descripcion}
          onChange={handleChange('descripcion')}
          required={editMode}
          disabled={!editMode}
        />
        <Input
          label="Tipo archivo"
          type="text"
          value={form.tipo_archivo}
          onChange={handleChange('tipo_archivo')}
          required={editMode}
          disabled={!editMode}
          placeholder="Ej: pdf"
        />
        <Input
          label="Formato hojas"
          type="text"
          value={form.formato_hojas}
          onChange={handleChange('formato_hojas')}
          required={false}
          disabled={!editMode}
        />
        <Input
          label="Cant hojas"
          type="number"
          value={form.nro_hojas}
          onChange={handleChange('nro_hojas')}
          required={false}
          disabled={!editMode}
        />
        <Input
          label="HH internas"
          type="number"
          value={form.hh_internas}
          onChange={handleChange('hh_internas')}
          required={false}
          disabled={!editMode}
        />
        <Input
          label="HH externas"
          type="number"
          value={form.hh_externas}
          onChange={handleChange('hh_externas')}
          required={false}
          disabled={!editMode}
        />
        <Input
          label="Sub proyecto"
          type="number"
          value={form.nro_sub_proyecto}
          onChange={handleChange('nro_sub_proyecto')}
          required={false}
          disabled={!editMode}
        />
        <Input
          label="Fecha base"
          type="date"
          value={form.fecha_base}
          onChange={handleChange('fecha_base')}
          required={false}
          disabled={!editMode}
        />
        <Input
          label="Fecha emisión prevista"
          type="date"
          value={form.fecha_emision_prevista}
          onChange={handleChange('fecha_emision_prevista')}
          required={false}
          disabled={!editMode}
        />
        <Input
          label="Tipo acción"
          type="text"
          value={form.tipo_accion}
          onChange={handleChange('tipo_accion')}
          required={editMode}
          disabled={!editMode}
          placeholder="Calificable / Informativo"
        />
      </div>

      <FilePickerBox
        filename={documento.archivo}
        exists={fileExists}
        checking={fileChecking}
        editable={editMode && canEdit}
        selectedFile={selectedFile}
        accept={accept}
        onFileSelected={(file) => {
          if (!file) {
            setSelectedFile(null)
            return
          }
          const expectedExt = normalizeExtension(documento.tipo_archivo)
          if (expectedExt) {
            const actualExt = String(file.name.split('.').pop() || '').trim().toLowerCase()
            if (actualExt !== expectedExt) {
              showToast?.(
                'error',
                `Solo puedes seleccionar archivos .${expectedExt} para este documento.`
              )
              setSelectedFile(null)
              return
            }
          }
          setSelectedFile(file)
        }}
        onUpload={handleUploadFile}
        uploading={fileUploading}
        onDownload={handleDownloadFile}
        downloading={fileDownloading}
        disabled={loading || fileUploading || fileChecking || fileDownloading}
      />

      {editMode ? (
        <div className="max-w-md">
          <Button
            type="button"
            disabled={loading}
            loading={loading}
            onClick={handleSave}
          >
            Guardar
          </Button>
        </div>
      ) : null}

      <ConfirmModal
        isOpen={confirmDeleteOpen}
        title="Eliminar documento"
        message="¿Seguro que quieres eliminar este documento? Esta acción no se puede deshacer."
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={loading}
      />
    </div>
  )
}

