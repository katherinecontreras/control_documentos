import { useState } from 'react'
import { supabase } from '../api/supabase'
import { getSiteUrl } from '@/utils/siteUrl'

export function useUsers() {
  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles] = useState([])
  const [disciplinas, setDisciplinas] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchUsuarios = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select(
          `
          *,
          roles (*),
          disciplinas (*)
        `
        )
        .order('id_usuario', { ascending: false })

      if (error) throw error
      setUsuarios(data || [])
      return { data, error: null }
    } catch (error) {
      console.error('Error al obtener usuarios:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('id_rol', { ascending: true })

      if (error) throw error
      setRoles(data || [])
      return { data, error: null }
    } catch (error) {
      console.error('Error al obtener roles:', error)
      return { data: null, error }
    }
  }

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

  const fetchFormData = async () => {
    setLoading(true)
    try {
      await Promise.all([fetchRoles(), fetchDisciplinas()])
    } finally {
      setLoading(false)
    }
  }

  const getUsuarioById = async (id_usuario) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select(
          `
          *,
          roles (*),
          disciplinas (*)
        `
        )
        .eq('id_usuario', id_usuario)
        .single()
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error al obtener usuario:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Crea un usuario en Supabase Auth + inserta el registro en la tabla `usuarios`.
   * Nota: si Supabase está configurado para auto-login al hacer signUp, restauramos la sesión previa.
   */
  const createUsuario = async ({ email, password, usuarioData }) => {
    setLoading(true)
    let previousSession = null
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      previousSession = sessionData?.session || null
      const siteUrl = getSiteUrl()

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Asegura que el link de confirmación vaya al login web (no localhost)
          emailRedirectTo: `${siteUrl}/`,
        },
      })
      if (authError) throw authError

      const recordToInsert = {
        ...usuarioData,
        email_empresa: email,
      }

      const { data: userRecord, error: userError } = await supabase
        .from('usuarios')
        .insert([recordToInsert])
        .select(
          `
          *,
          roles (*),
          disciplinas (*)
        `
        )
        .single()

      if (userError) throw userError

      // Actualizar lista local (optimista)
      setUsuarios((prev) => [userRecord, ...prev])

      // Restaurar sesión del admin si el signUp la cambió
      if (previousSession?.access_token && previousSession?.refresh_token) {
        await supabase.auth
          .setSession({
            access_token: previousSession.access_token,
            refresh_token: previousSession.refresh_token,
          })
          .catch(() => {})
      }

      const requiresEmailConfirmation = !authData?.session
      return {
        data: { auth: authData, user: userRecord, requiresEmailConfirmation },
        error: null,
      }
    } catch (error) {
      // Intentar restaurar sesión si algo falló tras el signUp
      if (previousSession?.access_token && previousSession?.refresh_token) {
        await supabase.auth
          .setSession({
            access_token: previousSession.access_token,
            refresh_token: previousSession.refresh_token,
          })
          .catch(() => {})
      }
      console.error('Error al crear usuario:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const updateUsuario = async (id_usuario, usuarioData) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .update(usuarioData)
        .eq('id_usuario', id_usuario)
        .select(
          `
          *,
          roles (*),
          disciplinas (*)
        `
        )
        .single()

      if (error) throw error

      setUsuarios((prev) =>
        prev.map((u) => (u.id_usuario === id_usuario ? data : u))
      )

      return { data, error: null }
    } catch (error) {
      console.error('Error al actualizar usuario:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const deleteUsuario = async (id_usuario) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id_usuario', id_usuario)

      if (error) throw error

      setUsuarios((prev) => prev.filter((u) => u.id_usuario !== id_usuario))
      return { error: null }
    } catch (error) {
      console.error('Error al eliminar usuario:', error)
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const createRol = async (rolData) => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .insert([rolData])
        .select()
        .single()

      if (error) throw error
      setRoles((prev) => [...prev, data])
      return { data, error: null }
    } catch (error) {
      console.error('Error al crear rol:', error)
      return { data: null, error }
    }
  }

  const getRolById = async (id_rol) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('id_rol', id_rol)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error al obtener rol:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const updateRol = async (id_rol, rolData) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('roles')
        .update(rolData)
        .eq('id_rol', id_rol)
        .select()
        .single()

      if (error) throw error

      setRoles((prev) => prev.map((r) => (r.id_rol === id_rol ? data : r)))

      return { data, error: null }
    } catch (error) {
      console.error('Error al actualizar rol:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const deleteRol = async (id_rol) => {
    setLoading(true)
    try {
      const { error } = await supabase.from('roles').delete().eq('id_rol', id_rol)
      if (error) throw error

      setRoles((prev) => prev.filter((r) => r.id_rol !== id_rol))
      return { error: null }
    } catch (error) {
      console.error('Error al eliminar rol:', error)
      return { error }
    } finally {
      setLoading(false)
    }
  }

  return {
    usuarios,
    roles,
    disciplinas,
    loading,
    fetchUsuarios,
    fetchRoles,
    fetchDisciplinas,
    fetchFormData,
    getUsuarioById,
    createUsuario,
    updateUsuario,
    deleteUsuario,
    createRol,
    getRolById,
    updateRol,
    deleteRol,
  }
}

