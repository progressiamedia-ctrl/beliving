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
  'https://images.unsplash.com/photo-1532619675605-1ede6c2e5ddb?w=1920&h=1080&fit=crop&q=85', // Ciudad de México
]

type Step = 'role-select' | 'registration' | 'confirmation' | 'login'

export function AuthForm() {
  const [step, setStep] = useState<Step>('role-select')
  const [role, setRole] = useState<'host' | 'guest' | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [bgIndex, setBgIndex] = useState(0)
  const [imagesLoaded, setImagesLoaded] = useState<Set<number>>(new Set())
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const router = useRouter()

  useEffect(() => {
    setMounted(true)

    const isDark = document.documentElement.classList.contains('dark')
    setTheme(isDark ? 'dark' : 'light')

    const preloadImages = () => {
      CITY_IMAGES.forEach((img, idx) => {
        const image = new Image()
        image.onload = () => {
          setImagesLoaded((prev) => new Set([...prev, idx]))
        }
        image.src = img
      })
    }
    preloadImages()

    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % CITY_IMAGES.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    window.dispatchEvent(new CustomEvent('theme-toggle', { detail: { theme: newTheme } }))
  }

  const handleRoleSelect = (selectedRole: 'guest' | 'host') => {
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

      // Call the API endpoint instead of directly accessing Supabase
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          user_type: role
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

      router.push(user.user_type === 'host' ? '/host/dashboard' : '/properties')
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
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-white dark:bg-black">
      {theme === 'dark' && (
        <>
          <div
            className="absolute inset-0 transition-opacity duration-1000"
            style={{
              backgroundImage: `url(${CITY_IMAGES[bgIndex]})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60" />
        </>
      )}

      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        aria-label={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
        className="absolute top-6 right-6 z-50 p-3 rounded-full transition-all duration-300 dark:bg-white/10 dark:hover:bg-white/20 bg-black/10 hover:bg-black/20 backdrop-blur-sm border dark:border-white/20 border-black/20"
        title={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
      >
        {theme === 'dark' ? (
          <svg
            className="w-5 h-5 text-yellow-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.293 2.293a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zm2.414 4.414a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm-2.121 2.121a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zM10 18a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm-4.293-2.293a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zm-2.414-4.414a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm2.121-2.121a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zM10 5a5 5 0 100 10 5 5 0 000-10z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg
            className="w-5 h-5 text-gray-700"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        )}
      </button>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className={`backdrop-blur-xl rounded-3xl p-10 shadow-2xl border transition-colors duration-300 ${
          theme === 'dark'
            ? 'bg-white/[0.08] border-white/20'
            : 'bg-white/90 border-gray-200'
        }`}>
          {/* Logo */}
          <div className="mb-10 text-center">
            <img
              src="/logo.png"
              alt="Be Living"
              className="h-16 w-auto mx-auto mb-4"
            />
            <h1 className={`text-3xl font-bold mb-2 tracking-tight ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Be Living</h1>
            <p className={`text-base font-medium ${
              theme === 'dark' ? 'text-white/70' : 'text-gray-600'
            }`}>El futuro del alojamiento global</p>
          </div>

          {/* STEP 1: Role Selection */}
          {step === 'role-select' && (
            <div className="space-y-6">
              <p className={`text-center text-lg font-medium ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>¿Cuál es tu rol?</p>

              <div className="space-y-3">
                <button
                  onClick={() => handleRoleSelect('guest')}
                  aria-label="Registrarse como viajero"
                  className="w-full group relative overflow-hidden rounded-2xl p-px"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 opacity-100 group-hover:opacity-100 transition duration-300" />
                  <div className={`relative rounded-[14px] px-6 py-4 transition duration-300 ${
                    theme === 'dark'
                      ? 'bg-black group-hover:bg-black/80'
                      : 'bg-white group-hover:bg-gray-50'
                  }`}>
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-2xl">🏠</span>
                      <div className="text-left">
                        <p className={`font-bold text-sm ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>Viajero</p>
                        <p className={`text-xs ${
                          theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                        }`}>Buscar hospedajes</p>
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
                  <div className={`relative rounded-[14px] px-6 py-4 transition duration-300 ${
                    theme === 'dark'
                      ? 'bg-black group-hover:bg-black/80'
                      : 'bg-white group-hover:bg-gray-50'
                  }`}>
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-2xl">🔑</span>
                      <div className="text-left">
                        <p className={`font-bold text-sm ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>Anfitrión</p>
                        <p className={`text-xs ${
                          theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                        }`}>Listar propiedades</p>
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className={`w-full border-t ${
                    theme === 'dark' ? 'border-white/10' : 'border-gray-300'
                  }`}></div>
                </div>
                <div className="relative flex justify-center">
                  <span className={`px-3 text-xs font-medium ${
                    theme === 'dark'
                      ? 'bg-white/5 text-white/50'
                      : 'bg-gray-50 text-gray-600'
                  }`}>¿Ya tienes cuenta?</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setStep('login')
                  setIsSignUp(false)
                  setError('')
                }}
                aria-label="Ir a iniciar sesión"
                className={`w-full px-6 py-3 border font-medium rounded-2xl transition duration-300 ${
                  theme === 'dark'
                    ? 'border-white/20 text-white hover:bg-white/5 hover:border-white/40'
                    : 'border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                Ingresar
              </button>
            </div>
          )}

          {/* STEP 2: Registration Form */}
          {step === 'registration' && isSignUp && (
            <form onSubmit={handleRegistration} className="space-y-6">
              <div>
                <p className={`text-base mb-2 ${
                  theme === 'dark' ? 'text-white/80' : 'text-gray-700'
                }`}>
                  Crear cuenta como <span className={`font-bold capitalize ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>{role === 'guest' ? 'Viajero' : 'Anfitrión'}</span>
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label htmlFor="auth-email" className={`block text-sm font-semibold mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Correo electrónico</label>
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition ${
                      theme === 'dark'
                        ? 'bg-white/10 border-white/20 text-white placeholder-white/50'
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="tu@email.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="auth-password" className={`block text-sm font-semibold mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Contraseña</label>
                  <input
                    id="auth-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition ${
                      theme === 'dark'
                        ? 'bg-white/10 border-white/20 text-white placeholder-white/50'
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="auth-confirm-password" className={`block text-sm font-semibold mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Confirmar contraseña</label>
                  <input
                    id="auth-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition ${
                      theme === 'dark'
                        ? 'bg-white/10 border-white/20 text-white placeholder-white/50'
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Confirma tu contraseña"
                    required
                  />
                </div>
              </div>

              {error && (
                <div role="alert" className={`p-3 border rounded-xl text-sm ${
                  theme === 'dark'
                    ? 'bg-red-500/20 border-red-500/50 text-red-200'
                    : 'bg-red-50 border-red-300 text-red-700'
                }`}>{error}</div>
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
                className={`w-full text-sm transition font-medium ${
                  theme === 'dark'
                    ? 'text-white/70 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
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
                <p className={`font-bold text-lg mb-2 ${
                  theme === 'dark' ? 'text-green-300' : 'text-green-700'
                }`}>{successMessage}</p>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                }`}>Te llevaremos al siguiente paso en unos momentos...</p>
              </div>
              <div className={`w-full rounded-full h-1 overflow-hidden ${
                theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'
              }`}>
                <div className="h-full bg-green-400 animate-pulse" style={{ width: '100%' }} />
              </div>
            </div>
          )}

          {/* STEP 4: Login */}
          {step === 'login' && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-3">
                <div>
                  <label htmlFor="login-email" className={`block text-sm font-semibold mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Correo electrónico</label>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition ${
                      theme === 'dark'
                        ? 'bg-white/10 border-white/20 text-white placeholder-white/50'
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="tu@email.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="login-password" className={`block text-sm font-semibold mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Contraseña</label>
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition ${
                      theme === 'dark'
                        ? 'bg-white/10 border-white/20 text-white placeholder-white/50'
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Tu contraseña"
                    required
                  />
                </div>
              </div>

              {error && (
                <div role="alert" className={`p-3 border rounded-xl text-sm ${
                  theme === 'dark'
                    ? 'bg-red-500/20 border-red-500/50 text-red-200'
                    : 'bg-red-50 border-red-300 text-red-700'
                }`}>{error}</div>
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
                className={`w-full text-sm transition font-medium ${
                  theme === 'dark'
                    ? 'text-white/70 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ← Volver atrás
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Image indicators */}
      {theme === 'dark' && (
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
          {CITY_IMAGES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setBgIndex(idx)}
              className={`transition-all duration-300 rounded-full ${
                idx === bgIndex ? 'bg-yellow-400 w-8 h-3' : 'bg-white/40 w-2 h-2 hover:bg-white/60'
              }`}
              aria-label={`Go to image ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
