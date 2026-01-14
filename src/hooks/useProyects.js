import { useState, useEffect } from 'react'
import { supabase } from '../api/supabase'

export function useProyects() {
  const [proyectos, setProyectos] = useState([])
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [estados, setEstados] = useState([])
  const [disciplinas, setDisciplinas] = useState([])
  const [reglasAvance, setReglasAvance] = useState([])

  // Obtener clientes para el formulario
  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nombre')

      if (error) throw error
      setClientes(data || [])
      return { data, error: null }
    } catch (error) {
      console.error('Error al obtener clientes:', error)
      return { data: null, error }
    }
  }

  // Obtener usuarios para el formulario (para responsable del proyecto)
  const fetchUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id_usuario, nombre, apellido, email_empresa')
        .order('nombre', { ascending: true })

      if (error) throw error
      setUsuarios(data || [])
      return { data, error: null }
    } catch (error) {
      console.error('Error al obtener usuarios:', error)
      return { data: null, error }
    }
  }

  // Obtener disciplinas
  const fetchDisciplinas = async () => {
    try {
      const { data, error } = await supabase
        .from('disciplinas')
        .select('*')
        .order('tipo', { ascending: true })

      if (error) throw error
      setDisciplinas(data || [])
      return { data, error: null }
    } catch (error) {
      console.error('Error al obtener disciplinas:', error)
      return { data: null, error }
    }
  }

  // Obtener reglas de avance
  const fetchReglasAvance = async () => {
    try {
      const { data, error } = await supabase
        .from('reglas_de_avance')
        .select('*')
        .order('id_regla', { ascending: true })

      if (error) throw error
      setReglasAvance(data || [])
      return { data, error: null }
    } catch (error) {
      console.error('Error al obtener reglas de avance:', error)
      return { data: null, error }
    }
  }

  // Crear una nueva regla de avance
  const createReglaAvance = async (reglaData) => {
    try {
      const { data, error } = await supabase
        .from('reglas_de_avance')
        .insert([reglaData])
        .select()
        .single()

      if (error) throw error

      // Actualizar la lista de reglas
      setReglasAvance((prev) => [...prev, data])
      return { data, error: null }
    } catch (error) {
      console.error('Error al crear regla de avance:', error)
      return { data: null, error }
    }
  }

  // Obtener estados del proyecto (si existe una tabla estados_proyecto)
  const fetchEstados = async () => {
    try {
      const { data, error } = await supabase
        .from('estados_proyecto')
        .select('*')
        .order('id_estado', { ascending: true })

      if (error) {
        // Si la tabla no existe, no es crítico, simplemente retornamos vacío
        console.warn('Tabla estados_proyecto no encontrada, usando estados por defecto')
        setEstados([])
        return { data: [], error: null }
      }
      setEstados(data || [])
      return { data, error: null }
    } catch (error) {
      console.warn('Error al obtener estados:', error)
      setEstados([])
      return { data: [], error: null }
    }
  }

  // Obtener todos los proyectos con relaciones
  const fetchProyectos = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('proyectos')
        .select(`
          *,
          clientes (*)
        `)
        .order('id_proyecto', { ascending: false })

      if (error) throw error
      setProyectos(data || [])
      return { data, error: null }
    } catch (error) {
      console.error('Error al obtener proyectos:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  // Obtener un proyecto por ID con relaciones
  const getProyectoById = async (id_proyecto) => {
    setLoading(true)
    try {
      const { data: proyecto, error: proyectoError } = await supabase
        .from('proyectos')
        .select(`
          *,
          clientes (*)
        `)
        .eq('id_proyecto', id_proyecto)
        .single()

      if (proyectoError) throw proyectoError

      // Obtener las reglas de avance asociadas
      const { data: mediciones, error: medicionesError } = await supabase
        .from('medicion_de_avances')
        .select('id_regla')
        .eq('id_proyecto', id_proyecto)

      if (medicionesError) throw medicionesError

      return {
        data: {
          ...proyecto,
          reglasSeleccionadas: mediciones?.map((m) => m.id_regla.toString()) || [],
        },
        error: null,
      }
    } catch (error) {
      console.error('Error al obtener proyecto:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  // Crear un nuevo proyecto con relaciones
  const createProyecto = async (proyectoData, medicionesAvance) => {
    try {
      // 1. Crear el proyecto
      const { data: proyecto, error: proyectoError } = await supabase
        .from('proyectos')
        .insert([proyectoData])
        .select()
        .single()

      if (proyectoError) throw proyectoError

      const id_proyecto = proyecto.id_proyecto

      // 2. Crear mediciones de avance
      if (medicionesAvance && medicionesAvance.length > 0) {
        const medicionesData = medicionesAvance.map((id_regla) => ({
          id_proyecto,
          id_regla: parseInt(id_regla, 10),
        }))

        const { error: medicionesError } = await supabase
          .from('medicion_de_avances')
          .insert(medicionesData)

        if (medicionesError) throw medicionesError
      }

      // Actualizar la lista de proyectos
      setProyectos((prev) => [proyecto, ...prev])
      return { data: proyecto, error: null }
    } catch (error) {
      console.error('Error al crear proyecto:', error)
      return { data: null, error }
    }
  }

  // Actualizar un proyecto existente
  const updateProyecto = async (id_proyecto, proyectoData, medicionesAvance) => {
    try {
      // 1. Actualizar el proyecto
      const { data: proyecto, error: proyectoError } = await supabase
        .from('proyectos')
        .update(proyectoData)
        .eq('id_proyecto', id_proyecto)
        .select()
        .single()

      if (proyectoError) throw proyectoError

      // 2. Eliminar mediciones existentes
      const { error: deleteError } = await supabase
        .from('medicion_de_avances')
        .delete()
        .eq('id_proyecto', id_proyecto)

      if (deleteError) throw deleteError

      // 3. Crear nuevas mediciones de avance
      if (medicionesAvance && medicionesAvance.length > 0) {
        const medicionesData = medicionesAvance.map((id_regla) => ({
          id_proyecto,
          id_regla: parseInt(id_regla, 10),
        }))

        const { error: medicionesError } = await supabase
          .from('medicion_de_avances')
          .insert(medicionesData)

        if (medicionesError) throw medicionesError
      }

      // Actualizar la lista de proyectos
      setProyectos((prev) =>
        prev.map((p) => (p.id_proyecto === id_proyecto ? proyecto : p))
      )
      return { data: proyecto, error: null }
    } catch (error) {
      console.error('Error al actualizar proyecto:', error)
      return { data: null, error }
    }
  }

  // Obtener datos iniciales para el formulario
  const fetchFormData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchClientes(),
        fetchDisciplinas(),
        fetchReglasAvance(),
      ])
    } catch (error) {
      console.error('Error al obtener datos del formulario:', error)
    } finally {
      setLoading(false)
    }
  }

  return {
    proyectos,
    clientes,
    usuarios,
    estados,
    disciplinas,
    reglasAvance,
    loading,
    fetchProyectos,
    fetchFormData,
    createProyecto,
    updateProyecto,
    getProyectoById,
    createReglaAvance,
    fetchClientes,
    fetchUsuarios,
    fetchDisciplinas,
    fetchReglasAvance,
    fetchEstados,
  }
}
