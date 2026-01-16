import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, Lock } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import '../../index.css'
import Input from '@/components/common/input'
import Button from '@/components/common/button'
import Header from '@/components/common/header'

export default function AuthPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)

  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  })

  const { signIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam === 'not_registered') {
      setError(
        'Tu cuenta no está habilitada en el sistema. Contacta a un administrador para que te cree el usuario y asigne rol/disciplinas.'
      )
    }
  }, [searchParams])

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

  return (
    <div className="w-full h-screen bg-white relative overflow-hidden flex">
      {/* Círculos decorativos */}
      <div className="absolute right-0 top-0 w-1/2 h-full flex items-center justify-center z-0 pointer-events-none">
        <div
          className="absolute w-[1000px] h-[1000px] rounded-full bg-gradient-to-br shadow-lg top-[60%] left-[70%] -translate-x-1/2 -translate-y-1/2"
          style={{
            background:
              'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), transparent), linear-gradient(135deg, #031926 0%, #468189 100%)',
          }}
        />
        <div
          className="absolute w-[800px] h-[800px] rounded-full top-[60%] left-[70%] -translate-x-1/2 -translate-y-1/2"
          style={{
            background:
              'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), transparent), linear-gradient(135deg, #468189 0%, #9dbebb 100%)',
          }}
        />
        <div
          className="absolute w-[600px] h-[600px] rounded-full top-[60%] left-[70%] -translate-x-1/2 -translate-y-1/2"
          style={{
            background:
              'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), transparent), linear-gradient(135deg, #77aca2 0%, #f4e9cd 100%)',
          }}
        />
      </div>

      {/* Panel derecho (branding) */}
      <div className="absolute -right-30 top-20 w-1/2 h-full flex items-center justify-center z-0 pointer-events-none">
        <div className="w-[280px] h-[180px] relative">
          <h1 className="text-4xl text-center font-extrabold text-black mb-2">
            Bienvenido
          </h1>
          <p className="text-black border-y-2 border-purple-600 text-base text-center py-4 mb-8 font-semibold">
            Control de Documentación
          </p>
        </div>
      </div>

      {/* Login */}
      <div className="w-1/2 p-12 flex flex-col justify-center absolute left-0 top-0 h-full z-10">
        <div className="w-full max-h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-gray-100">
          {error && (
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
              onChange={(e) =>
                setLoginData({ ...loginData, password: e.target.value })
              }
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
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {loadingGoogle ? 'Conectando...' : 'Continuar con Google'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

