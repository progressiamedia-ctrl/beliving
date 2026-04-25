'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const CITY_IMAGES = [
  'https://images.unsplash.com/photo-1512453575128-d2f4b0e961c3?auto=format&fit=crop&w=2000&q=80', // Dubai
  'https://images.unsplash.com/photo-1583604949505-58b94304e980?auto=format&fit=crop&w=2000&q=80', // Barcelona
  'https://images.unsplash.com/photo-1543936552-5150209c26d6?auto=format&fit=crop&w=2000&q=80', // Madrid
  'https://images.unsplash.com/photo-1537996051842-4e406c6f2cf9?auto=format&fit=crop&w=2000&q=80', // Bali
  'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=2000&q=80', // Cancun
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80', // Viña del Mar
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
  const router = useRouter()

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % CITY_IMAGES.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleRoleSelect = (selectedRole: 'guest' | 'host') => {
    setRole(selectedRole)
    setStep('registration')
    setIsSignUp(true)
    setError('')
  }

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!email.includes('@')) throw new Error('Email inválido')
      if (password.length < 6) throw new Error('Contraseña debe tener al menos 6 caracteres')
      if (password !== confirmPassword) throw new Error('Las contraseñas no coinciden')
      if (!role) throw new Error('Debes seleccionar un tipo de cuenta')

      const { hashPassword } = await import('@/lib/auth')
      const hashedPassword = await hashPassword(password)

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (existingUser) throw new Error('Este email ya está registrado')

      // Create new user
      const { data, error: insertError } = await supabase
        .from('users')
        .insert([{
          email,
          password_hash: hashedPassword,
          user_type: role,
          verified: false
        }])
        .select()
        .single()

      if (insertError) throw insertError

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
      if (!email.includes('@')) throw new Error('Email inválido')
      if (!password) throw new Error('Ingresa tu contraseña')

      const { signIn } = await import('@/lib/auth')
      const user = await signIn(email, password)

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

  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden transition-all duration-1000"
      style={{
        backgroundImage: `url(${CITY_IMAGES[bgIndex]})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/40 to-black/50" />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="backdrop-blur-xl bg-white/[0.08] border border-white/20 rounded-3xl p-10 shadow-2xl">
          {/* Logo */}
          <div className="mb-10 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-500 mb-4 mx-auto">
              <span className="text-2xl">🏠</span>
            </div>
            <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">Be Living</h1>
            <p className="text-white/70 text-base font-medium">El futuro del alojamiento global</p>
          </div>

          {/* STEP 1: Role Selection */}
          {step === 'role-select' && (
            <div className="space-y-6">
              <p className="text-white text-center text-lg font-medium">¿Cuál es tu rol?</p>

              <div className="space-y-3">
                <button
                  onClick={() => handleRoleSelect('guest')}
                  className="w-full group relative overflow-hidden rounded-2xl p-px"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 opacity-100 group-hover:opacity-100 transition duration-300" />
                  <div className="relative bg-black rounded-[14px] px-6 py-4 group-hover:bg-black/80 transition duration-300">
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-2xl">🏠</span>
                      <div className="text-left">
                        <p className="text-white font-bold text-sm">Viajero</p>
                        <p className="text-white/60 text-xs">Buscar hospedajes</p>
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleRoleSelect('host')}
                  className="w-full group relative overflow-hidden rounded-2xl p-px"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-100 group-hover:opacity-100 transition duration-300" />
                  <div className="relative bg-black rounded-[14px] px-6 py-4 group-hover:bg-black/80 transition duration-300">
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-2xl">🔑</span>
                      <div className="text-left">
                        <p className="text-white font-bold text-sm">Anfitrión</p>
                        <p className="text-white/60 text-xs">Listar propiedades</p>
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-white/5 text-white/50 text-xs font-medium">¿Ya tienes cuenta?</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setStep('login')
                  setIsSignUp(false)
                  setError('')
                }}
                className="w-full px-6 py-3 border border-white/20 text-white font-medium rounded-2xl hover:bg-white/5 hover:border-white/40 transition duration-300"
              >
                Ingresar
              </button>
            </div>
          )}

          {/* STEP 2: Registration Form */}
          {step === 'registration' && isSignUp && (
            <form onSubmit={handleRegistration} className="space-y-6">
              <div>
                <p className="text-white/80 text-base mb-2">
                  Crear cuenta como <span className="font-bold capitalize text-white">{role === 'guest' ? 'Viajero' : 'Anfitrión'}</span>
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Correo electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
                    placeholder="tu@email.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Contraseña</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Confirmar contraseña</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
                    placeholder="Confirma tu contraseña"
                    required
                  />
                </div>
              </div>

              {error && <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">{error}</div>}

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
                className="w-full text-white/70 text-sm hover:text-white transition font-medium"
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
                <p className="text-green-300 font-bold text-lg mb-2">{successMessage}</p>
                <p className="text-white/60 text-sm">Te llevaremos al siguiente paso en unos momentos...</p>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
                <div className="h-full bg-green-400 animate-pulse" style={{ width: '100%' }} />
              </div>
            </div>
          )}

          {/* STEP 4: Login */}
          {step === 'login' && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Correo electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
                    placeholder="tu@email.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Contraseña</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
                    placeholder="Tu contraseña"
                    required
                  />
                </div>
              </div>

              {error && <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">{error}</div>}

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
                className="w-full text-white/70 text-sm hover:text-white transition font-medium"
              >
                ← Volver atrás
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Image indicators */}
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
    </div>
  )
}
