import { supabase } from '../api/supabase'

/**
 * Función para probar la conexión con Supabase y verificar datos
 */
export async function testConnection() {
  try {
    console.log('🔍 Probando conexión con Supabase...')

    // Probar conexión básica
    const { error: healthError } = await supabase
      .from('clientes')
      .select('*', { count: 'exact', head: true })

    if (healthError) {
      console.error('❌ Error de conexión:', healthError)
      return { success: false, error: healthError }
    }

    console.log('✅ Conexión exitosa con Supabase')

    // Obtener datos de clientes
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes')
      .select('*')
      .limit(10)

    if (clientesError) {
      console.error('❌ Error al obtener clientes:', clientesError)
    } else {
      console.log('📊 Clientes encontrados:', clientes?.length || 0)
      console.log('Clientes:', clientes)
    }

    // Obtener datos de roles
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('*')

    if (rolesError) {
      console.error('❌ Error al obtener roles:', rolesError)
    } else {
      console.log('👥 Roles encontrados:', roles?.length || 0)
      console.log('Roles:', roles)
    }

    // Obtener datos de disciplinas
    const { data: disciplinas, error: disciplinasError } = await supabase
      .from('disciplinas')
      .select('*')
      .limit(10)

    if (disciplinasError) {
      console.error('❌ Error al obtener disciplinas:', disciplinasError)
    } else {
      console.log('📚 Disciplinas encontradas:', disciplinas?.length || 0)
      console.log('Disciplinas:', disciplinas)
    }

    return {
      success: true,
      data: {
        clientes,
        roles,
        disciplinas,
      },
    }
  } catch (error) {
    console.error('❌ Error general:', error)
    return { success: false, error }
  }
}
