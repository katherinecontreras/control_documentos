import { useEffect, useState } from 'react'
import Input from '@/components/common/input'
import Button from '@/components/common/button'
import LoadingData from '@/components/common/loadingData'
import { Shield, AlignLeft } from 'lucide-react'

export default function RoleFormView({
  rolId,
  getRolById,
  createRol,
  updateRol,
  onSuccess,
  onCancel,
}) {
  const isEditMode = !!rolId

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loadingRol, setLoadingRol] = useState(false)

  const [formData, setFormData] = useState({
    nombre_rol: '',
    descripcion: '',
  })

  useEffect(() => {
    if (isEditMode && rolId) loadRol()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolId, isEditMode])

  const loadRol = async () => {
    setLoadingRol(true)
    setError('')
    try {
      const { data, error: fetchError } = await getRolById?.(rolId)
      if (fetchError) {
        setError(fetchError.message || 'Error al cargar el rol')
        return
      }
      setFormData({
        nombre_rol: data?.nombre_rol || '',
        descripcion: data?.descripcion || '',
      })
    } catch (err) {
      console.error('Error al cargar rol:', err)
      setError('Error al cargar el rol')
    } finally {
      setLoadingRol(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (error) setError('')
    if (success) setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    if (!formData.nombre_rol) {
      setError('El nombre del rol es obligatorio')
      setSubmitting(false)
      return
    }

    const payload = {
      nombre_rol: formData.nombre_rol,
      descripcion: formData.descripcion || null,
    }

    try {
      if (isEditMode) {
        const { error: updateError } = await updateRol?.(rolId, payload)
        if (updateError) {
          setError(updateError.message || 'Error al actualizar rol')
        } else {
          setSuccess('Rol actualizado exitosamente')
          setTimeout(() => onSuccess?.(), 600)
        }
      } else {
        const { error: createError } = await createRol?.(payload)
        if (createError) {
          setError(createError.message || 'Error al crear rol')
        } else {
          setSuccess('Rol creado exitosamente')
          setTimeout(() => onSuccess?.(), 600)
        }
      }
    } catch (err) {
      console.error('Error al guardar rol:', err)
      setError('Error inesperado al guardar el rol')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingRol) {
    return (
      <div className="p-8">
        <LoadingData />
      </div>
    )
  }

  return (
    <div>
      {error && (
        <div className="bg-gradient-to-br from-red-50 to-red-100 text-red-900 p-4 rounded-xl mb-6 text-sm font-medium border-l-4 border-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-gradient-to-br from-green-50 to-green-100 text-green-900 p-4 rounded-xl mb-6 text-sm font-medium border-l-4 border-green-600">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border-b-2 border-gray-200 pb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Datos del Rol</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre del Rol"
              type="text"
              placeholder="Ej: Administrador"
              value={formData.nombre_rol}
              onChange={(e) => handleChange('nombre_rol', e.target.value)}
              icon={<Shield size={20} />}
            />
            <Input
              label="Descripción"
              type="text"
              placeholder="Ej: Acceso total al sistema"
              value={formData.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              icon={<AlignLeft size={20} />}
              required={false}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={submitting} loading={submitting}>
            {isEditMode ? 'Guardar cambios' : 'Crear Rol'}
          </Button>
          <button
            type="button"
            onClick={() => onCancel?.()}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={submitting}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

