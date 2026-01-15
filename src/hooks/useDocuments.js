import { useCallback, useMemo, useState } from 'react'
import { supabase } from '../api/supabase'

function normalizeTipo(value) {
  return String(value ?? '').trim().toUpperCase()
}

function buildCodigoDocumentoBase({
  yacimiento,
  instalacion,
  cod_proyecto_cliente,
  disciplinaTipo,
  tipoDocTipo,
  nro_consecutivo,
}) {
  const y = String(yacimiento ?? '').trim()
  const i = String(instalacion ?? '').trim()
  const c = String(cod_proyecto_cliente ?? '').trim()
  const d = String(disciplinaTipo ?? '').trim()
  const t = String(tipoDocTipo ?? '').trim()
  const n = String(nro_consecutivo ?? '').trim()
  return `${y}-${i}-${c}-${d}-${t}-${n}`
}

export function useDocuments() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const clearError = useCallback(() => setError(''), [])

  const fetchTipoDocumento = useCallback(async () => {
    const { data, error: qErr } = await supabase
      .from('tipo_documento')
      .select('*')
      .order('tipo', { ascending: true })
    if (qErr) throw qErr
    return data || []
  }, [])

  const fetchDisciplinas = useCallback(async () => {
    const { data, error: qErr } = await supabase
      .from('disciplinas')
      .select('*')
      .order('tipo', { ascending: true })
    if (qErr) throw qErr
    return data || []
  }, [])

  const fetchDocumentsByProject = useCallback(async (id_proyecto) => {
    const { data, error: qErr } = await supabase
      .from('documentos')
      .select(
        `
        *,
        disciplinas_de_proyectos (
          id_disciplina_proy,
          id_proyecto,
          disciplinas ( id_disciplina, tipo, descripcion )
        ),
        tipo_documento ( id_tipo_doc, tipo, descripcion )
      `
      )
      .eq('disciplinas_de_proyectos.id_proyecto', id_proyecto)
      .order('id_documento', { ascending: false })
    if (qErr) throw qErr
    return data || []
  }, [])

  const fetchDisciplinasDeProyecto = useCallback(async (id_proyecto) => {
    const { data, error: qErr } = await supabase
      .from('disciplinas_de_proyectos')
      .select(
        `
        id_disciplina_proy,
        id_proyecto,
        disciplinas ( id_disciplina, tipo, descripcion )
      `
      )
      .eq('id_proyecto', id_proyecto)
      .order('id_disciplina_proy', { ascending: true })
    if (qErr) throw qErr
    return data || []
  }, [])

  const ensureDisciplinaProy = useCallback(async ({ id_proyecto, id_disciplina }) => {
    const { data: existing, error: selErr } = await supabase
      .from('disciplinas_de_proyectos')
      .select('id_disciplina_proy')
      .eq('id_proyecto', id_proyecto)
      .eq('id_disciplina', id_disciplina)
      .maybeSingle()
    if (selErr) throw selErr
    if (existing?.id_disciplina_proy) return existing.id_disciplina_proy

    const { data: inserted, error: insErr } = await supabase
      .from('disciplinas_de_proyectos')
      .insert([{ id_proyecto, id_disciplina }])
      .select('id_disciplina_proy')
      .single()
    if (insErr) throw insErr
    return inserted.id_disciplina_proy
  }, [])

  const updateDocumento = useCallback(
    async ({ proyecto, documentoId, values, disciplinas, tiposDocumento }) => {
      setLoading(true)
      setError('')
      try {
        const projectClientCode = proyecto?.cod_proyecto_cliente
        if (projectClientCode == null || String(projectClientCode).trim() === '') {
          throw new Error('El proyecto no tiene "cod_proyecto_cliente".')
        }

        const disciplinaId = values.id_disciplina ? Number(values.id_disciplina) : null
        const tipoDocId = values.id_tipo_documento ? Number(values.id_tipo_documento) : null
        if (!disciplinaId) throw new Error('Disciplina inválida.')
        if (!tipoDocId) throw new Error('Tipo documento inválido.')

        const disciplina = (disciplinas || []).find(
          (d) => Number(d.id_disciplina) === Number(disciplinaId)
        )
        const tipoDoc = (tiposDocumento || []).find(
          (t) => Number(t.id_tipo_doc) === Number(tipoDocId)
        )
        if (!disciplina) throw new Error('La disciplina seleccionada no existe.')
        if (!tipoDoc) throw new Error('El tipo de documento seleccionado no existe.')

        const id_disciplina_proy = await ensureDisciplinaProy({
          id_proyecto: proyecto.id_proyecto,
          id_disciplina: disciplina.id_disciplina,
        })

        const codigo_documento_base = buildCodigoDocumentoBase({
          yacimiento: values.yacimiento,
          instalacion: values.instalacion,
          cod_proyecto_cliente: projectClientCode,
          disciplinaTipo: normalizeTipo(disciplina.tipo),
          tipoDocTipo: normalizeTipo(tipoDoc.tipo),
          nro_consecutivo: values.nro_consecutivo,
        })

        if (!values.tipo_archivo) {
          throw new Error('TIPO ARCHIVO es obligatorio para formar el campo archivo.')
        }
        const archivo = `${codigo_documento_base}.${values.tipo_archivo}`

        const hh_estimadas = (Number(values.hh_internas) || 0) + (Number(values.hh_externas) || 0)

        const patch = {
          id_disciplina_proy,
          id_tipo_documento: tipoDocId,
          yacimiento: values.yacimiento || null,
          instalacion: values.instalacion || null,
          nro_consecutivo: values.nro_consecutivo == null || values.nro_consecutivo === '' ? null : Number(values.nro_consecutivo),
          descripcion: values.descripcion || null,
          tipo_archivo: values.tipo_archivo || null,
          tipo_accion: values.tipo_accion || null,
          formato_hojas: values.formato_hojas || null,
          nro_hojas: values.nro_hojas == null || values.nro_hojas === '' ? null : Number(values.nro_hojas),
          hh_internas: values.hh_internas == null || values.hh_internas === '' ? null : Number(values.hh_internas),
          hh_externas: values.hh_externas == null || values.hh_externas === '' ? null : Number(values.hh_externas),
          hh_estimadas,
          nro_sub_proyecto:
            values.nro_sub_proyecto == null || values.nro_sub_proyecto === '' ? null : Number(values.nro_sub_proyecto),
          fecha_base: values.fecha_base || null,
          fecha_emision_prevista: values.fecha_emision_prevista || null,
          codigo_documento_base,
          archivo,
        }

        const { data, error: updErr } = await supabase
          .from('documentos')
          .update(patch)
          .eq('id_documento', documentoId)
          .select(
            `
            *,
            disciplinas_de_proyectos (
              id_disciplina_proy,
              id_proyecto,
              disciplinas ( id_disciplina, tipo, descripcion )
            ),
            tipo_documento ( id_tipo_doc, tipo, descripcion )
          `
          )
          .single()
        if (updErr) throw updErr
        return data
      } catch (e) {
        setError(e?.message || 'Error al actualizar documento.')
        throw e
      } finally {
        setLoading(false)
      }
    },
    [ensureDisciplinaProy]
  )

  const deleteDocumento = useCallback(async (id_documento) => {
    setLoading(true)
    setError('')
    try {
      const { error: delErr } = await supabase
        .from('documentos')
        .delete()
        .eq('id_documento', id_documento)
      if (delErr) throw delErr
    } catch (e) {
      setError(e?.message || 'Error al eliminar documento.')
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  return useMemo(
    () => ({
      loading,
      error,
      clearError,
      fetchTipoDocumento,
      fetchDisciplinas,
      fetchDisciplinasDeProyecto,
      fetchDocumentsByProject,
      updateDocumento,
      deleteDocumento,
    }),
    [
      loading,
      error,
      clearError,
      fetchTipoDocumento,
      fetchDisciplinas,
      fetchDisciplinasDeProyecto,
      fetchDocumentsByProject,
      updateDocumento,
      deleteDocumento,
    ]
  )
}

