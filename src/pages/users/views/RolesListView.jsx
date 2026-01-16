import { useMemo } from 'react'
import Table from '@/components/common/table'
import { Edit, Trash2 } from 'lucide-react'

export default function RolesListView({ roles = [], loading = false, onEdit, onDelete }) {
  const columns = useMemo(() => {
    return [
      {
        header: 'ID',
        key: 'id_rol',
        render: (r) => r?.id_rol ?? '-',
        cellClassName: 'text-gray-900',
      },
      {
        header: 'Nombre',
        key: 'nombre_rol',
        accessor: 'nombre_rol',
        cellClassName: 'text-gray-900 font-medium',
      },
      {
        header: 'Descripción',
        key: 'descripcion',
        render: (r) => r?.descripcion || '-',
      },
      {
        header: 'Acciones',
        key: 'acciones',
        align: 'center',
        cellClassName: 'text-center',
        render: (r) => (
          <div className="inline-flex items-center gap-2 justify-center">
            <button
              onClick={() => onEdit?.(r.id_rol)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold"
            >
              <Edit size={16} />
              Editar
            </button>
            <button
              onClick={() => onDelete?.(r)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
            >
              <Trash2 size={16} />
              Eliminar
            </button>
          </div>
        ),
      },
    ]
  }, [onEdit])

  return (
    <Table
      data={roles}
      rowKey="id_rol"
      loading={loading}
      emptyMessage="No hay roles disponibles"
      columns={columns}
      search={{
        label: 'Buscar',
        placeholder: 'Buscar rol...',
        fields: [
          { value: 'nombre_rol', label: 'Nombre', path: 'nombre_rol' },
          { value: 'descripcion', label: 'Descripción', path: 'descripcion' },
          { value: 'id_rol', label: 'ID', path: 'id_rol' },
        ],
      }}
    />
  )
}

