import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import LoadingData from './loadingData'
import Input from './input'
import Select from './select'

function getByPath(obj, path) {
  if (!obj || !path) return undefined
  const parts = Array.isArray(path) ? path : String(path).split('.')
  return parts.reduce((acc, key) => (acc == null ? undefined : acc[key]), obj)
}

function toSearchableString(value) {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

/**
 * Table reutilizable con el diseño actual del listado de Proyectos.
 *
 * Props principales:
 * - data: array de filas
 * - columns: [{ header, key?, accessor?, render?, headerClassName?, cellClassName?, align? }]
 * - rowKey: string | (row) => string|number
 * - search: { label?, placeholder?, fields?: [{ value, label, path?, getValue? }], initialField? }
 * - filters: [{ type:'select', label, value, onChange, options, className?, predicate?, path? }]
 */
export default function Table({
  data = [],
  columns = [],
  rowKey = 'id',
  loading = false,
  emptyMessage = 'No hay registros disponibles',
  search,
  filters = [],
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchField, setSearchField] = useState(() => {
    if (!search) return ''
    return (
      search.initialField ||
      (Array.isArray(search.fields) && search.fields[0]?.value) ||
      ''
    )
  })

  const searchFieldOptions = useMemo(() => {
    if (!search?.fields || !Array.isArray(search.fields)) return []
    return search.fields.map((f) => ({ id: f.value, nombre: f.label }))
  }, [search?.fields])

  const filteredData = useMemo(() => {
    let result = Array.isArray(data) ? data : []

    // Filtros
    for (const filter of filters || []) {
      if (!filter) continue
      if (filter.type !== 'select') continue
      if (filter.value === '' || filter.value == null) continue

      if (typeof filter.predicate === 'function') {
        result = result.filter((row) => filter.predicate(row, filter.value))
        continue
      }

      if (filter.path) {
        result = result.filter((row) => {
          const v = getByPath(row, filter.path)
          return String(v ?? '') === String(filter.value)
        })
      }
    }

    // Búsqueda
    const q = searchQuery.trim().toLowerCase()
    if (search && q) {
      const fields = Array.isArray(search.fields) ? search.fields : []
      const selected = fields.find((f) => f.value === searchField) || fields[0]

      result = result.filter((row) => {
        if (!selected) return true
        let value
        if (typeof selected.getValue === 'function') {
          value = selected.getValue(row)
        } else if (selected.path) {
          value = getByPath(row, selected.path)
        } else if (selected.value) {
          value = getByPath(row, selected.value)
        }
        return toSearchableString(value).toLowerCase().includes(q)
      })
    }

    return result
  }, [data, filters, search, searchField, searchQuery])

  const getRowKey = (row, index) => {
    if (typeof rowKey === 'function') return rowKey(row, index)
    if (typeof rowKey === 'string') return row?.[rowKey] ?? index
    return index
  }

  if (loading) {
    return (
      <div className="p-8">
        <LoadingData />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Búsqueda + Filtros */}
      {(search || (filters && filters.length > 0)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {search && (
            <>
              {searchFieldOptions.length > 1 && (
                <Select
                  label="Buscar por"
                  value={searchField}
                  onChange={setSearchField}
                  options={searchFieldOptions}
                />
              )}
              <Input
                label={search.label || 'Buscar'}
                type="text"
                placeholder={search.placeholder || 'Buscar...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={search.icon || <Search size={20} />}
              />
            </>
          )}

          {(filters || [])
            .filter((f) => f && f.type === 'select')
            .map((filter, idx) => (
              <Select
                key={`${filter.label}-${idx}`}
                className={filter.className}
                label={filter.label}
                value={filter.value}
                onChange={filter.onChange}
                options={filter.options || []}
              />
            ))}
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-purple-600 text-white">
              <tr>
                {columns.map((col, idx) => (
                  <th
                    key={col.key || col.header || idx}
                    className={[
                      'px-6 py-4 text-sm font-semibold',
                      col.align === 'center' ? 'text-center' : 'text-left',
                      col.headerClassName || '',
                    ].join(' ')}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length || 1}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                filteredData.map((row, index) => (
                  <tr
                    key={getRowKey(row, index)}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {columns.map((col, cIdx) => {
                      const content =
                        typeof col.render === 'function'
                          ? col.render(row)
                          : typeof col.accessor === 'function'
                            ? col.accessor(row)
                            : col.accessor
                              ? getByPath(row, col.accessor)
                              : col.key
                                ? row?.[col.key]
                                : ''

                      return (
                        <td
                          key={col.key || col.header || cIdx}
                          className={[
                            'px-6 py-4 text-sm',
                            col.align === 'center'
                              ? 'text-center'
                              : 'text-left text-gray-600',
                            col.cellClassName || '',
                          ].join(' ')}
                        >
                          {content ?? '-'}
                        </td>
                      )
                    })}
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
