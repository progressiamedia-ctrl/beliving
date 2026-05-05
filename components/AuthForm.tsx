'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const CITY_IMAGES = [
  'https://images.unsplash.com/photo-1512453575128-d2f4b0e961c3?w=1920&h=1080&fit=crop&q=85', // Dubai
  'https://images.unsplash.com/photo-1562883714-47a98a3c3872?w=1920&h=1080&fit=crop&q=85', // Barcelona
  'https://images.unsplash.com/photo-1543936552-5150209c26d6?w=1920&h=1080&fit=crop&q=85', // Madrid
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&q=85', // Cancún
  'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&h=1080&fit=crop&q=85', // Punta Cana
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&h=1080&fit=crop&q=85', // Viña del Mar
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1920&h=1080&fit=crop&q=85', // París
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&q=85', // Melbourne
  'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=1920&h=1080&fit=crop&q=85', // Bogotá
  'https://images.unsplash.com/photo-1532619675605-1ede6c2e5ddb?w=1920&h=1080&fit=crop&q=85', // Tailandia
  'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=1920&h=1080&fit=crop&q=85', // Santorini
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1920&h=1080&fit=crop&q=85', // Bora Bora
]

type Step = 'role-select' | 'registration' | 'confirmation' | 'login'
type UserRole = 'host' | 'guest' | 'agent'
type AuthMode = 'signup' | 'signin'

