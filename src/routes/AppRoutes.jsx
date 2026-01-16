import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import AuthPage from '../pages/auth/AuthPage'
import TestConnection from '../pages/auth/TestConnection'
import ProyectsPage from '../pages/proyects/ProyectsPage'
import DocumentsPage from '../pages/documents/DocumentsPage'
import UsersPage from '../pages/users/UsersPage'
import Nav from '../components/layout/nav'
import SideBar from '../components/layout/sideBar'
import { useState } from 'react'
import { Building2, File, ChartNoAxesCombined, Users, NotepadText} from 'lucide-react'
import { canAccessUsersPage, isAdmin } from '../utils/permissions'

const navItems = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    component: () => <div>Dashboard</div>,
    icon: <ChartNoAxesCombined />
  },
  {
    name: 'Documentos',
    path: '/documents',
    component: DocumentsPage,
    icon: <File />
  },
  {
    name: 'Proyects',
    path: '/proyects',
    component: ProyectsPage,
    icon: <Building2 />
  },
  {
    name: 'Seguimiento',
    path: '/seguimiento',
    component: () => <div>Seguimiento</div>,
    icon: <NotepadText />
  },
  {
    name: 'Users',
    path: '/users',
    component: UsersPage,
    icon: <Users />,
    adminOnly: true,
  },
]
// -------- Protected Route --------
function ProtectedRoute({ children, requiresAdmin = false }) {
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

  if (user && !userData) {
    return <Navigate to="/?error=not_registered" replace />
  }

  if (requiresAdmin && user && userData && !canAccessUsersPage(userData)) {
    return <Navigate to="/dashboard" replace />
  }

  return user && userData ? children : <Navigate to="/" replace />
}

// -------- Layout con location --------
function AppLayout() {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const { userData } = useAuth()

  const filteredNavItems = navItems.filter((item) => {
    if (!item.adminOnly) return true
    return isAdmin(userData)
  })
  return (
    <>
      {location.pathname !== '/' && <Nav isOpen={isOpen} />}
      {location.pathname !== '/' && <SideBar isOpen={isOpen} setIsOpen={setIsOpen} navItems={filteredNavItems} />}
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/test-connection" element={<TestConnection />} />
        {navItems.map((item) => {
          const Component = item.component
          return (
            <Route
              key={item.name}
              path={item.path}
              element={
                <ProtectedRoute requiresAdmin={!!item.adminOnly}>
                  <Component isOpen={isOpen} />
                </ProtectedRoute>
              }
            />
          )
        })}
      </Routes>
    </>
  )
}

// -------- Router raíz --------
export default function AppRoutes() {
  return (
    <BrowserRouter>
      <div className='bg-purple-50/30 overflow-hidden h-full w-full font-mono'>
        <AppLayout />
      </div>
    </BrowserRouter>
  )
}
