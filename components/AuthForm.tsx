'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const CITY_IMAGES = [
  'https://images.unsplash.com/photo-1512453575128-d2f4b0e961c3?w=1920&h=1080&fit=crop&q=85',
  'https://images.unsplash.com/photo-1562883714-47a98a3c3872?w=1920&h=1080&fit=crop&q=85',
  'https://images.unsplash.com/photo-1543936552-5150209c26d6?w=1920&h=1080&fit=crop&q=85',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&q=85',
  'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&h=1080&fit=crop&q=85',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&h=1080&fit=crop&q=85',
]

type Step = 'role-select' | 'registration' | 'confirmation' | 'login'
type UserRole = 'host' | 'guest' | 'agent'
type AuthMode = 'signup' | 'signin'

export function AuthForm() {
  const [step, setStep] = useState<Step>('role-select')
  const [role, setRole] = useState<UserRole | null>(null)
  const [authMode, setAuthMode] = useState<AuthMode>('signup')
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
    } else {
      setStep('login')
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
      if (!email.trim()) throw new Error('El email es requerido')
      if (!validateEmail(email)) throw new Error('Por favor ingresa un email válido')

      const passwordError = validatePassword(password)
      if (passwordError) throw new Error(passwordError)

      if (!confirmPassword) throw new Error('Debes confirmar tu contraseña')
      if (password !== confirmPassword) throw new Error('Las contraseñas no coinciden')

      if (!role) throw new Error('Debes seleccionar un tipo de cuenta')

      const referralCode = typeof window !== 'undefined' ? localStorage.getItem('agentReferralCode') : null
      const referralType = typeof window !== 'undefined' ? localStorage.getItem('agentReferralType') : null

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

      localStorage.setItem('userId', data.id)
      localStorage.setItem('userRole', data.user_type)
      localStorage.setItem('userEmail', data.email)

      localStorage.removeItem('agentReferralCode')
      localStorage.removeItem('agentReferralType')

      setStep('confirmation')
      setSuccessMessage(`¡Cuenta creada! Te hemos enviado un email de confirmación a ${email}`)

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
      if (!email.trim()) throw new Error('El email es requerido')
      if (!validateEmail(email)) throw new Error('Por favor ingresa un email válido')

      if (!password) throw new Error('La contraseña es requerida')

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
    return <div className="h-screen w-full bg-black flex items-center justify-center"><p className="text-white">Cargando...</p></div>
  }

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col items-center justify-center"
      style={{
        backgroundImage: `url(${CITY_IMAGES[currentImageIndex]})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-black/35 via-black/25 to-black/35"></div>

      <div className="relative z-10 w-full px-6 flex flex-col items-center justify-center" style={{ gap: '28px' }}>
        {step === 'role-select' && (
          <div className="text-center" style={{ marginTop: '30px' }}>
            <img src="/logo.png" alt="BELIVING" style={{ maxWidth: '260px', height: 'auto', marginBottom: '12px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
            <p className="text-white drop-shadow-lg" style={{ fontSize: '15px', marginTop: '10px', fontWeight: '400' }}>Una nueva forma de vivir</p>
          </div>
        )}

        {step === 'role-select' && (
          <div className="rounded-3xl border border-white/30 bg-amber-100/20 backdrop-blur-sm" style={{ padding: '32px 32px', maxWidth: '400px', width: '100%', minHeight: '340px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h2 className="font-bold text-gray-800 text-center" style={{ fontSize: '15px', marginBottom: '20px' }}>¿Cuál es tu rol?</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  onClick={() => handleRoleSelect('guest')}
                  style={{ padding: '11px 16px', borderRadius: '24px', lineHeight: '1.2', alignSelf: 'center', width: '280px' }}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold transition flex items-center justify-between"
                >
                  <div className="flex items-center" style={{ gap: '12px', flex: 1 }}>
                    <span style={{ fontSize: '20px', flexShrink: 0 }}>✈️</span>
                    <div className="text-left">
                      <p className="font-bold" style={{ fontSize: '13px', lineHeight: '1.1', margin: '0' }}>Viajero</p>
                      <p style={{ fontSize: '11px', opacity: 0.9, lineHeight: '1.1', margin: '0' }}>Buscar hospedajes</p>
                    </div>
                  </div>
                  <span style={{ fontSize: '17px', marginLeft: '10px', flexShrink: 0 }}>→</span>
                </button>

                <button
                  onClick={() => handleRoleSelect('host')}
                  style={{ padding: '11px 16px', borderRadius: '24px', lineHeight: '1.2', alignSelf: 'center', width: '280px' }}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold transition flex items-center justify-between"
                >
                  <div className="flex items-center" style={{ gap: '12px', flex: 1 }}>
                    <span style={{ fontSize: '20px', flexShrink: 0 }}>🔑</span>
                    <div className="text-left">
                      <p className="font-bold" style={{ fontSize: '13px', lineHeight: '1.1', margin: '0' }}>Anfitrión</p>
                      <p style={{ fontSize: '11px', opacity: 0.9, lineHeight: '1.1', margin: '0' }}>Listar propiedades</p>
                    </div>
                  </div>
                  <span style={{ fontSize: '17px', marginLeft: '10px', flexShrink: 0 }}>→</span>
                </button>

                <button
                  onClick={() => handleRoleSelect('agent')}
                  style={{ padding: '11px 16px', borderRadius: '24px', lineHeight: '1.2', alignSelf: 'center', width: '280px' }}
                  className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold transition flex items-center justify-between"
                >
                  <div className="flex items-center" style={{ gap: '12px', flex: 1 }}>
                    <span style={{ fontSize: '20px', flexShrink: 0 }}>💎</span>
                    <div className="text-left">
                      <p className="font-bold" style={{ fontSize: '13px', lineHeight: '1.1', margin: '0' }}>Agente</p>
                      <p style={{ fontSize: '11px', opacity: 0.9, lineHeight: '1.1', margin: '0' }}>Ganar comisiones</p>
                    </div>
                  </div>
                  <span style={{ fontSize: '17px', marginLeft: '10px', flexShrink: 0 }}>→</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0', alignItems: 'center' }}>
              <div className="border-t border-white/20" style={{ width: '100%', marginBottom: '16px' }}></div>

              <button
                onClick={() => {
                  setAuthMode(authMode === 'signup' ? 'signin' : 'signup')
                  setRole(null)
                  setError('')
                }}
                className="text-gray-700 hover:text-gray-800 font-medium"
                style={{ fontSize: '13px', padding: '8px 20px', border: '1px solid rgba(107, 114, 128, 0.3)', borderRadius: '6px', backgroundColor: 'transparent' }}
              >
                {authMode === 'signup' ? 'Ingresar' : 'Registrarse'}
              </button>
            </div>
          </div>
        )}

        {step === 'registration' && (
          <div className="rounded-3xl p-6 border border-white/20 bg-amber-100/25 backdrop-blur-xl w-full max-w-xs">
            <h2 className="text-lg font-bold text-gray-800 text-center mb-4">Crear Cuenta</h2>

            <form onSubmit={handleRegistration} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-4 py-3 rounded-xl bg-white/40 border border-white/30 text-gray-900 placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                required
              />

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                className="w-full px-4 py-3 rounded-xl bg-white/40 border border-white/30 text-gray-900 placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                required
              />

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmar contraseña"
                className="w-full px-4 py-3 rounded-xl bg-white/40 border border-white/30 text-gray-900 placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                required
              />

              {error && <div className="p-3 rounded-lg bg-red-500/30 border border-red-400/50 text-white text-xs">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 rounded-xl transition disabled:opacity-50"
              >
                {loading ? 'Creando...' : 'Crear Cuenta'}
              </button>

              <button
                type="button"
                onClick={() => setStep('role-select')}
                className="w-full text-gray-700 hover:text-gray-800 text-xs font-medium py-2"
              >
                Volver
              </button>
            </form>
          </div>
        )}

        {step === 'login' && (
          <div className="rounded-3xl p-6 border border-white/20 bg-amber-100/25 backdrop-blur-xl w-full max-w-xs">
            <h2 className="text-lg font-bold text-gray-800 text-center mb-4">Ingresar</h2>

            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-4 py-3 rounded-xl bg-white/40 border border-white/30 text-gray-900 placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                required
              />

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                className="w-full px-4 py-3 rounded-xl bg-white/40 border border-white/30 text-gray-900 placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                required
              />

              {error && <div className="p-3 rounded-lg bg-red-500/30 border border-red-400/50 text-white text-xs">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 rounded-xl transition disabled:opacity-50"
              >
                {loading ? 'Ingresando...' : 'Ingresar'}
              </button>

              <button
                type="button"
                onClick={() => setStep('role-select')}
                className="w-full text-gray-700 hover:text-gray-800 text-xs font-medium py-2"
              >
                Volver
              </button>
            </form>
          </div>
        )}

        {step === 'confirmation' && (
          <div className="rounded-3xl p-6 border border-white/20 bg-amber-100/25 backdrop-blur-xl text-center w-full max-w-xs">
            <div className="text-4xl mb-3">✓</div>
            <p className="text-gray-900 font-bold mb-2 text-sm">{successMessage}</p>
            <p className="text-gray-800 text-xs">Te llevaremos al siguiente paso en unos momentos...</p>
          </div>
        )}
      </div>
    </div>
  )
}
