import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import AuthPage from '../pages/auth/AuthPage'
import TestConnection from '../pages/auth/TestConnection'

// Placeholder para Dashboard
function Dashboard() {
  const { userData, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <button
              onClick={signOut}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Cerrar Sesión
            </button>
          </div>
          <div className="mt-4">
            <h2 className="text-xl font-semibold">Bienvenido</h2>
            {userData && (
              <div className="mt-4 space-y-2">
                <p><strong>Nombre:</strong> {userData.nombre} {userData.apellido}</p>
                <p><strong>Email:</strong> {userData.email_empresa}</p>
                {userData.roles && (
                  <p><strong>Rol:</strong> {userData.roles.nombre_rol}</p>
                )}
                {userData.disciplinas && (
                  <p><strong>Disciplina:</strong> {userData.disciplinas.tipo} - {userData.disciplinas.descripcion}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente para proteger rutas
function ProtectedRoute({ children }) {
  const { user, userData, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  // Si hay usuario autenticado pero no existe en la tabla usuarios, redirigir al login
  if (user && !userData) {
    return <Navigate to="/?error=not_registered" replace />
  }

  return user && userData ? children : <Navigate to="/" replace />
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/test-connection" element={<TestConnection />} />
        <Route path="/" element={<AuthPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}