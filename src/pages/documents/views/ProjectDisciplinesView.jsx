import Card from '@/components/common/card'

export default function ProjectDisciplinesView({
  disciplinas = [],
  loading = false,
  onSelect,
}) {
  if (loading) {
    return (
      <div className="py-10 text-center text-gray-600">
        Cargando disciplinas...
      </div>
    )
  }

  if (!disciplinas || disciplinas.length === 0) {
    return (
      <div className="py-10 text-center text-gray-600">
        Este proyecto no tiene disciplinas asociadas.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {disciplinas.map((d) => (
        <Card
          key={d.id_disciplina_proy}
          onClick={() => onSelect?.(d)}
        >
          <div className="text-xs text-gray-500 mb-2">Disciplina</div>
          <div className="font-semibold text-purple-700">
            {d?.disciplinas?.tipo || '-'}
          </div>
          {d?.disciplinas?.descripcion ? (
            <div className="text-sm text-gray-600 mt-2">
              {d.disciplinas.descripcion}
            </div>
          ) : null}
          {typeof d.documentCount === 'number' ? (
            <div className="text-xs text-gray-500 mt-3">
              Documentos: {d.documentCount}
            </div>
          ) : null}
        </Card>
      ))}
    </div>
  )
}

