import { useState, useEffect } from 'react'
import { useProyects } from '../../../hooks/useProyects'
import Input from '@/components/common/input'
import Select from '@/components/common/select'
import Button from '@/components/common/button'
import LoadingData from '@/components/common/loadingData'
import MiniFormModal from '@/components/common/miniformModal'
import { Building2, Calendar, Plus, X, MapPin } from 'lucide-react'

export default function ProyectoFormView({ proyectoId, onSuccess, onCancel }) {
  const {
    clientes,
    reglasAvance,
    loading,
    fetchFormData,
    createProyecto,
    updateProyecto,
    getProyectoById,
    createReglaAvance,
    fetchReglasAvance,
  } = useProyects()

  const isEditMode = !!proyectoId
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showReglaModal, setShowReglaModal] = useState(false)
  const [loadingProyecto, setLoadingProyecto] = useState(false)

  const [proyectoData, setProyectoData] = useState({
    nombre: '',
    lugar: '',
    id_cliente: '',
    cod_proyecto_cliente: '',
    cod_proyecto_interno: '',
    nro_contrato: '',
    fecha_inicio_contrato: '',
    fecha_pem: '',
    total_horas_por_dia_de_trabajo: '8',
    total_dias_de_trabajo_por_semana: '5',
  })

  const [reglasSeleccionadas, setReglasSeleccionadas] = useState([])

  useEffect(() => {
    fetchFormData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (isEditMode && proyectoId) {
      loadProyectoData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyectoId, isEditMode])

  const loadProyectoData = async () => {
    setLoadingProyecto(true)
    try {
      const { data, error } = await getProyectoById(proyectoId)
      if (error) {
        setError('Error al cargar el proyecto')
        return
      }

      if (data) {
        setProyectoData({
          nombre: data.nombre || '',
          lugar: data.lugar || '',
          id_cliente: data.id_cliente?.toString() || '',
          cod_proyecto_cliente: data.cod_proyecto_cliente || '',
          cod_proyecto_interno: data.cod_proyecto_interno?.toString() || '',
          nro_contrato: data.nro_contrato?.toString() || '',
          fecha_inicio_contrato: data.fecha_inicio_contrato || '',
          fecha_pem: data.fecha_pem || '',
          total_horas_por_dia_de_trabajo:
            data.total_horas_por_dia_de_trabajo?.toString() || '8',
          total_dias_de_trabajo_por_semana:
            data.total_dias_de_trabajo_por_semana?.toString() || '5',
        })
        setReglasSeleccionadas(data.reglasSeleccionadas || [])
      }
    } catch (err) {
      console.error('Error al cargar proyecto:', err)
      setError('Error al cargar el proyecto')
    } finally {
      setLoadingProyecto(false)
    }
  }

  const handleInputChange = (field, value) => {
    setProyectoData((prev) => ({
      ...prev,
      [field]: value,
    }))
    if (error) setError('')
    if (success) setSuccess('')
  }

  const calcularPlazoContractual = () => {
    if (proyectoData.fecha_inicio_contrato && proyectoData.fecha_pem) {
      const inicio = new Date(proyectoData.fecha_inicio_contrato)
      const fin = new Date(proyectoData.fecha_pem)
      const diffTime = Math.abs(fin - inicio)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    }
    return null
  }

  const handleReglaToggle = (id_regla) => {
    setReglasSeleccionadas((prev) => {
      if (prev.includes(id_regla)) {
        return prev.filter((id) => id !== id_regla)
      } else {
        return [...prev, id_regla]
      }
    })
  }

  const handleCreateRegla = async (formData) => {
    const reglaData = {
      tipo_revision: formData.tipo_revision,
      porc_fisico: parseInt(formData.porc_fisico, 10),
      porc_certificacion: parseInt(formData.porc_certificacion, 10),
    }

    const { data, error } = await createReglaAvance(reglaData)

    if (error) {
      throw new Error(error.message || 'Error al crear la regla de avance')
    }

    await fetchReglasAvance()

    if (data) {
      const nuevaReglaId = data.id_regla || data.id
      setReglasSeleccionadas((prev) => {
        if (!prev.includes(nuevaReglaId.toString())) {
          return [...prev, nuevaReglaId.toString()]
        }
        return prev
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    if (!proyectoData.nombre) {
      setError('El nombre del proyecto es obligatorio')
      setSubmitting(false)
      return
    }

    if (!proyectoData.id_cliente) {
      setError('Debes seleccionar un cliente')
      setSubmitting(false)
      return
    }

    try {
      const plazoContractual = calcularPlazoContractual()

      const idClienteNum = parseInt(proyectoData.id_cliente, 10)
      if (isNaN(idClienteNum)) {
        setError('El cliente seleccionado no es válido')
        setSubmitting(false)
        return
      }

      const dataToSubmit = {
        nombre: proyectoData.nombre,
        lugar: proyectoData.lugar || null,
        id_cliente: idClienteNum,
        cod_proyecto_cliente: proyectoData.cod_proyecto_cliente || null,
        cod_proyecto_interno: proyectoData.cod_proyecto_interno
          ? parseInt(proyectoData.cod_proyecto_interno, 10)
          : null,
        nro_contrato: proyectoData.nro_contrato
          ? parseInt(proyectoData.nro_contrato, 10)
          : null,
        fecha_inicio_contrato: proyectoData.fecha_inicio_contrato || null,
        fecha_pem: proyectoData.fecha_pem || null,
        plazo_contractual: plazoContractual,
        total_horas_por_dia_de_trabajo: proyectoData.total_horas_por_dia_de_trabajo
          ? parseInt(proyectoData.total_horas_por_dia_de_trabajo, 10)
          : null,
        total_dias_de_trabajo_por_semana: proyectoData.total_dias_de_trabajo_por_semana
          ? parseInt(proyectoData.total_dias_de_trabajo_por_semana, 10)
          : null,
      }

      if (isEditMode) {
        const { error: updateError } = await updateProyecto(
          proyectoId,
          dataToSubmit,
          reglasSeleccionadas
        )
        if (updateError) {
          setError(updateError.message || 'Error al actualizar el proyecto')
        } else {
          setSuccess('Proyecto actualizado exitosamente')
          setTimeout(() => {
            onSuccess?.()
          }, 1500)
        }
      } else {
        const { error: createError } = await createProyecto(
          dataToSubmit,
          reglasSeleccionadas
        )
        if (createError) {
          setError(createError.message || 'Error al crear el proyecto')
        } else {
          setSuccess('Proyecto creado exitosamente')
          setTimeout(() => {
            onSuccess?.()
          }, 1500)
        }
      }
    } catch (err) {
      console.error('Error al guardar proyecto:', err)
      setError('Error inesperado al guardar el proyecto')
    } finally {
      setSubmitting(false)
    }
  }

  const clientesOptions = (clientes || []).map((cliente) => ({
    id: cliente.id_cliente || cliente.id,
    nombre: cliente.nombre || cliente.nombre_cliente,
    descripcion: cliente.contacto || '',
  }))

  const reglasDisponibles = reglasAvance.filter(
    (regla) => !reglasSeleccionadas.includes((regla.id_regla || regla.id).toString())
  )

  if (loading || loadingProyecto) {
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
        <div className="flex gap-4">
          <div className="border-b-2 w-1/2 border-gray-200 pb-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Información Básica
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Nombre del Proyecto"
                  type="text"
                  placeholder="Ingresa el nombre del proyecto"
                  value={proyectoData.nombre}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  icon={<Building2 size={20} />}
                />
                <Input
                  label="Lugar"
                  type="text"
                  placeholder="Ingresa el lugar del proyecto"
                  value={proyectoData.lugar}
                  onChange={(e) => handleInputChange('lugar', e.target.value)}
                  icon={<MapPin size={20} />}
                />
              </div>
              <Select
                className="w-full"
                label="Cliente"
                value={proyectoData.id_cliente}
                onChange={(value) => handleInputChange('id_cliente', value)}
                options={clientesOptions}
              />
              <div className="border-t-2 border-gray-200 pt-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Configuración de Trabajo
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Total Horas por Día de Trabajo"
                    type="number"
                    placeholder="Horas"
                    value={proyectoData.total_horas_por_dia_de_trabajo}
                    onChange={(e) =>
                      handleInputChange('total_horas_por_dia_de_trabajo', e.target.value)
                    }
                  />

                  <Input
                    label="Total Días de Trabajo por Semana"
                    type="number"
                    placeholder="Días"
                    value={proyectoData.total_dias_de_trabajo_por_semana}
                    onChange={(e) =>
                      handleInputChange('total_dias_de_trabajo_por_semana', e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-b-2 w-1/2 border-gray-200 pb-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Códigos y Contrato
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Código Proyecto Cliente"
                type="text"
                placeholder="Código del cliente"
                value={proyectoData.cod_proyecto_cliente}
                onChange={(e) =>
                  handleInputChange('cod_proyecto_cliente', e.target.value)
                }
              />

              <Input
                label="Código Proyecto Interno"
                type="number"
                placeholder="Código interno"
                value={proyectoData.cod_proyecto_interno}
                onChange={(e) =>
                  handleInputChange('cod_proyecto_interno', e.target.value)
                }
              />

              <Input
                label="Nro. de Contrato"
                type="number"
                placeholder="Número de contrato"
                value={proyectoData.nro_contrato}
                onChange={(e) => handleInputChange('nro_contrato', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <Input
                label="Fecha Inicio Contrato"
                type="date"
                value={proyectoData.fecha_inicio_contrato}
                onChange={(e) =>
                  handleInputChange('fecha_inicio_contrato', e.target.value)
                }
                icon={<Calendar size={20} />}
              />

              <Input
                label="Fecha PEM"
                type="date"
                value={proyectoData.fecha_pem}
                onChange={(e) => handleInputChange('fecha_pem', e.target.value)}
                icon={<Calendar size={20} />}
              />
            </div>

            {calcularPlazoContractual() !== null && (
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Plazo Contractual (días)
                </label>
                <div className="px-4 py-3.5 border-2 border-gray-200 rounded-xl bg-gray-50 text-base">
                  {calcularPlazoContractual()} días
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-b-2 border-gray-200 pb-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Reglas de Avance del Proyecto
          </h2>

          {reglasDisponibles.length === 0 && reglasSeleccionadas.length === 0 && (
            <p className="text-gray-500 text-sm italic">
              No hay reglas de avance disponibles. Crea una nueva regla para comenzar.
            </p>
          )}

          <div className="space-y-3">
            {reglasDisponibles.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Seleccionar Reglas de Avance
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {reglasDisponibles.map((regla) => (
                    <div
                      key={regla.id_regla || regla.id}
                      onClick={() =>
                        handleReglaToggle((regla.id_regla || regla.id).toString())
                      }
                      className="p-3 border-2 border-gray-200 rounded-xl cursor-pointer transition-all duration-200 hover:border-purple-300"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-gray-300 rounded flex items-center justify-center" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {regla.tipo_revision || `Regla ${regla.id_regla}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            Físico: {regla.porc_fisico}% - Certificación:{' '}
                            {regla.porc_certificacion}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowReglaModal(true)}
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-sm font-semibold"
                >
                  <Plus size={18} />
                  Agregar Nueva Regla
                </button>
              </div>
            )}

            {reglasSeleccionadas.length > 0 && (
              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Reglas Seleccionadas
                </label>
                <div className="space-y-2">
                  {reglasSeleccionadas.map((idRegla) => {
                    const regla = reglasAvance.find(
                      (r) => (r.id_regla || r.id).toString() === idRegla
                    )
                    if (!regla) return null
                    return (
                      <div
                        key={idRegla}
                        className="p-3 border-2 border-purple-600 bg-purple-50 rounded-xl"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-purple-600 bg-purple-600 rounded flex items-center justify-center">
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path d="M5 13l4 4L19 7"></path>
                              </svg>
                            </div>
                            <div>
                              <p className="font-medium text-sm text-gray-700">
                                {regla.tipo_revision || `Regla ${regla.id_regla}`}
                              </p>
                              <p className="text-xs text-gray-500">
                                Físico: {regla.porc_fisico}% - Certificación:{' '}
                                {regla.porc_certificacion}%
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleReglaToggle(idRegla)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {reglasDisponibles.length === 0 && reglasSeleccionadas.length > 0 && (
              <button
                type="button"
                onClick={() => setShowReglaModal(true)}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-sm font-semibold"
              >
                <Plus size={18} />
                Agregar Nueva Regla
              </button>
            )}
          </div>
        </div>

        <div className="pt-4">
          <Button type="submit" disabled={submitting} loading={submitting}>
            {isEditMode ? 'Guardar' : 'Crear Proyecto'}
          </Button>
        </div>
      </form>

      <MiniFormModal
        isOpen={showReglaModal}
        onClose={() => setShowReglaModal(false)}
        title="Agregar Nueva Regla de Avance"
        fields={[
          {
            name: 'tipo_revision',
            label: 'Tipo de Revisión',
            type: 'text',
            placeholder: 'Ej: Rev A, Rev B, Rev 0',
            required: true,
          },
          {
            name: 'porc_fisico',
            label: 'Porcentaje Físico (%)',
            type: 'number',
            placeholder: 'Ej: 30',
            required: true,
          },
          {
            name: 'porc_certificacion',
            label: 'Porcentaje Certificación (%)',
            type: 'number',
            placeholder: 'Ej: 25',
            required: true,
          },
        ]}
        onSubmit={handleCreateRegla}
        submitLabel="Crear Regla"
      />
    </div>
  )
}
