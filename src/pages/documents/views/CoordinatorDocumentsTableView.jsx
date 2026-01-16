import { useMemo } from 'react'
import Table from '@/components/common/table'

function formatNumber(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '-'
  return new Intl.NumberFormat('es-AR').format(n)
}

function formatPercent(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '-'
  return `${n.toFixed(1)}%`
}

export default function CoordinatorDocumentsTableView({
  proyecto,
  rows = [],
  loading = false,
}) {
  const columns = useMemo(() => {
    return [
      {
        header: 'DOCUMENTO',
        key: 'codigo_documento',
        render: (r) =>
          r.__total ? '' : (r.codigo_documento ?? r.codigo_documento_base ?? '-'),
      },
      {
        header: 'COD INTERNO',
        key: 'cod_interno',
        render: (r) =>
          r.__total ? <strong>TOTAL</strong> : (r.cod_interno ?? '-'),
      },
      {
        header: 'COD CLIENTE',
        key: 'cod_cliente',
        render: (r) => (r.__total ? '' : (r.cod_cliente ?? '-')),
      },
      {
        header: 'REV',
        key: 'rev',
        render: (r) => (r.__total ? '' : (r.rev ?? '-')),
      },
      {
        header: 'hhTotal',
        key: 'hh_total',
        align: 'center',
        render: (r) => (r.__total ? <strong>{formatNumber(r.hh_total)}</strong> : formatNumber(r.hh_total)),
      },
      {
        header: 'hhCargadas',
        key: 'hh_cargadas',
        align: 'center',
        render: (r) =>
          r.__total ? <strong>{formatNumber(r.hh_cargadas)}</strong> : formatNumber(r.hh_cargadas),
      },
      {
        header: '%Avance Proyecto',
        key: 'avance_proyecto_pct',
        align: 'center',
        render: (r) =>
          r.__total ? <strong>{formatPercent(r.avance_proyecto_pct)}</strong> : formatPercent(r.avance_proyecto_pct),
      },
      {
        header: '%Avance HH',
        key: 'avance_hh_pct',
        align: 'center',
        render: (r) =>
          r.__total ? <strong>{formatPercent(r.avance_hh_pct)}</strong> : formatPercent(r.avance_hh_pct),
      },
    ]
  }, [])

  const title = proyecto?.nombre ? `Tablero de documentación - ${proyecto.nombre}` : 'Tablero de documentación'

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">{title}</div>
      <Table
        data={rows}
        columns={columns}
        loading={loading}
        rowKey={(r, idx) => (r.__total ? 'total' : r.id_documento ?? idx)}
        emptyMessage="No hay documentos para mostrar."
        search={{
          label: 'Buscar documento',
          placeholder: 'Código o descripción...',
          fields: [
            { value: 'codigo_documento_base', label: 'Código', path: 'codigo_documento_base' },
            { value: 'descripcion', label: 'Descripción', path: 'descripcion' },
          ],
          initialField: 'codigo_documento_base',
        }}
      />
    </div>
  )
}

