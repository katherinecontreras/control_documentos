import { useCallback, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { supabase } from '../api/supabase'

const EXPECTED_HEADERS = [
  'YACIMIENTO',
  'INSTALACION',
  'DISCIPLINA',
  'TIPO DOC',
  'NRO DOC',
  'DESCRIPCION',
  'TIPO ARCHIVO',
  'HRS INT',
  'HRS EXT',
  'FORMATO HOJAS',
  'CANT HOJAS',
  'Calificable 1, Informativo 2',
  'FECHA BASE',
  'FECHA EMISION',
  'COD CLIENTE',
  'COD PROYECTO',
  'SUB PROYECTO',
]

function normalizeCell(value) {
  if (value == null) return ''
  if (typeof value === 'string') return value.trim()
  return value
}

function normalizeTipo(value) {
  const v = String(value ?? '').trim()
  return v.toUpperCase()
}

function parseIntOrNull(value, { fieldName, rowNumber }) {
  const v = normalizeCell(value)
  if (v === '') return null
  if (typeof v === 'string') {
    // A veces el Excel trae caracteres “invisibles” aunque se vea vacío
    const compact = v.replace(/\s|\u200B|\u200C|\u200D|\uFEFF/g, '')
    if (compact === '') return null

    // Marcadores comunes que el usuario usa como “vacío”
    if (/^(?:-|\u2013|\u2014|\u2212)+$/.test(compact)) return null
  }
  const raw = typeof v === 'number' ? v : String(v).replace(/\s|\u200B|\u200C|\u200D|\uFEFF/g, '')
  const n = typeof raw === 'number' ? raw : Number(String(raw).replace(',', '.'))
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    throw new Error(
      `Fila ${rowNumber}: "${fieldName}" debe ser un número entero (o dejarse vacío). ` +
        `Valor detectado: "${String(v)}".`
    )
  }
  return n
}

function parseTipoAccionFromM(value, { rowNumber }) {
  const v = normalizeCell(value)
  if (v === '') return null
  const n = typeof v === 'number' ? v : Number(String(v).trim())
  if (n !== 1 && n !== 2) {
    throw new Error(
      `Fila ${rowNumber}: la columna "Calificable 1, Informativo 2" debe ser 1 o 2.`
    )
  }
  return n === 1 ? 'Calificable' : 'Informativo'
}

function ensureMaxLen(value, maxLen, { fieldName, rowNumber }) {
  if (value == null || value === '') return value
  const s = String(value)
  if (s.length > maxLen) {
    throw new Error(`Fila ${rowNumber}: "${fieldName}" supera el largo máximo (${maxLen}).`)
  }
  return value
}

function formatAsISODate(value) {
  if (!value) return null
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10)
  }
  // Si viene como string tipo YYYY-MM-DD
  const s = String(value).trim()
  if (!s) return null
  // Aceptar DD/MM/YYYY también
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  return s // dejarlo tal cual; Postgres suele castear o fallará y lo reportaremos
}

function buildCodigoDocumentoBase({
  yacimiento,
  instalacion,
  cod_proyecto_cliente,
  disciplinaTipo,
  tipoDocTipo,
  nro_consecutivo,
  rowNumber,
}) {
  const y = String(yacimiento ?? '').trim()
  const i = String(instalacion ?? '').trim()
  const c = String(cod_proyecto_cliente ?? '').trim()
  const d = String(disciplinaTipo ?? '').trim()
  const t = String(tipoDocTipo ?? '').trim()

  if (!y) throw new Error(`Fila ${rowNumber}: "YACIMIENTO" es obligatorio para formar codigo_documento_base.`)
  if (!i) throw new Error(`Fila ${rowNumber}: "INSTALACION" es obligatorio para formar codigo_documento_base.`)
  if (!c) {
    throw new Error(
      `El proyecto no tiene "cod_proyecto_cliente". Es obligatorio para formar codigo_documento_base.`
    )
  }
  if (!d) throw new Error(`Fila ${rowNumber}: "DISCIPLINA" es obligatorio para formar codigo_documento_base.`)
  if (!t) throw new Error(`Fila ${rowNumber}: "TIPO DOC" es obligatorio para formar codigo_documento_base.`)
  if (nro_consecutivo == null || nro_consecutivo === '') {
    throw new Error(`Fila ${rowNumber}: "NRO DOC" es obligatorio para formar codigo_documento_base.`)
  }

  return `${y}-${i}-${c}-${d}-${t}-${nro_consecutivo}`
}

