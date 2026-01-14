import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, User, Lock, Building2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../api/supabase'
import '../../index.css'
import Input from '@/components/common/input'
import LoadingData from '@/components/common/loadingData'
import Button from '@/components/common/button'
import Select from '@/components/common/select'
import Header from '@/components/common/header'

export default function AuthPage() {
  const [activeView, setActiveView] = useState('login') // 'login', 'register', 'confirmation'
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [confirmedEmail, setConfirmedEmail] = useState('')
  
  // Estados para Login
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })
  
  // Estados para Register
  const [registerData, setRegisterData] = useState({
    email_empresa: '',
    password: '',
    nombre: '',
    apellido: '',
    dni: '',
    id_rol: '',
    id_disciplina: '',
    lider_equipo: false,
  })
  
  const [roles, setRoles] = useState([])
  const [disciplinas, setDisciplinas] = useState([])
  
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam === 'not_registered') {
      setError('Tu cuenta no está registrada en el sistema. Por favor, regístrate primero.')
      setActiveView('register')
    }
  }, [searchParams])

  useEffect(() => {
    if (activeView === 'register' && roles.length === 0) {
      fetchInitialData()
    }
  }, [activeView, roles.length])

  const fetchInitialData = async () => {
    setLoadingData(true)
    try {
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('*')
        .order('id_rol')

      if (rolesError) throw rolesError

      const { data: disciplinasData, error: disciplinasError } = await supabase
        .from('disciplinas')
        .select('*')
        .order('tipo')

      if (disciplinasError) throw disciplinasError

      setRoles(rolesData || [])
      setDisciplinas(disciplinasData || [])
    } catch (err) {
      console.error('Error al cargar datos:', err)
      setError('Error al cargar los datos iniciales')
    } finally {
      setLoadingData(false)
    }
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!loginData.email || !loginData.password) {
      setError('Por favor, completa todos los campos')
      setLoading(false)
      return
    }

    try {
      const { error } = await signIn(loginData.email, loginData.password)
      if (error) {
        setError(error.userMessage || error.message || 'Error al iniciar sesión')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      console.error('Error al iniciar sesión:', err)
      setError('Error inesperado al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!registerData.email_empresa || !registerData.password) {
      setError('Email de empresa y contraseña son obligatorios')
      return
    }

    if (registerData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    const hasLetter = /[a-zA-Z]/.test(registerData.password)
    const hasNumber = /[0-9]/.test(registerData.password)
    if (!hasLetter || !hasNumber) {
      setError('La contraseña debe contener al menos una letra y un número')
      return
    }

    if (!registerData.nombre || !registerData.apellido) {
      setError('Nombre y apellido son obligatorios')
      return
    }

    if (!registerData.id_rol) {
      setError('Debes seleccionar un rol')
      return
    }

    setLoading(true)

    try {
      const userData = {
        nombre: registerData.nombre,
        apellido: registerData.apellido,
        dni: registerData.dni ? parseInt(registerData.dni, 10) : null,
        email_empresa: registerData.email_empresa,
        id_rol: parseInt(registerData.id_rol, 10),
        id_disciplina: registerData.id_disciplina && registerData.id_disciplina !== '' ? parseInt(registerData.id_disciplina, 10) : null,
        lider_equipo: registerData.lider_equipo,
      }

      const { data, error } = await signUp(registerData.email_empresa, registerData.password, userData)
      if (error) {
        setError(error.message || 'Error al registrar usuario')
        setLoading(false)
      } else if (data?.requiresEmailConfirmation) {
        setConfirmedEmail(registerData.email_empresa)
        setActiveView('confirmation')
        setLoading(false)
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      console.error('Error al registrar usuario:', err)
      setError('Error inesperado al registrar usuario')
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoadingGoogle(true)

    try {
      const { error } = await signInWithGoogle()
      if (error) {
        setError(error.message || 'Error al iniciar sesión con Google')
        setLoadingGoogle(false)
      }
    } catch (err) {
      console.error('Error al iniciar sesión con Google:', err)
      setError('Error inesperado al iniciar sesión con Google')
      setLoadingGoogle(false)
    }
  }

  const switchToRegister = () => {
    setError('')
    setActiveView('register')
  }

  const switchToLogin = () => {
    setError('')
    setActiveView('login')
  }

  return (
    <div className="w-full h-screen bg-white relative overflow-hidden flex">
      
      {/* Círculos animados */}
      <motion.div
        className="absolute right-0 top-0 w-1/2 h-full flex items-center justify-center z-[2] pointer-events-none"
        initial={{ x: 0 }}
        animate={{
          x: activeView === 'register' || activeView === 'confirmation' ? '-150%' : 0
        }}
        transition={{
          type: 'spring',
          stiffness: 80,
          damping: 20,
          duration: 0.8
        }}
      >
        {/* Círculo 1 - Púrpura principal */}
        <div className="absolute w-[1000px] h-[1000px] rounded-full bg-gradient-to-br shadow-lg shad from-purple-200 to-purple-300 top-[60%] top-[60%] left-[70%] -translate-x-1/2 -translate-y-1/2" 
              style={{ background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), transparent), linear-gradient(135deg, #a855f7 0%, #d8b4fe 100%)' }} />
        
        {/* Círculo 2 - Púrpura claro */}
        <div className="absolute w-[800px] h-[800px] rounded-full bg-gradient-to-br from-purple-400 to-purple-600 top-[60%] left-[70%] -translate-x-1/2 -translate-y-1/2"
              style={{ background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), transparent), linear-gradient(135deg, #c084fc 0%, #9333ea 100%)' }} />
        
        {/* Círculo 3 - Lavanda */}
        <div className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-br  from-purple-500 to-purple-700 top-[60%] left-[70%] -translate-x-1/2 -translate-y-1/2"
              style={{ background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), transparent), linear-gradient(135deg, #e9d5ff 0%, #7c3aed 100%)' }} />
      </motion.div>

      {/* Ilustración */}
      <motion.div
        className="absolute -right-30 top-20 w-1/2 h-full flex items-center justify-center z-[3]"
        initial={{ x: 0 }}
        animate={{
          x: activeView === 'register' || activeView === 'confirmation' ? '-140%' : 0
        }}
        transition={{
          type: 'spring',
          stiffness: 80,
          damping: 20,
          duration: 0.8
        }}
      >
        <div className="w-[280px] h-[180px] relative">
          <h1 className="text-4xl text-center  font-extrabold text-black mb-2">
            {activeView === 'login' ? 'Bienvenido' : 'Crear Cuenta'}
          </h1>
          <p className="text-black border-y-2 border-purple-600 text-base text-center py-4 mb-8 font-semibold">
            Control de Documentación
          </p>
          {activeView === 'login' && (
          <p className="text-center mt-6 text-sm text-gray-600">
            ¿No tienes cuenta?{' '}
            <span onClick={switchToRegister} className="text-purple-600 font-semibold cursor-pointer hover:text-purple-700 hover:underline transition-colors">
              Regístrate
            </span>
          </p>
          )}
          {activeView === 'register' && (
          <p className="text-center mt-6 text-sm text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <span onClick={switchToLogin} className="text-purple-600 font-semibold cursor-pointer hover:text-purple-700 hover:underline transition-colors">
              Inicia sesión
            </span>
          </p>
          )}
        </div>
      </motion.div>

      {/* Login Form */}
      <motion.div
        className="w-1/2 p-12 flex flex-col justify-center absolute left-0 top-0 h-full z-[4]"
        initial={{ opacity: 1, x: 0 }}
        animate={{
          opacity: activeView === 'login' ? 1 : 0,
          x: activeView === 'login' ? 0 : -50,
          pointerEvents: activeView === 'login' ? 'auto' : 'none'
        }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-full max-h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-gray-100">
          {error && activeView === 'login' && (
            <div className="bg-gradient-to-br from-red-50 to-red-100 text-red-900 p-4 rounded-xl mb-6 text-sm font-medium border-l-4 border-red-600">
              {error}
            </div>
          )}
          <Header variant="section" title="Iniciar Sesión" />
          <form onSubmit={handleLoginSubmit} className="space-y-5 px-16">
            <Input
              label="Email"
              type="email"
              id="email"
              placeholder="tu@email.com"
              value={loginData.email}
              icon={<Mail size={20} />}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
            />
            <Input
              label="Contraseña"
              type="password"
              id="password"
              placeholder="••••••••"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              icon={<Lock size={20} />}
            />

            <Button
              type="submit"
              disabled={loading || loadingGoogle}
              loading={loading}
              children="Iniciar Sesión"
              onClick={handleLoginSubmit}
            />

            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="px-4 text-sm text-gray-400">O continúa con</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading || loadingGoogle}
              className="w-full py-3.5 bg-white border-2 border-gray-200 rounded-xl text-base font-medium text-gray-700 transition-all duration-300 flex items-center justify-center gap-3 hover:bg-gray-50 hover:border-purple-600 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {loadingGoogle ? 'Conectando...' : 'Continuar con Google'}
            </button>
          </form>
        </div>
      </motion.div>

      {/* Register Form */}
      <motion.div
        className="w-1/2 p-12 flex flex-col justify-center absolute right-0 top-0 h-full z-[4]"
        initial={{ opacity: 0, x: 50 }}
        animate={{
          opacity: activeView === 'register' ? 1 : 0,
          x: activeView === 'register' ? 0 : 50,
          pointerEvents: activeView === 'register' ? 'auto' : 'none'
        }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-full max-h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-gray-100">
          {loadingData ? (
            <LoadingData />
          ) : (
            <>
              {error && activeView === 'register' && (
                <div className="bg-gradient-to-br from-red-50 to-red-100 text-red-900 p-4 rounded-xl mb-6 text-sm font-medium border-l-4 border-red-600">
                  {error}
                </div>
              )}
              <Header variant="section" title="Registrarse" />
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="flex gap-4 justify-between">
                  <Input
                    label="Email de Empresa"
                    type="email"
                    id="email_empresa"
                    placeholder="usuario@empresa.com"
                    value={registerData.email_empresa}
                    onChange={(e) => setRegisterData({ ...registerData, email_empresa: e.target.value })}
                    icon={<Building2 size={20} />}
                  />
                  <Input
                    label="Contraseña"
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    placeholder="Mínimo 8 caracteres"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    icon={<Lock size={20} />}
                  />
                </div>
                <div className="flex gap-4 justify-between">  
                  <Input
                    label="Nombre"
                    type="text"
                    id="nombre"
                    placeholder="Tu nombre"
                    value={registerData.nombre}
                    onChange={(e) => setRegisterData({ ...registerData, nombre: e.target.value })}
                    icon={<User size={20} />}
                  />
                  <Input
                    label="Apellido"
                    type="text"
                    id="apellido"
                    placeholder="Tu apellido"
                    value={registerData.apellido}
                    onChange={(e) => setRegisterData({ ...registerData, apellido: e.target.value })}
                    icon={<User size={20} />}
                  />
                </div>
                <div className="flex gap-4 justify-between">
                  <Select
                    className="w-1/2"
                    label="Rol"
                    id="id_rol"
                    value={registerData.id_rol}
                    onChange={(value) =>
                      setRegisterData({ ...registerData, id_rol: value })
                    }
                    options={roles}
                  />

                  <Select
                    className="w-1/2"
                    label="Disciplina"
                    id="id_disciplina"
                    value={registerData.id_disciplina}
                    onChange={(value) =>
                      setRegisterData({ ...registerData, id_disciplina: value })
                    }
                    options={disciplinas}
                  />
                </div>
                <div className="flex gap-4">
                  <Input
                    label="DNI"
                    type="number"
                    id="dni"
                    placeholder="12345678"
                    value={registerData.dni}
                    onChange={(e) => setRegisterData({ ...registerData, dni: e.target.value })}
                    icon={<User size={20} />}
                  />

                  <Input
                    label="Líder de Equipo"
                    type="checkbox"
                    id="lider_equipo"
                    value={registerData.lider_equipo}
                    onChange={(e) => setRegisterData({ ...registerData, lider_equipo: e.target.checked })}
                    checked={registerData.lider_equipo}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  loading={loading}
                  children="Registrarse"
                  onClick={handleRegisterSubmit}
                />
              </form>
            </>
          )}
        </div>
      </motion.div>

      {/* Email Confirmation */}
      <AnimatePresence>
        {activeView === 'confirmation' && (
          <motion.div
            className="w-1/2 h-full absolute right-0 top-0 flex flex-col justify-center items-center text-center p-8 z-[5]"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 100,
              damping: 25,
              duration: 0.6
            }}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mb-8">
              <Mail size={40} className="text-purple-600" />
            </div>
            
            <h2 className="font-playfair text-4xl font-black text-[#1a1625] mb-4">
              Confirma tu Email
            </h2>
            
            <p className="text-gray-600 mb-4">
              Hemos enviado un enlace de confirmación a:
            </p>
            
            <p className="text-lg font-semibold text-purple-600 mb-4">
              {confirmedEmail}
            </p>
            
            <p className="text-gray-600 mb-6 leading-relaxed">
              Por favor, revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
            </p>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6 mb-6 text-left w-full">
              <p className="font-semibold text-purple-700 mb-3 text-base">
                ¿No recibiste el email?
              </p>
              <ul className="space-y-2">
                <li className="pl-6 relative text-sm text-gray-600">
                  <span className="absolute left-2 text-purple-600 font-bold">•</span>
                  Revisa tu carpeta de spam o correo no deseado
                </li>
                <li className="pl-6 relative text-sm text-gray-600">
                  <span className="absolute left-2 text-purple-600 font-bold">•</span>
                  Espera unos minutos, puede tardar en llegar
                </li>
                <li className="pl-6 relative text-sm text-gray-600">
                  <span className="absolute left-2 text-purple-600 font-bold">•</span>
                  Verifica que el email esté correcto
                </li>
              </ul>
            </div>

            <div className="flex gap-4 mb-6 w-full">
              <a
                href={`https://mail.google.com/mail/u/0/#search/in:inbox+from:${encodeURIComponent('noreply@mail.app.supabase.io')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl text-sm font-semibold transition-all duration-300 shadow-[0_4px_15px_rgba(147,51,234,0.3)] hover:shadow-[0_6px_20px_rgba(147,51,234,0.4)] hover:-translate-y-0.5 flex items-center justify-center"
              >
                Abrir Gmail
              </a>
              <a
                href="https://outlook.live.com/mail/0/inbox"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center hover:bg-gray-50 hover:border-purple-600"
              >
                Abrir Outlook
              </a>
            </div>

            <div className="pt-6 border-t-2 border-gray-200 w-full">
              <p className="text-sm text-gray-600">
                Una vez confirmado,{' '}
                <span onClick={switchToLogin} className="text-purple-600 font-semibold cursor-pointer hover:text-purple-700 hover:underline transition-colors">
                  inicia sesión aquí
                </span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}