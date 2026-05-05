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

export function AuthForm() {
  const [step, setStep] = useState<Step>('role-select')
  const [role, setRole] = useState<UserRole | null>(null)
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
    const randomIndex = Math.floor(Math.random() * CITY_IMAGES.length)
    setCurrentImageIndex(randomIndex)
  }, [])

  useEffect(() => {
    const imageInterval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % CITY_IMAGES.length)
    }, 4000)
    return () => clearInterval(imageInterval)
  }, [])


  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole)
    setStep('registration')
    setIsSignUp(true)
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

      <div className="relative z-10 w-full max-w-md px-6 flex items-center justify-center">
        <div className="w-full backdrop-blur-[40px] rounded-3xl p-8 shadow-2xl border transition-all duration-300 bg-gradient-to-br from-white/25 to-white/15 border-white/40 backdrop-saturate-150 hover:border-white/50">
          {/* Logo */}
          <div className="mb-10 text-center">
            <img
              src="/logo.png"
              alt="Be Living"
              className="h-16 w-auto mx-auto mb-4"
            />
            <p className="text-base font-medium text-gray-600">Una nueva forma de vivir</p>
          </div>

          {/* STEP 1: Role Selection */}
          {step === 'role-select' && (
            <div className="space-y-6">
              <p className="text-center text-lg font-medium text-gray-900">¿Cuál es tu rol?</p>

              <div className="space-y-3">
                <button
                  onClick={() => handleRoleSelect('guest')}
                  aria-label="Registrarse como viajero"
                  className="w-full group relative overflow-hidden rounded-2xl p-px"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 opacity-100 group-hover:opacity-100 transition duration-300" />
                  <div className="relative rounded-[14px] px-6 py-4 transition duration-300 bg-white group-hover:bg-gray-50">
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-2xl">✈️</span>
                      <div className="text-left">
                        <p className="font-bold text-sm text-gray-900">Viajero</p>
                        <p className="text-xs text-gray-600">Buscar hospedajes</p>
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleRoleSelect('host')}
                  aria-label="Registrarse como anfitrión"
                  className="w-full group relative overflow-hidden rounded-2xl p-px"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-100 group-hover:opacity-100 transition duration-300" />
                  <div className="relative rounded-[14px] px-6 py-4 transition duration-300 bg-white group-hover:bg-gray-50">
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-2xl">🔑</span>
                      <div className="text-left">
                        <p className="font-bold text-sm text-gray-900">Anfitrión</p>
                        <p className="text-xs text-gray-600">Listar propiedades</p>
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleRoleSelect('agent')}
                  aria-label="Registrarse como agente"
                  className="w-full group relative overflow-hidden rounded-2xl p-px"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 opacity-100 group-hover:opacity-100 transition duration-300" />
                  <div className="relative rounded-[14px] px-6 py-4 transition duration-300 bg-white group-hover:bg-gray-50">
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-2xl">💰</span>
                      <div className="text-left">
                        <p className="font-bold text-sm text-gray-900">Agente</p>
                        <p className="text-xs text-gray-600">Referir y ganar comisiones</p>
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 text-xs font-medium bg-gray-50 text-gray-600">¿Ya tienes cuenta?</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setStep('login')
                  setIsSignUp(false)
                  setError('')
                }}
                aria-label="Ir a iniciar sesión"
                className="w-full px-6 py-3 border font-medium rounded-2xl transition duration-300 border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400"
              >
                Ingresar
              </button>
            </div>
          )}

          {/* STEP 2: Registration Form */}
          {step === 'registration' && isSignUp && (
            <form onSubmit={handleRegistration} className="space-y-6">
              <div>
                <p className="text-base mb-2 text-gray-700">
                  Crear cuenta como <span className="font-bold capitalize text-gray-900">
                    {role === 'guest' ? 'Viajero' : role === 'host' ? 'Anfitrión' : 'Agente'}
                  </span>
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label htmlFor="auth-email" className="block text-sm font-semibold mb-2 text-gray-900">Correo electrónico</label>
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
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
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
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
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
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
                className="w-full text-sm transition font-medium text-gray-600 hover:text-gray-900"
              >
                ← Volver atrás
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
                <p className="text-sm text-gray-600">Te llevaremos al siguiente paso en unos momentos...</p>
              </div>
              <div className="w-full rounded-full h-1 overflow-hidden bg-gray-200">
                <div className="h-full bg-green-400 animate-pulse" style={{ width: '100%' }} />
              </div>
            </div>
          )}

          {/* STEP 4: Login */}
          {step === 'login' && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-3">
                <div>
                  <label htmlFor="login-email" className="block text-sm font-semibold mb-2 text-gray-900">Correo electrónico</label>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
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
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
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
                className="w-full text-sm transition font-medium text-gray-600 hover:text-gray-900"
              >
                ← Volver atrás
              </button>
            </form>
          )}
        </div>
      </div>

    </div>
  )
}
