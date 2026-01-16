import { useMemo, useState } from 'react'
import Table from '@/components/common/table'
import { Edit, Trash2 } from 'lucide-react'

export default function UsersListView({
  usuarios = [],
  roles = [],
  disciplinas = [],
  loading = false,
  onEdit,
  onDelete,
}) {
  const [filterRol, setFilterRol] = useState('')
  const [filterDisciplina, setFilterDisciplina] = useState('')

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

  const columns = useMemo(() => {
    return [
      {
        header: 'Nombre',
        key: 'nombre',
        render: (u) => `${u?.nombre || ''} ${u?.apellido || ''}`.trim() || '-',
        cellClassName: 'text-gray-900 font-medium',
      },
      {
        header: 'Email',
        key: 'email_empresa',
        accessor: 'email_empresa',
      },
      {
        header: 'Rol',
        key: 'rol',
        render: (u) => u?.roles?.nombre_rol || '-',
      },
      {
        header: 'Disciplina',
        key: 'disciplina',
        render: (u) =>
          u?.disciplinas?.tipo
            ? `${u.disciplinas.tipo} - ${u.disciplinas.descripcion || ''}`.trim()
            : '-',
      },
      {
        header: 'DNI',
        key: 'dni',
        render: (u) => (u?.dni != null ? u.dni : '-'),
      },
      {
        header: 'Líder',
        key: 'lider_equipo',
        align: 'center',
        cellClassName: 'text-center',
        render: (u) => (u?.lider_equipo ? 'Sí' : 'No'),
      },
      {
        header: 'Acciones',
        key: 'acciones',
        align: 'center',
        cellClassName: 'text-center',
        render: (u) => (
          <div className="inline-flex items-center gap-2 justify-center">
            <button
              onClick={() => onEdit?.(u.id_usuario)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold"
            >
              <Edit size={16} />
              Editar
            </button>
            <button
              onClick={() => onDelete?.(u)}
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
      data={usuarios}
      rowKey="id_usuario"
      loading={loading}
      emptyMessage="No hay usuarios disponibles"
      columns={columns}
      search={{
        label: 'Buscar',
        placeholder: 'Buscar usuario...',
        fields: [
          { value: 'nombre', label: 'Nombre', path: 'nombre' },
          { value: 'apellido', label: 'Apellido', path: 'apellido' },
          { value: 'email_empresa', label: 'Email', path: 'email_empresa' },
          { value: 'dni', label: 'DNI', path: 'dni' },
        ],
      }}
      filters={[
        {
          type: 'select',
          label: 'Rol',
          value: filterRol,
          onChange: setFilterRol,
          options: rolesOptions,
          predicate: (u, value) =>
            !value ||
            (u.roles && (u.roles.id_rol || u.roles.id)?.toString() === value),
        },
        {
          type: 'select',
          label: 'Disciplina',
          value: filterDisciplina,
          onChange: setFilterDisciplina,
          options: disciplinasOptions,
          predicate: (u, value) =>
            !value ||
            (u.disciplinas &&
              (u.disciplinas.id_disciplina || u.disciplinas.id)?.toString() ===
                value),
        },
      ]}
    />
  )
}

