import { useState, useEffect } from 'react'
import { supabase } from '../api/supabase'
import { getSiteUrl } from '@/utils/siteUrl'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserData(session.user.email)
      } else {
        setLoading(false)
      }
    })

    // Escuchar cambios en la autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserData(session.user.email)
      } else {
        setUserData(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserData = async (email) => {
    try {
      // Buscamos el usuario por email_empresa
      // Nota: Si tu tabla tiene una columna auth_user_id UUID, deberías usarla en lugar de email_empresa
      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          *,
          roles (*),
          disciplinas (*)
        `)
        .eq('email_empresa', email)
        .maybeSingle() // Usamos maybeSingle en lugar de single para manejar cuando no hay resultados

      if (error) {
        console.error('Error al obtener datos del usuario:', error)
        // Si hay un error de conexión, permitimos continuar
        setLoading(false)
      } else if (!data) {
        // El usuario no existe en la tabla usuarios
        console.warn('Usuario autenticado pero no registrado en la tabla usuarios:', email)
        // Cerramos la sesión porque el usuario no está registrado
        await supabase.auth.signOut()
        setUserData(null)
        setLoading(false)
      } else {
        // Usuario encontrado, guardamos los datos
        setUserData(data)
        setLoading(false)
      }
    } catch (error) {
      console.error('Error al obtener datos del usuario:', error)
      setLoading(false)
    }
  }

  const signIn = async (email, password) => {
    try {
      // La autenticación se hace directamente contra auth.users de Supabase
      // La contraseña está almacenada en auth.users, NO en la tabla usuarios
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        // Manejar diferentes tipos de errores de Supabase Auth
        let userMessage = ''
        
        // Verificar el código de error o el mensaje
        if (error.message && error.message.includes('Email not confirmed')) {
          userMessage = 'Por favor, confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.'
        } else if (error.message && error.message.includes('Invalid login credentials')) {
          // Invalid login credentials puede significar:
          // 1. El email no existe en auth.users
          // 2. La contraseña es incorrecta
          // 3. El email no está confirmado (a veces Supabase devuelve este error en lugar de "Email not confirmed")
          
          // Verificamos si el email existe en nuestra tabla usuarios para dar un mensaje más específico
          const { data: userInTable } = await supabase
            .from('usuarios')
            .select('email_empresa')
            .eq('email_empresa', email)
            .maybeSingle()
          
          if (userInTable) {
            // El usuario existe en nuestra tabla, pero el login falló contra auth.users
            // Probablemente es contraseña incorrecta o email no confirmado en auth.users
            userMessage = 'La contraseña es incorrecta o tu email no ha sido confirmado. Por favor, verifica tu contraseña o confirma tu email desde el panel de Supabase.'
          } else {
            // El usuario no existe ni en auth.users ni en nuestra tabla
            userMessage = 'Este email no está habilitado en el sistema. Contacta a un administrador para que te cree el usuario.'
          }
        } else {
          // Otro tipo de error
          userMessage = error.message || 'Error al iniciar sesión'
        }
        
        error.userMessage = userMessage
        throw error
      }
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const signUp = async (email, password, userData) => {
    try {
      const siteUrl = getSiteUrl()
      // Primero crear el usuario en auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Asegura que el link de confirmación vaya al login web (no localhost)
          emailRedirectTo: `${siteUrl}/`,
        },
      })
      if (authError) throw authError

      // Crear el registro en la tabla usuarios independientemente de si se requiere confirmación
      // Esto asegura que el usuario tenga su registro incluso si necesita confirmar el email
      const userRecordData = {
        ...userData,
        email_empresa: email, // El email de empresa es el mismo que el email de auth
        // Si tienes una columna auth_user_id en tu tabla, descomenta la línea siguiente:
        // auth_user_id: authData.user?.id,
      }

      const { data: userRecord, error: userError } = await supabase
        .from('usuarios')
        .insert([userRecordData])
        .select()
        .single()

      if (userError) {
        console.error('Error al crear registro de usuario:', userError)
        // Si falla, intentamos eliminar el usuario de auth para mantener consistencia
        if (authData.user) {
          await supabase.auth.admin.deleteUser(authData.user.id).catch(() => {})
        }
        throw userError
      }

      // Si authData.user es null, significa que se requiere confirmación de email
      // En ese caso, Supabase envía el email de confirmación pero no crea la sesión
      if (!authData.user) {
        // Se requiere confirmación de email
        // Retornamos un objeto especial para indicar que se requiere confirmación
        return { 
          data: { 
            requiresEmailConfirmation: true,
            email: email,
            user: userRecord // Incluimos el registro de usuario creado
          }, 
          error: null 
        }
      }

      // Si authData.user existe, el usuario se creó y confirmó (o no requiere confirmación)
      return { data: { auth: authData, user: userRecord }, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const signInWithGoogle = async () => {
    try {
      const siteUrl = getSiteUrl()
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${siteUrl}/dashboard`,
        },
      })
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      // Limpiar los estados locales
      setUser(null)
      setUserData(null)
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      throw error
    }
  }

  return {
    user,
    userData,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  }
}