export function AuthForm() {
  const [step, setStep] = useState<Step>('role-select')
  const [role, setRole] = useState<UserRole | null>(null)
  const [authMode, setAuthMode] = useState<AuthMode>('signup')
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [mounted, setMounted] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    setCurrentImageIndex(0)
  }, [])

  useEffect(() => {
    const imageInterval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % CITY_IMAGES.length)
    }, 4000)
    return () => clearInterval(imageInterval)
  }, [])


  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole)
    if (authMode === 'signup') {
      setStep('registration')
      setIsSignUp(true)
    } else {
      setStep('login')
      setIsSignUp(false)
    }
    setError('')
  }

  const validateEmail = (emailStr: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(emailStr)
  }

  const validatePassword = (pwd: string): string | null => {
    if (!pwd) return 'La contraseña es requerida'
    if (pwd.length < 6) return 'La contraseña debe tener al menos 6 caracteres'
    if (pwd.length > 128) return 'La contraseña no puede exceder 128 caracteres'
    return null
  }

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate email
      if (!email.trim()) throw new Error('El email es requerido')
      if (!validateEmail(email)) throw new Error('Por favor ingresa un email válido (ej: usuario@ejemplo.com)')

      // Validate password
      const passwordError = validatePassword(password)
      if (passwordError) throw new Error(passwordError)

      // Validate password confirmation
      if (!confirmPassword) throw new Error('Debes confirmar tu contraseña')
      if (password !== confirmPassword) throw new Error('Las contraseñas no coinciden')

      if (!role) throw new Error('Debes seleccionar un tipo de cuenta')

      // Get referral code from localStorage if available
      const referralCode = typeof window !== 'undefined' ? localStorage.getItem('agentReferralCode') : null
      const referralType = typeof window !== 'undefined' ? localStorage.getItem('agentReferralType') : null

      // Call the API endpoint instead of directly accessing Supabase
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          user_type: role,
          ...(referralCode && referralType && { referral_code: referralCode, referral_type: referralType })
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrarse')
      }

      // Save to localStorage
      localStorage.setItem('userId', data.id)
      localStorage.setItem('userRole', data.user_type)
      localStorage.setItem('userEmail', data.email)

      // Clear referral codes from localStorage
      localStorage.removeItem('agentReferralCode')
      localStorage.removeItem('agentReferralType')

      setStep('confirmation')
      setSuccessMessage(`¡Cuenta creada! Te hemos enviado un email de confirmación a ${email}`)

      // Simulate email confirmation - in production, use Resend or similar
      setTimeout(() => {
        router.push(`/onboarding/${role}`)
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate email
      if (!email.trim()) throw new Error('El email es requerido')
      if (!validateEmail(email)) throw new Error('Por favor ingresa un email válido')

      // Validate password
      if (!password) throw new Error('La contraseña es requerida')

      // Call the API endpoint instead of directly accessing Supabase
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password
        })
      })

      const user = await response.json()

      if (!response.ok) {
        throw new Error(user.error || 'Error al ingresar')
      }

      localStorage.setItem('userId', user.id)
      localStorage.setItem('userRole', user.user_type)
      localStorage.setItem('userEmail', user.email)

      // Redirect based on user type
      const redirectMap: Record<string, string> = {
        'host': '/host/dashboard',
        'guest': '/properties',
        'agent': '/agent',
        'admin': '/admin'
      }
      router.push(redirectMap[user.user_type] || '/properties')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al ingresar')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white dark:bg-black">
        <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Fondo con imagen de país turístico */}
      <div
        className="absolute inset-0 transition-all duration-1000 ease-in-out"
        style={{
          backgroundImage: `url(${CITY_IMAGES[currentImageIndex]})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Overlay con gradiente para mejorar legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/25 to-black/35"></div>
      </div>

      <div className="relative z-10 w-full px-6 py-12 flex flex-col items-center justify-center min-h-[100vh] gap-8">
        {/* Logo - Parte Superior */}
        {step === 'role-select' && (
          <div className="text-center animate-fade-in">
            <img
              src="/logo.png"
              alt="Be Living"
              className="h-12 w-auto mx-auto mb-2"
            />
            <p className="text-base font-medium text-white drop-shadow-lg">Una nueva forma de vivir</p>
          </div>
        )}

        {/* Card Principal - Login/Registro */}
        <div className="w-full max-w-md backdrop-blur-[80px] rounded-[32px] p-8 shadow-2xl border transition-all duration-300 bg-white/20 border-white/40 backdrop-saturate-200">
          {/* STEP 1: Role Selection */}
          {step === 'role-select' && (
            <div className="space-y-4">
              <p className="text-center text-xl font-bold text-white mb-4">
                {authMode === 'signup' ? '¿Cuál es tu rol?' : 'Elige tu perfil'}
              </p>

              <div className="space-y-3">
                {/* Viajero */}
                <button
                  onClick={() => handleRoleSelect('guest')}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-between px-6 group"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">✈️</span>
                    <div className="text-left">
                      <p className="font-bold text-base">Viajero</p>
                      <p className="text-xs opacity-90">Buscar hospedajes</p>
                    </div>
                  </div>
                  <span className="text-xl group-hover:translate-x-1 transition">→</span>
                </button>

                {/* Anfitrión */}
                <button
                  onClick={() => handleRoleSelect('host')}
                  className="w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white font-bold py-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-between px-6 group"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">🔑</span>
                    <div className="text-left">
                      <p className="font-bold text-base">Anfitrión</p>
                      <p className="text-xs opacity-90">Listar propiedades</p>
                    </div>
                  </div>
                  <span className="text-xl group-hover:translate-x-1 transition">→</span>
                </button>

                {/* Agente */}
                <button
                  onClick={() => handleRoleSelect('agent')}
                  className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold py-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-between px-6 group"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">💰</span>
                    <div className="text-left">
                      <p className="font-bold text-base">Agente</p>
                      <p className="text-xs opacity-90">Ganar comisiones</p>
                    </div>
                  </div>
                  <span className="text-xl group-hover:translate-x-1 transition">→</span>
                </button>
              </div>

              <div className="relative my-8 flex items-center gap-4">
                <div className="flex-1 h-px bg-gradient-to-r from-white/30 to-transparent"></div>
                <span className="text-xs font-medium text-white/70 whitespace-nowrap">
                  {authMode === 'signup' ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
                </span>
                <div className="flex-1 h-px bg-gradient-to-l from-white/30 to-transparent"></div>
              </div>

              <button
                onClick={() => {
                  setAuthMode(authMode === 'signup' ? 'signin' : 'signup')
                  setRole(null)
                  setError('')
                }}
                aria-label={authMode === 'signup' ? 'Ir a iniciar sesión' : 'Ir a registrarse'}
                className="w-full px-6 py-3 backdrop-blur-[20px] border border-white/40 bg-white/20 text-white font-medium rounded-2xl transition duration-300 hover:bg-white/30"
              >
                {authMode === 'signup' ? 'Ingresar' : 'Registrarse'}
              </button>
            </div>
          )}

          {/* STEP 2: Registration Form */}
          {step === 'registration' && isSignUp && (
            <form onSubmit={handleRegistration} className="space-y-6">
              <div>
                <p className="text-base mb-2 text-white">
                  Crear cuenta como <span className="font-bold capitalize text-white">
                    {role === 'guest' ? 'Viajero' : role === 'host' ? 'Anfitrión' : 'Agente'}
                  </span>
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label htmlFor="auth-email" className="block text-sm font-semibold mb-2 text-white">Correo electrónico</label>
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition backdrop-blur-[20px] bg-white/20 border-white/40 text-white placeholder-white/70"
                    placeholder="tu@email.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="auth-password" className="block text-sm font-semibold mb-2 text-gray-900">Contraseña</label>
                  <input
                    id="auth-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition backdrop-blur-[20px] bg-white/20 border-white/40 text-white placeholder-white/70"
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="auth-confirm-password" className="block text-sm font-semibold mb-2 text-gray-900">Confirmar contraseña</label>
                  <input
                    id="auth-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition backdrop-blur-[20px] bg-white/20 border-white/40 text-white placeholder-white/70"
                    placeholder="Confirma tu contraseña"
                    required
                  />
                </div>
              </div>

              {error && (
                <div role="alert" className="p-3 border rounded-xl text-sm bg-red-50 border-red-300 text-red-700">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 disabled:from-yellow-400/50 disabled:to-yellow-500/50 text-black font-bold py-3 rounded-xl transition duration-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </button>

              <button
                type="button"
                onClick={() => setStep('role-select')}
                className="w-full text-sm transition font-medium text-white/70 hover:text-white"
              >
                Volver atras
              </button>
            </form>
          )}

          {/* STEP 3: Confirmation */}
          {step === 'confirmation' && (
            <div className="text-center space-y-6 py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 animate-bounce">
                <span className="text-3xl">✓</span>
              </div>
              <div>
                <p className="font-bold text-lg mb-2 text-green-700">{successMessage}</p>
                <p className="text-sm text-gray-700">Te llevaremos al siguiente paso en unos momentos...</p>
              </div>
              <div className="w-full rounded-full h-1 overflow-hidden bg-gray-200">
                <div className="h-full bg-green-400 animate-pulse" style={{ width: '100%' }} />
              </div>
            </div>
          )}

          {/* STEP 4: Login */}
          {step === 'login' && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <p className="text-base mb-1 text-white">
                  Ingresar como <span className="font-bold capitalize text-white">
                    {role === 'guest' ? 'Viajero' : role === 'host' ? 'Anfitrión' : 'Agente'}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setRole(null)
                    setError('')
                  }}
                  className="text-xs text-blue-300 hover:text-blue-100 font-medium"
                >
                  Cambiar tipo de cuenta
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label htmlFor="login-email" className="block text-sm font-semibold mb-2 text-gray-900">Correo electrónico</label>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition backdrop-blur-[20px] bg-white/20 border-white/40 text-white placeholder-white/70"
                    placeholder="tu@email.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="login-password" className="block text-sm font-semibold mb-2 text-gray-900">Contraseña</label>
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition backdrop-blur-[20px] bg-white/20 border-white/40 text-white placeholder-white/70"
                    placeholder="Tu contraseña"
                    required
                  />
                </div>
              </div>

              {error && (
                <div role="alert" className="p-3 border rounded-xl text-sm bg-red-50 border-red-300 text-red-700">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 disabled:from-yellow-400/50 disabled:to-yellow-500/50 text-black font-bold py-3 rounded-xl transition duration-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Ingresando...' : 'Ingresar'}
              </button>

              <button
                type="button"
                onClick={() => setStep('role-select')}
                className="w-full text-sm transition font-medium text-white/70 hover:text-white"
              >
                Volver atras
              </button>
            </form>
          )}
        </div>
      </div>

    </div>
  )
}
