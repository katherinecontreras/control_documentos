import { useState, useEffect } from 'react'
import { useProyects } from '../../hooks/useProyects'
import ProyectosListView from './views/ProyectosListView'
import ProyectoFormView from './views/ProyectoFormView'
import Header from '@/components/common/header'
import { Plus, ArrowLeft } from 'lucide-react'

export default function ProyectsPage({ isOpen }) {
  const { proyectos, clientes, loading, fetchProyectos, fetchClientes } = useProyects()

  const [currentView, setCurrentView] = useState('list') // 'list' o 'form'
  const [editingProyectoId, setEditingProyectoId] = useState(null)

  useEffect(() => {
    fetchProyectos()
    fetchClientes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAddNew = () => {
    setEditingProyectoId(null)
    setCurrentView('form')
  }

  const handleEdit = (id) => {
    setEditingProyectoId(id)
    setCurrentView('form')
  }

  const handleBack = () => {
    setCurrentView('list')
    setEditingProyectoId(null)
  }

  const handleFormSuccess = () => {
    fetchProyectos()
    handleBack()
  }

  return (
    <div className="p-8 overflow-hidden w-full">
      <div
        className={`bg-white rounded-xl shadow-lg p-8 transition-all duration-300 ${
          isOpen ? 'ml-52' : 'ml-16'
        }`}
      >
        {/* Header */}
        <Header
          variant="page"
          title={
            currentView === 'list'
              ? 'Proyectos'
              : editingProyectoId
                ? 'Editar Proyecto'
                : 'Crear Nuevo Proyecto'
          }
          actions={
            currentView === 'list' ? (
              <button
                onClick={handleAddNew}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-semibold shadow-lg"
              >
                <Plus size={20} />
                Agregar Nuevo Proyecto
              </button>
            ) : (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-semibold"
              >
                <ArrowLeft size={20} />
                Volver
              </button>
            )
          }
        />

        {/* Content */}
        {currentView === 'list' ? (
          <ProyectosListView
            proyectos={proyectos}
            clientes={clientes}
            loading={loading}
            onEdit={handleEdit}
          />
        ) : (
          <ProyectoFormView
            proyectoId={editingProyectoId}
            onSuccess={handleFormSuccess}
            onCancel={handleBack}
          />
        )}
      </div>
    </div>
  )
}
