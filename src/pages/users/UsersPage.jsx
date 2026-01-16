import { useEffect, useMemo, useState } from 'react'
import { Plus, ArrowLeft } from 'lucide-react'
import { useUsers } from '@/hooks/useUsers'
import UsersListView from './views/UsersListView'
import UserFormView from './views/UserFormView'
import RolesListView from './views/RolesListView'
import RoleFormView from './views/RoleFormView'

export default function UsersPage({ isOpen }) {
  const {
    usuarios,
    roles,
    disciplinas,
    loading,
    fetchUsuarios,
    fetchFormData,
    fetchRoles,
    getUsuarioById,
    createUsuario,
    updateUsuario,
    deleteUsuario,
    createRol,
    getRolById,
    updateRol,
    deleteRol,
  } = useUsers()

  const [activeSection, setActiveSection] = useState('usuarios') // 'usuarios' | 'roles'
  const [currentView, setCurrentView] = useState('list') // 'list' | 'form'
  const [editingUsuarioId, setEditingUsuarioId] = useState(null)
  const [editingRolId, setEditingRolId] = useState(null)

  useEffect(() => {
    fetchUsuarios()
    fetchFormData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const title = useMemo(() => {
    if (activeSection === 'usuarios') {
      if (currentView === 'list') return 'Usuarios'
      return editingUsuarioId ? 'Editar Usuario' : 'Crear Nuevo Usuario'
    }

    if (currentView === 'list') return 'Roles'
    return editingRolId ? 'Editar Rol' : 'Crear Nuevo Rol'
  }, [activeSection, currentView, editingRolId, editingUsuarioId])

  const subheader = useMemo(() => {
    return activeSection === 'usuarios' ? 'Roles' : 'Usuarios'
  }, [activeSection])

  const switchSection = () => {
    setActiveSection((prev) => (prev === 'usuarios' ? 'roles' : 'usuarios'))
    setCurrentView('list')
    setEditingUsuarioId(null)
    setEditingRolId(null)
  }

  const handleAddNew = () => {
    if (activeSection === 'usuarios') {
      setEditingUsuarioId(null)
      setCurrentView('form')
      return
    }
    setEditingRolId(null)
    setCurrentView('form')
  }

  const handleEdit = (id) => {
    if (activeSection === 'usuarios') {
      setEditingUsuarioId(id)
      setCurrentView('form')
      return
    }
    setEditingRolId(id)
    setCurrentView('form')
  }

  const handleDeleteUsuario = async (usuario) => {
    const nombre = `${usuario?.nombre || ''} ${usuario?.apellido || ''}`.trim()
    const email = usuario?.email_empresa ? ` (${usuario.email_empresa})` : ''
    const ok = window.confirm(
      `¿Eliminar el usuario ${nombre || 'seleccionado'}${email}?\n\nEsta acción no se puede deshacer.`
    )
    if (!ok) return

    const { error } = await deleteUsuario?.(usuario.id_usuario)
    if (error) {
      window.alert(error.message || 'No se pudo eliminar el usuario.')
    }
  }

  const handleDeleteRol = async (rol) => {
    const ok = window.confirm(
      `¿Eliminar el rol "${rol?.nombre_rol || 'seleccionado'}"?\n\nSi hay usuarios asignados a este rol, puede fallar.`
    )
    if (!ok) return

    const { error } = await deleteRol?.(rol.id_rol)
    if (error) {
      window.alert(
        error.message ||
          'No se pudo eliminar el rol. Verifica que no esté asignado a usuarios.'
      )
    }
  }

  const handleBack = () => {
    setCurrentView('list')
    setEditingUsuarioId(null)
    setEditingRolId(null)
  }

  const handleFormSuccess = async () => {
    if (activeSection === 'usuarios') {
      await fetchUsuarios()
    } else {
      await fetchRoles()
    }
    handleBack()
  }

  return (
    <div className="p-8 overflow-hidden w-full">
      <div
        className={`bg-white rounded-xl shadow-lg p-8 transition-all duration-300 ${
          isOpen ? 'ml-52' : 'ml-16'
        }`}
      >
        <div className="flex items-center justify-between mb-8 pb-0 border-b-2 border-purple-600">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-purple-600">{title}</h1>
            <button
              type="button"
              onClick={switchSection}
              className="text-sm p-4 bg-purple-600 text-white hover:bg-purple-700 transition-colors font-semibold shadow-lg"
            >
              {subheader}
            </button>
          </div>
          <div className="flex items-center gap-3">
            {currentView === 'list' ? (
              <button
                onClick={handleAddNew}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-semibold shadow-lg"
              >
                <Plus size={20} />
                {activeSection === 'usuarios' ? 'Crear Usuario' : 'Crear Rol'}
              </button>
            ) : (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-semibold"
              >
                <ArrowLeft size={20} />
                Volver
              </button>
            )}
          </div>
        </div>

        {activeSection === 'usuarios' ? (
          currentView === 'list' ? (
            <UsersListView
              usuarios={usuarios}
              roles={roles}
              disciplinas={disciplinas}
              loading={loading}
              onEdit={handleEdit}
              onDelete={handleDeleteUsuario}
            />
          ) : (
            <UserFormView
              usuarioId={editingUsuarioId}
              roles={roles}
              disciplinas={disciplinas}
              getUsuarioById={getUsuarioById}
              createUsuario={createUsuario}
              updateUsuario={updateUsuario}
              onSuccess={handleFormSuccess}
              onCancel={handleBack}
            />
          )
        ) : currentView === 'list' ? (
          <RolesListView
            roles={roles}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDeleteRol}
          />
        ) : (
          <RoleFormView
            rolId={editingRolId}
            getRolById={getRolById}
            createRol={createRol}
            updateRol={updateRol}
            onSuccess={handleFormSuccess}
            onCancel={handleBack}
          />
        )}
      </div>
    </div>
  )
}