function normalizeCodigoBase(value) {
  // Normalización agresiva para evitar falsos duplicados por espacios/case
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
}

function validateHeaders(headerRow) {
  const got = (headerRow || []).slice(0, EXPECTED_HEADERS.length).map((h) => String(h ?? '').trim())
  for (let i = 0; i < EXPECTED_HEADERS.length; i++) {
    if (got[i] !== EXPECTED_HEADERS[i]) {
      throw new Error(
        `Header inválido en columna ${String.fromCharCode(65 + i)}. ` +
          `Se esperaba "${EXPECTED_HEADERS[i]}" y llegó "${got[i] || '(vacío)'}".`
      )
    }
  }
}

function isRowEmpty(cells) {
  return (cells || []).every((c) => {
    const v = normalizeCell(c)
    return v === '' || v == null
  })
}

export function useDocumentsExcel() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const clearError = useCallback(() => setError(''), [])

  const fetchDocumentsByProject = useCallback(async (id_proyecto) => {
    const { data, error: qErr } = await supabase
      .from('documentos')
      .select(
        `
        id_documento,
        id_disciplina_proy,
        id_tipo_documento,
        codigo_documento_base,
        archivo,
        estado,
        hh_estimadas,
        nro_sub_proyecto,
        yacimiento,
        instalacion,
        nro_consecutivo,
        descripcion,
        tipo_archivo,
        hh_internas,
        hh_externas,
        formato_hojas,
        nro_hojas,
        tipo_accion,
        fecha_base,
        fecha_emision_prevista,
        disciplinas_de_proyectos (
          id_disciplina_proy,
          id_proyecto,
          disciplinas ( id_disciplina, tipo )
        ),
        tipo_documento ( id_tipo_doc, tipo )
      `
      )
      .eq('disciplinas_de_proyectos.id_proyecto', id_proyecto)
      .order('id_documento', { ascending: true })

    if (qErr) throw qErr
    return data || []
  }, [])

  const fetchCodigoBasesByProject = useCallback(async (id_proyecto) => {
    // Importante: evitar filtros sobre embeds (pueden no filtrar la tabla raíz sin !inner)
    // 1) Traer ids de disciplinas_de_proyectos del proyecto
    const { data: dp, error: dpErr } = await supabase
      .from('disciplinas_de_proyectos')
      .select('id_disciplina_proy')
      .eq('id_proyecto', id_proyecto)
    if (dpErr) throw dpErr

    const ids = (dp || []).map((x) => x.id_disciplina_proy).filter(Boolean)
    if (ids.length === 0) return []

    // 2) Traer códigos base solo de esos documentos
    const { data: docs, error: docsErr } = await supabase
      .from('documentos')
      .select('codigo_documento_base')
      .in('id_disciplina_proy', ids)
    if (docsErr) throw docsErr

    return (docs || [])
      .map((r) => normalizeCodigoBase(r?.codigo_documento_base))
      .filter(Boolean)
  }, [])

  const downloadProjectDocumentsExcel = useCallback(
    async (proyecto) => {
      setLoading(true)
      setError('')
      try {
        const docs = await fetchDocumentsByProject(proyecto.id_proyecto)
        const codCliente = proyecto?.cod_proyecto_cliente ?? null
        const codProyecto = proyecto?.cod_proyecto_interno ?? null

        const sortedDocs = [...(docs || [])].sort((a, b) => {
          const da = String(a?.disciplinas_de_proyectos?.disciplinas?.tipo ?? '')
          const db = String(b?.disciplinas_de_proyectos?.disciplinas?.tipo ?? '')
          const byDisc = da.localeCompare(db)
          if (byDisc !== 0) return byDisc
          const na = Number(a?.nro_consecutivo ?? 0)
          const nb = Number(b?.nro_consecutivo ?? 0)
          return na - nb
        })

        const wb = new ExcelJS.Workbook()
        const ws = wb.addWorksheet('Documentos', { views: [{ state: 'frozen', ySplit: 1 }] })

        // ExcelJS usa "width" aprox en caracteres. Convertimos px → chars (aprox /7).
        const pxToChars = (px) => Math.max(6, Math.round(px / 7))

        ws.columns = [
          { header: EXPECTED_HEADERS[0], key: 'a', width: pxToChars(110) }, // YACIMIENTO
          { header: EXPECTED_HEADERS[1], key: 'b', width: pxToChars(140) }, // INSTALACION
          { header: EXPECTED_HEADERS[2], key: 'c', width: pxToChars(90) }, // DISCIPLINA
          { header: EXPECTED_HEADERS[3], key: 'd', width: pxToChars(90) }, // TIPO DOC
          { header: EXPECTED_HEADERS[4], key: 'e', width: pxToChars(90) }, // NRO DOC
          { header: EXPECTED_HEADERS[5], key: 'f', width: pxToChars(405) }, // DESCRIPCION
          { header: EXPECTED_HEADERS[6], key: 'g', width: pxToChars(105) }, // TIPO ARCHIVO
          { header: EXPECTED_HEADERS[7], key: 'h', width: pxToChars(60) }, // HRS INT
          { header: EXPECTED_HEADERS[8], key: 'i', width: pxToChars(60) }, // HRS EXT
          { header: EXPECTED_HEADERS[9], key: 'j', width: pxToChars(120) }, // FORMATO HOJAS
          { header: EXPECTED_HEADERS[10], key: 'k', width: pxToChars(80) }, // CANT HOJAS
          { header: EXPECTED_HEADERS[11], key: 'l', width: pxToChars(185) }, // Calificable 1, Informativo 2
          { header: EXPECTED_HEADERS[12], key: 'm', width: pxToChars(110) }, // FECHA BASE
          { header: EXPECTED_HEADERS[13], key: 'n', width: pxToChars(110) }, // FECHA EMISION
          { header: EXPECTED_HEADERS[14], key: 'o', width: pxToChars(120) }, // COD CLIENTE
          { header: EXPECTED_HEADERS[15], key: 'p', width: pxToChars(110) }, // COD PROYECTO
          { header: EXPECTED_HEADERS[16], key: 'q', width: pxToChars(110) }, // SUB PROYECTO
        ]

        const headerRow = ws.getRow(1)
        headerRow.height = 24
        headerRow.eachCell((cell) => {
          cell.font = { bold: true, color: { argb: '111827' } }
          cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'CFEFFF' },
          }
          cell.border = {
            top: { style: 'thin', color: { argb: '93C5FD' } },
            left: { style: 'thin', color: { argb: '93C5FD' } },
            bottom: { style: 'thin', color: { argb: '93C5FD' } },
            right: { style: 'thin', color: { argb: '93C5FD' } },
          }
        })

        for (const d of sortedDocs) {
          const disciplinaTipo = d?.disciplinas_de_proyectos?.disciplinas?.tipo ?? ''
          const tipoDocTipo = d?.tipo_documento?.tipo ?? ''
          const tipoAccionNum =
            d?.tipo_accion === 'Calificable'
              ? 1
              : d?.tipo_accion === 'Informativo'
                ? 2
                : null

          ws.addRow({
            a: d?.yacimiento ?? null,
            b: d?.instalacion ?? null,
            c: disciplinaTipo ?? null,
            d: tipoDocTipo ?? null,
            e: d?.nro_consecutivo ?? null,
            f: d?.descripcion ?? null,
            g: d?.tipo_archivo ?? null,
            h: d?.hh_internas ?? null,
            i: d?.hh_externas ?? null,
            j: d?.formato_hojas ?? null,
            k: d?.nro_hojas ?? null,
            l: tipoAccionNum,
            m: d?.fecha_base ?? null,
            n: d?.fecha_emision_prevista ?? null,
            o: codCliente,
            p: codProyecto,
            q: d?.nro_sub_proyecto ?? null,
          })
        }

        const safeName = String(proyecto?.nombre || 'proyecto')
          .trim()
          .replace(/[\\/:*?"<>|]+/g, '-')
        const date = new Date().toISOString().slice(0, 10)
        const filename = `documentos_${safeName}_${date}.xlsx`

        const buffer = await wb.xlsx.writeBuffer()
        saveAs(
          new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          }),
          filename
        )
      } catch (e) {
        setError(e?.message || 'Error al descargar el Excel.')
        throw e
      } finally {
        setLoading(false)
      }
    },
    [fetchDocumentsByProject]
  )

  const uploadProjectDocumentsExcel = useCallback(
    async ({ proyecto, file }) => {
      setLoading(true)
      setError('')
      try {
        if (!proyecto?.id_proyecto) throw new Error('Proyecto inválido.')
        if (!file) throw new Error('Selecciona un archivo Excel primero.')

        let buffer
        try {
          buffer = await file.arrayBuffer()
        } catch (_e) {
          // Error típico del navegador: NotReadableError / permisos / archivo movido
          throw new Error(
            'No se pudo leer el archivo seleccionado. Vuelve a seleccionarlo (botón Cambiar/Seleccionar) e intenta de nuevo.'
          )
        }
        const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
        const firstSheetName = wb.SheetNames[0]
        if (!firstSheetName) throw new Error('El archivo no tiene hojas.')

        const ws = wb.Sheets[firstSheetName]
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
        if (!rows || rows.length === 0) throw new Error('El Excel está vacío.')

        validateHeaders(rows[0])

        // Precargas (para validar/relacionar sin hacer 1 query por fila)
        const [
          { data: disciplinasData, error: disciplinasErr },
          { data: tiposDocData, error: tiposDocErr },
          { data: disciplinasProyData, error: disciplinasProyErr },
        ] = await Promise.all([
          supabase.from('disciplinas').select('id_disciplina, tipo'),
          supabase.from('tipo_documento').select('id_tipo_doc, tipo'),
          supabase
            .from('disciplinas_de_proyectos')
            .select('id_disciplina_proy, id_proyecto, disciplinas ( id_disciplina, tipo )')
            .eq('id_proyecto', proyecto.id_proyecto),
        ])

        if (disciplinasErr) throw disciplinasErr
        if (tiposDocErr) throw tiposDocErr
        if (disciplinasProyErr) throw disciplinasProyErr

        const disciplinaByTipo = new Map(
          (disciplinasData || []).map((d) => [normalizeTipo(d.tipo), d])
        )
        const tipoDocByTipo = new Map(
          (tiposDocData || []).map((t) => [normalizeTipo(t.tipo), t])
        )

        const disciplinaProyIdByTipo = new Map(
          (disciplinasProyData || []).map((dp) => [
            normalizeTipo(dp?.disciplinas?.tipo),
            dp.id_disciplina_proy,
          ])
        )

        const projectCode = proyecto.cod_proyecto_interno
        if (projectCode == null || String(projectCode).trim() === '') {
          throw new Error('El proyecto seleccionado no tiene "cod_proyecto_interno".')
        }
        const projectClientCode = proyecto.cod_proyecto_cliente
        if (projectClientCode == null || String(projectClientCode).trim() === '') {
          throw new Error(
            'El proyecto no tiene "cod_proyecto_cliente". Es necesario para formar codigo_documento_base.'
          )
        }

        const parsedRows = []
        const requiredDisciplinaTipos = new Set()
        const baseToFirstRow = new Map()

        for (let rIdx = 1; rIdx < rows.length; rIdx++) {
          const excelRowNumber = rIdx + 1 // 1-based en Excel
          const cells = rows[rIdx]
          if (isRowEmpty(cells)) continue

          const [
            colA, // YACIMIENTO
            colB, // INSTALACION
            colC, // DISCIPLINA
            colD, // TIPO DOC
            colE, // NRO DOC
            colF, // DESCRIPCION
            colG, // TIPO ARCHIVO
            colH, // HRS INT
            colI, // HRS EXT
            colJ, // FORMATO HOJAS
            colK, // CANT HOJAS
            colL, // Calificable 1, Informativo 2
            colM, // FECHA BASE
            colN, // FECHA EMISION
            colO, // COD CLIENTE
            colP, // COD PROYECTO
            colQ, // SUB PROYECTO
          ] = (cells || []).slice(0, EXPECTED_HEADERS.length)

          const rowCodCliente = String(normalizeCell(colO) ?? '').trim()
          const rowCodProyectoRaw = normalizeCell(colP)
          const rowCodProyecto = rowCodProyectoRaw === '' ? null : Number(String(rowCodProyectoRaw).trim())

          if (!rowCodCliente) {
            throw new Error(`Fila ${excelRowNumber}: "COD CLIENTE" es obligatorio.`)
          }
          if (rowCodCliente !== String(projectClientCode).trim()) {
            throw new Error(
              `Fila ${excelRowNumber}: "COD CLIENTE" no coincide con el proyecto seleccionado.`
            )
          }

          if (!Number.isFinite(rowCodProyecto)) {
            throw new Error(`Fila ${excelRowNumber}: "COD PROYECTO" debe ser numérico.`)
          }
          if (Number(rowCodProyecto) !== Number(projectCode)) {
            throw new Error(
              `Fila ${excelRowNumber}: "COD PROYECTO" no coincide con el proyecto seleccionado.`
            )
          }

          const disciplinaTipo = normalizeTipo(colC)
          const tipoDocTipo = normalizeTipo(colD)
          if (!disciplinaTipo) {
            throw new Error(`Fila ${excelRowNumber}: "DISCIPLINA" es obligatoria.`)
          }
          if (!tipoDocTipo) {
            throw new Error(`Fila ${excelRowNumber}: "TIPO DOC" es obligatoria.`)
          }

          const disciplina = disciplinaByTipo.get(disciplinaTipo)
          if (!disciplina) {
            throw new Error(
              `Fila ${excelRowNumber}: la disciplina "${disciplinaTipo}" no existe en la tabla "disciplinas".`
            )
          }

          const tipoDoc = tipoDocByTipo.get(tipoDocTipo)
          if (!tipoDoc) {
            throw new Error(
              `Fila ${excelRowNumber}: el tipo doc "${tipoDocTipo}" no existe en la tabla "tipo_documento".`
            )
          }

          const nro_sub_proyecto = parseIntOrNull(colQ, {
            fieldName: 'SUB PROYECTO',
            rowNumber: excelRowNumber,
          })
          const nro_consecutivo = parseIntOrNull(colE, {
            fieldName: 'NRO DOC',
            rowNumber: excelRowNumber,
          })
          const hh_internas = parseIntOrNull(colH, { fieldName: 'HRS INT', rowNumber: excelRowNumber })
          const hh_externas = parseIntOrNull(colI, { fieldName: 'HRS EXT', rowNumber: excelRowNumber })
          const nro_hojas = parseIntOrNull(colK, { fieldName: 'CANT HOJAS', rowNumber: excelRowNumber })

          const yacimiento = normalizeCell(colA) || null
          const instalacion = normalizeCell(colB) || null
          const descripcion = normalizeCell(colF) || null
          const tipo_archivo = normalizeCell(colG) || null
          const formato_hojas = normalizeCell(colJ) || null
          const tipo_accion = parseTipoAccionFromM(colL, { rowNumber: excelRowNumber })
          const fecha_base = formatAsISODate(colM)
          const fecha_emision_prevista = formatAsISODate(colN)

          // Validaciones de tipo/largo (según esquema)
          ensureMaxLen(disciplinaTipo, 2, { fieldName: 'DISCIPLINA', rowNumber: excelRowNumber })
          ensureMaxLen(tipoDocTipo, 2, { fieldName: 'TIPO DOC', rowNumber: excelRowNumber })
          ensureMaxLen(yacimiento, 4, { fieldName: 'YACIMIENTO', rowNumber: excelRowNumber })
          ensureMaxLen(instalacion, 20, { fieldName: 'INSTALACION', rowNumber: excelRowNumber })
          ensureMaxLen(formato_hojas, 2, { fieldName: 'FORMATO HOJAS', rowNumber: excelRowNumber })
          ensureMaxLen(tipo_archivo, 100, { fieldName: 'TIPO ARCHIVO', rowNumber: excelRowNumber })
          ensureMaxLen(descripcion, 500, { fieldName: 'DESCRIPCION', rowNumber: excelRowNumber })

          if (!tipo_accion) {
            throw new Error(
              `Fila ${excelRowNumber}: "Calificable 1, Informativo 2" es obligatoria y debe ser 1 o 2.`
            )
          }

          const hh_estimadas = (hh_internas ?? 0) + (hh_externas ?? 0)

          const codigo_documento_base = buildCodigoDocumentoBase({
            yacimiento,
            instalacion,
            cod_proyecto_cliente: projectClientCode,
            disciplinaTipo,
            tipoDocTipo,
            nro_consecutivo,
            rowNumber: excelRowNumber,
          })

          const firstRow = baseToFirstRow.get(codigo_documento_base)
          if (firstRow) {
            throw new Error(
              `Documento repetido en el Excel. codigo_documento_base "${codigo_documento_base}" aparece en filas ${firstRow} y ${excelRowNumber}.`
            )
          }
          baseToFirstRow.set(codigo_documento_base, excelRowNumber)

          if (!tipo_archivo) {
            throw new Error(
              `Fila ${excelRowNumber}: "TIPO ARCHIVO" es obligatorio para formar el campo archivo.`
            )
          }

          const archivo = `${codigo_documento_base}.${tipo_archivo}`

          ensureMaxLen(codigo_documento_base, 500, { fieldName: 'codigo_documento_base', rowNumber: excelRowNumber })
          ensureMaxLen(archivo, 500, { fieldName: 'archivo', rowNumber: excelRowNumber })

          requiredDisciplinaTipos.add(disciplinaTipo)
          parsedRows.push({
            excelRowNumber,
            disciplinaTipo,
            disciplinaId: disciplina.id_disciplina,
            tipoDocId: tipoDoc.id_tipo_doc,
            hh_estimadas,
            codigo_documento_base,
            archivo,
            nro_sub_proyecto,
            yacimiento,
            instalacion,
            nro_consecutivo,
            descripcion,
            tipo_archivo,
            hh_internas,
            hh_externas,
            formato_hojas,
            nro_hojas,
            tipo_accion,
            fecha_base,
            fecha_emision_prevista,
          })
        }

        if (parsedRows.length === 0) {
          return { inserted: 0, updated: 0 }
        }

        // Verificar duplicados contra DB (solo dentro del proyecto seleccionado)
        const existingBases = new Set(await fetchCodigoBasesByProject(proyecto.id_proyecto))
        for (const row of parsedRows) {
          const normalized = normalizeCodigoBase(row.codigo_documento_base)
          if (existingBases.has(normalized)) {
            throw new Error(
              `Fila ${row.excelRowNumber}: el documento ya existe en este proyecto (codigo_documento_base repetido): "${row.codigo_documento_base}".`
            )
          }
        }

        // Asegurar disciplinas_de_proyectos necesarias (después de validar todo el Excel)
        const missingDisciplinaTipos = Array.from(requiredDisciplinaTipos).filter(
          (t) => !disciplinaProyIdByTipo.get(t)
        )
        if (missingDisciplinaTipos.length > 0) {
          const insertRows = missingDisciplinaTipos.map((disciplinaTipo) => {
            const row = parsedRows.find((r) => r.disciplinaTipo === disciplinaTipo)
            return { id_disciplina: row.disciplinaId, id_proyecto: proyecto.id_proyecto }
          })

          const { error: dpInsertErr } = await supabase
            .from('disciplinas_de_proyectos')
            .insert(insertRows)
          if (dpInsertErr) throw dpInsertErr

          // Refrescar mapa con lo recién insertado
          const { data: dpRefetch, error: dpRefetchErr } = await supabase
            .from('disciplinas_de_proyectos')
            .select('id_disciplina_proy, id_proyecto, disciplinas ( id_disciplina, tipo )')
            .eq('id_proyecto', proyecto.id_proyecto)
          if (dpRefetchErr) throw dpRefetchErr

          disciplinaProyIdByTipo.clear()
          for (const dp of dpRefetch || []) {
            disciplinaProyIdByTipo.set(
              normalizeTipo(dp?.disciplinas?.tipo),
              dp.id_disciplina_proy
            )
          }
        }

        const pendingInserts = []

        for (const row of parsedRows) {
          const id_disciplina_proy = disciplinaProyIdByTipo.get(row.disciplinaTipo)
          if (!id_disciplina_proy) {
            throw new Error(
              `Fila ${row.excelRowNumber}: no se pudo resolver id_disciplina_proy para disciplina "${row.disciplinaTipo}".`
            )
          }

          const payload = {
            id_disciplina_proy,
            id_tipo_documento: row.tipoDocId,
            hh_estimadas: row.hh_estimadas,
            codigo_documento_base: row.codigo_documento_base,
            archivo: row.archivo,
            estado: 'cargado',
            nro_sub_proyecto: row.nro_sub_proyecto,
            yacimiento: row.yacimiento,
            instalacion: row.instalacion,
            nro_consecutivo: row.nro_consecutivo,
            descripcion: row.descripcion,
            tipo_archivo: row.tipo_archivo,
            hh_internas: row.hh_internas,
            hh_externas: row.hh_externas,
            formato_hojas: row.formato_hojas,
            nro_hojas: row.nro_hojas,
            tipo_accion: row.tipo_accion,
            fecha_base: row.fecha_base,
            fecha_emision_prevista: row.fecha_emision_prevista,
          }
          pendingInserts.push(payload)
        }

        if (pendingInserts.length > 0) {
          const { error: insErr } = await supabase.from('documentos').insert(pendingInserts)
          if (insErr) throw insErr
        }

        return {
          inserted: pendingInserts.length,
          updated: 0,
        }
      } catch (e) {
        setError(e?.message || 'Error al cargar el Excel.')
        throw e
      } finally {
        setLoading(false)
      }
    },
    [fetchCodigoBasesByProject]
  )

  return useMemo(
    () => ({
      loading,
      error,
      clearError,
      expectedHeaders: EXPECTED_HEADERS,
      fetchDocumentsByProject,
      downloadProjectDocumentsExcel,
      uploadProjectDocumentsExcel,
    }),
    [loading, error, clearError, fetchDocumentsByProject, downloadProjectDocumentsExcel, uploadProjectDocumentsExcel]
  )
}

