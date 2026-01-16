import { useEffect, useMemo, useState } from 'react'
import Input from '@/components/common/input'
import Select from '@/components/common/select'
import Button from '@/components/common/button'
import LoadingData from '@/components/common/loadingData'
import { Mail, User, Lock, IdCard } from 'lucide-react'

export default function UserFormView({
  usuarioId,
  roles = [],
  disciplinas = [],
  getUsuarioById,
  createUsuario,
  updateUsuario,
  onSuccess,
  onCancel,
}) {
  const isEditMode = !!usuarioId

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loadingUsuario, setLoadingUsuario] = useState(false)

  const [formData, setFormData] = useState({
    email_empresa: '',
    password: '',
    nombre: '',
    apellido: '',
    dni: '',
    id_rol: '',
    id_disciplina: '',
    lider_equipo: false,
  })

  useEffect(() => {
    if (isEditMode && usuarioId) {
      loadUsuario()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioId, isEditMode])

  const loadUsuario = async () => {
    setLoadingUsuario(true)
    setError('')
    try {
      const { data, error: fetchError } = await getUsuarioById?.(usuarioId)
      if (fetchError) {
        setError(fetchError.message || 'Error al cargar el usuario')
        return
      }
      if (data) {
        setFormData({
          email_empresa: data.email_empresa || '',
          password: '',
          nombre: data.nombre || '',
          apellido: data.apellido || '',
          dni: data.dni != null ? String(data.dni) : '',
          id_rol: data.id_rol != null ? String(data.id_rol) : '',
          id_disciplina: data.id_disciplina != null ? String(data.id_disciplina) : '',
          lider_equipo: !!data.lider_equipo,
        })
      }
    } catch (err) {
      console.error('Error al cargar usuario:', err)
      setError('Error al cargar el usuario')
    } finally {
      setLoadingUsuario(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (error) setError('')
    if (success) setSuccess('')
  }

  const rolesOptions = useMemo(() => {
    return (roles || []).map((r) => ({
      id: r.id_rol ?? r.id,
      nombre_rol: r.nombre_rol,
      descripcion: r.descripcion,
    }))
  }, [roles])

  const disciplinasOptions = useMemo(() => {
    return (disciplinas || []).map((d) => ({
      id: d.id_disciplina ?? d.id,
      tipo: d.tipo,
      descripcion: d.descripcion,
    }))
  }, [disciplinas])

  const validatePassword = (password) => {
    if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres'
    const hasLetter = /[a-zA-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    if (!hasLetter || !hasNumber) {
      return 'La contraseña debe contener al menos una letra y un número'
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    if (!formData.email_empresa) {
      setError('El email es obligatorio')
      setSubmitting(false)
      return
    }

    if (!isEditMode) {
      if (!formData.password) {
        setError('La contraseña es obligatoria para crear un usuario')
        setSubmitting(false)
        return
      }
      const passError = validatePassword(formData.password)
      if (passError) {
        setError(passError)
        setSubmitting(false)
        return
      }
    }

    if (!formData.nombre || !formData.apellido) {
      setError('Nombre y apellido son obligatorios')
      setSubmitting(false)
      return
    }

    if (!formData.id_rol) {
      setError('Debes seleccionar un rol')
      setSubmitting(false)
      return
    }

    const payload = {
      nombre: formData.nombre,
      apellido: formData.apellido,
      dni: formData.dni ? parseInt(formData.dni, 10) : null,
      email_empresa: formData.email_empresa,
      id_rol: parseInt(formData.id_rol, 10),
      id_disciplina:
        formData.id_disciplina && formData.id_disciplina !== ''
          ? parseInt(formData.id_disciplina, 10)
          : null,
      lider_equipo: !!formData.lider_equipo,
    }

    try {
      if (isEditMode) {
        const { error: updateError } = await updateUsuario?.(usuarioId, payload)
        if (updateError) {
          setError(updateError.message || 'Error al actualizar usuario')
        } else {
          setSuccess('Usuario actualizado exitosamente')
          setTimeout(() => onSuccess?.(), 600)
        }
      } else {
        const { data: created, error: createError } = await createUsuario?.({
          email: formData.email_empresa,
          password: formData.password,
          usuarioData: payload,
        })
        if (createError) {
          setError(createError.message || 'Error al crear usuario')
        } else {
          if (created?.requiresEmailConfirmation) {
            setSuccess(
              `Usuario creado. Se envió un email de confirmación a "${formData.email_empresa}".`
            )
          } else {
            setSuccess('Usuario creado exitosamente')
          }
          setTimeout(() => onSuccess?.(), 600)
        }
      }
    } catch (err) {
      console.error('Error al guardar usuario:', err)
      setError('Error inesperado al guardar el usuario')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingUsuario) {
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
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Datos del Usuario
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="usuario@empresa.com"
              value={formData.email_empresa}
              onChange={(e) => handleChange('email_empresa', e.target.value)}
              icon={<Mail size={20} />}
              disabled={isEditMode}
            />

            {!isEditMode && (
              <Input
                label="Contraseña"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                icon={<Lock size={20} />}
              />
            )}

            <Input
              label="Nombre"
              type="text"
              placeholder="Nombre"
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              icon={<User size={20} />}
            />

            <Input
              label="Apellido"
              type="text"
              placeholder="Apellido"
              value={formData.apellido}
              onChange={(e) => handleChange('apellido', e.target.value)}
              icon={<User size={20} />}
            />

            <Input
              label="DNI"
              type="number"
              placeholder="12345678"
              value={formData.dni}
              onChange={(e) => handleChange('dni', e.target.value)}
              icon={<IdCard size={20} />}
              required={false}
            />

            <Input
              label="Líder de Equipo"
              type="checkbox"
              value={formData.lider_equipo}
              onChange={(e) => handleChange('lider_equipo', e.target.checked)}
              checked={formData.lider_equipo}
              required={false}
            />
          </div>
        </div>

        <div className="border-b-2 border-gray-200 pb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Rol y Disciplina
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <Select
              className="w-full"
              label="Rol"
              value={formData.id_rol}
              onChange={(value) => handleChange('id_rol', value)}
              options={rolesOptions}
            />

            <Select
              className="w-full"
              label="Disciplina"
              value={formData.id_disciplina}
              onChange={(value) => handleChange('id_disciplina', value)}
              options={disciplinasOptions}
              required={false}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={submitting} loading={submitting}>
            {isEditMode ? 'Guardar cambios' : 'Crear Usuario'}
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

