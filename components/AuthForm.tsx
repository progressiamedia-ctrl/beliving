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
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-4xl font-light text-white mb-2">Be Living</h1>
            <p className="text-white/80 text-sm">Access the global stay network</p>
          </div>

          {/* STEP 1: Role Selection */}
          {step === 'role-select' && (
            <div className="space-y-4">
              <p className="text-white text-center mb-6">¿Qué tipo de cuenta deseas?</p>
              <button
                onClick={() => handleRoleSelect('guest')}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 rounded-lg transition"
              >
                🏠 Buscar Hospedajes (Guest)
              </button>
              <button
                onClick={() => handleRoleSelect('host')}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition"
              >
                🔑 Listar Propiedades (Host)
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white/10 text-white/60">¿Ya tienes cuenta?</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setStep('login')
                  setIsSignUp(false)
                  setError('')
                }}
                className="w-full border border-white/20 text-white py-2 rounded-lg hover:bg-white/5 transition"
              >
                Ingresar
              </button>
            </div>
          )}

          {/* STEP 2: Registration Form */}
          {step === 'registration' && isSignUp && (
            <form onSubmit={handleRegistration} className="space-y-5">
              <div>
                <p className="text-white/80 text-sm mb-4">
                  Registrarse como <span className="font-semibold capitalize">{role}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-2 uppercase">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-2 uppercase">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-2 uppercase">Confirmar Contraseña</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="Confirma tu contraseña"
                  required
                />
              </div>

              {error && <p className="text-red-300 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-semibold py-3 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Creando cuenta...' : 'Registrarse'}
              </button>

              <button
                type="button"
                onClick={() => setStep('role-select')}
                className="w-full text-white/80 text-sm hover:text-white transition"
              >
                ← Volver
              </button>
            </form>
          )}

          {/* STEP 3: Confirmation */}
          {step === 'confirmation' && (
            <div className="text-center space-y-4">
              <div className="text-4xl">✓</div>
              <p className="text-green-300 font-semibold">{successMessage}</p>
              <p className="text-white/60 text-sm">Redirigiendo al onboarding en unos segundos...</p>
            </div>
          )}

          {/* STEP 4: Login */}
          {step === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-2 uppercase">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-2 uppercase">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="Tu contraseña"
                  required
                />
              </div>

              {error && <p className="text-red-300 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-semibold py-3 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Ingresando...' : 'Entrar'}
              </button>

              <button
                type="button"
                onClick={() => setStep('role-select')}
                className="w-full text-white/80 text-sm hover:text-white transition"
              >
                ← Volver
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Image indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
        {CITY_IMAGES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setBgIndex(idx)}
            className={`w-2 h-2 rounded-full transition ${
              idx === bgIndex ? 'bg-yellow-400 w-6' : 'bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
