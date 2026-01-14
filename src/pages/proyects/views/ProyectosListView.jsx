import { useState, useEffect, useMemo } from 'react'
import LoadingData from '@/components/common/loadingData'
import Input from '@/components/common/input'
import Select from '@/components/common/select'
import { Search, Edit } from 'lucide-react'

export default function ProyectosListView({ proyectos, clientes, loading, onEdit }) {
  const [searchNombre, setSearchNombre] = useState('')
  const [filterCliente, setFilterCliente] = useState('')

  // Formatear opciones de clientes para el Select
  const clientesOptions = useMemo(() => {
    return clientes.map((cliente) => ({
      id: cliente.id_cliente || cliente.id,
      nombre: cliente.nombre || cliente.nombre_cliente,
    }))
  }, [clientes])

  // Filtrar proyectos
  const proyectosFiltrados = useMemo(() => {
    return proyectos.filter((proyecto) => {
      const matchNombre =
        !searchNombre ||
        proyecto.nombre
          .toLowerCase()
          .includes(searchNombre.toLowerCase())

      const matchCliente =
        !filterCliente ||
        (proyecto.clientes &&
          (proyecto.clientes.id_cliente || proyecto.clientes.id)?.toString() ===
            filterCliente)

      return matchNombre && matchCliente
    })
  }, [proyectos, searchNombre, filterCliente])

  if (loading) {
    return (
      <div className="p-8">
        <LoadingData />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Buscar por nombre"
          type="text"
          placeholder="Buscar proyecto..."
          value={searchNombre}
          onChange={(e) => setSearchNombre(e.target.value)}
          icon={<Search size={20} />}
        />
        <Select
          label="Cliente"
          value={filterCliente}
          onChange={setFilterCliente}
          options={clientesOptions}
        />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-purple-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Nombre
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Código Interno
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Cliente
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {proyectosFiltrados.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No hay proyectos disponibles
                  </td>
                </tr>
              ) : (
                proyectosFiltrados.map((proyecto) => (
                  <tr
                    key={proyecto.id_proyecto}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {proyecto.nombre}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {proyecto.cod_proyecto_interno || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {proyecto.clientes?.nombre || '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => onEdit(proyecto.id_proyecto)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold"
                      >
                        <Edit size={16} />
                        Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
