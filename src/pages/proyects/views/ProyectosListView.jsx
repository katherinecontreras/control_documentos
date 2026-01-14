import { useMemo, useState } from 'react'
import Table from '@/components/common/table'
import { Edit } from 'lucide-react'

export default function ProyectosListView({ proyectos, clientes, loading, onEdit }) {
  const [filterCliente, setFilterCliente] = useState('')

  // Formatear opciones de clientes para el Select
  const clientesOptions = useMemo(() => {
    return clientes.map((cliente) => ({
      id: cliente.id_cliente || cliente.id,
      nombre: cliente.nombre || cliente.nombre_cliente,
    }))
  }, [clientes])

  const columns = useMemo(() => {
    return [
      {
        header: 'Nombre',
        key: 'nombre',
        accessor: 'nombre',
        cellClassName: 'text-gray-900',
      },
      {
        header: 'Código Cliente',
        key: 'cod_proyecto_cliente',
        render: (proyecto) => proyecto.cod_proyecto_cliente || '-',
      },
      {
        header: 'Código Interno',
        key: 'cod_proyecto_interno',
        render: (proyecto) => proyecto.cod_proyecto_interno || '-',
      },
      {
        header: 'Cliente',
        key: 'cliente',
        render: (proyecto) => proyecto.clientes?.nombre || '-',
      },
      {
        header: 'Acciones',
        key: 'acciones',
        align: 'center',
        cellClassName: 'text-center',
        render: (proyecto) => (
          <button
            onClick={() => onEdit(proyecto.id_proyecto)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold"
          >
            <Edit size={16} />
            Editar
          </button>
        ),
      },
    ]
  }, [onEdit])

  return (
    <Table
      data={proyectos}
      rowKey="id_proyecto"
      loading={loading}
      emptyMessage="No hay proyectos disponibles"
      columns={columns}
      search={{
        label: 'Buscar',
        placeholder: 'Buscar proyecto...',
        fields: [{ value: 'nombre', label: 'Nombre', path: 'nombre' }],
      }}
      filters={[
        {
          type: 'select',
          label: 'Cliente',
          value: filterCliente,
          onChange: setFilterCliente,
          options: clientesOptions,
          predicate: (proyecto, value) =>
            !value ||
            (proyecto.clientes &&
              (proyecto.clientes.id_cliente || proyecto.clientes.id)?.toString() ===
                value),
        },
      ]}
    />
  )
}
