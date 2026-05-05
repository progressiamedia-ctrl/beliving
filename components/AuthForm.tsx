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

type Step = 'role-select' | 'auth-mode' | 'registration' | 'login' | 'confirmation'
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
    setStep('auth-mode')
    setError('')
  }

  const handleAuthModeSelect = (mode: AuthMode) => {
    setAuthMode(mode)
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setError('')
    setStep(mode === 'signup' ? 'registration' : 'login')
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
        backgroundAttachment: 'fixed',
        fontFamily: 'Montserrat, sans-serif'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/30 to-black/40"></div>

      <div className="relative z-10 w-full px-6 flex flex-col items-center justify-center" style={{ gap: '32px' }}>
        {step === 'role-select' && (
          <div className="text-center" style={{ marginTop: '20px' }}>
            <img src="/logo.png" alt="BELIVING" style={{ maxWidth: '280px', height: 'auto', marginBottom: '16px', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }} />
            <p className="text-white drop-shadow-lg" style={{ fontSize: '18px', marginTop: '12px', fontWeight: '400', fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.3px' }}>Una nueva forma de vivir</p>
          </div>
        )}

        {step === 'role-select' && (
          <div className="border border-white/40 bg-white/15 backdrop-blur-xl" style={{ padding: '40px 36px', maxWidth: '440px', width: '100%', minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '24px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)' }}>
            <div>
              <h2 className="font-semibold text-gray-900 text-center" style={{ fontSize: '18px', marginBottom: '28px', fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.2px' }}>¿Cuál es tu rol?</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <button
                  onClick={() => handleRoleSelect('guest')}
                  style={{ padding: '14px 18px', borderRadius: '14px', lineHeight: '1.3', alignSelf: 'center', width: '290px', fontFamily: 'Montserrat, sans-serif', transition: 'all 0.3s ease', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)' }}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium flex items-center justify-between hover:shadow-lg hover:scale-105"
                >
                  <div className="flex items-center" style={{ gap: '14px', flex: 1 }}>
                    <span style={{ fontSize: '22px', flexShrink: 0 }}>✈️</span>
                    <div className="text-left">
                      <p className="font-semibold" style={{ fontSize: '14px', lineHeight: '1.2', margin: '0', fontFamily: 'Montserrat, sans-serif' }}>Viajero</p>
                      <p style={{ fontSize: '12px', opacity: 0.95, lineHeight: '1.2', margin: '2px 0 0 0', fontFamily: 'Montserrat, sans-serif' }}>Buscar hospedajes</p>
                    </div>
                  </div>
                  <span style={{ fontSize: '18px', marginLeft: '12px', flexShrink: 0 }}>→</span>
                </button>

                <button
                  onClick={() => handleRoleSelect('host')}
                  style={{ padding: '14px 18px', borderRadius: '14px', lineHeight: '1.3', alignSelf: 'center', width: '290px', fontFamily: 'Montserrat, sans-serif', transition: 'all 0.3s ease', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)' }}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium flex items-center justify-between hover:shadow-lg hover:scale-105"
                >
                  <div className="flex items-center" style={{ gap: '14px', flex: 1 }}>
                    <span style={{ fontSize: '22px', flexShrink: 0 }}>🔑</span>
                    <div className="text-left">
                      <p className="font-semibold" style={{ fontSize: '14px', lineHeight: '1.2', margin: '0', fontFamily: 'Montserrat, sans-serif' }}>Anfitrión</p>
                      <p style={{ fontSize: '12px', opacity: 0.95, lineHeight: '1.2', margin: '2px 0 0 0', fontFamily: 'Montserrat, sans-serif' }}>Listar propiedades</p>
                    </div>
                  </div>
                  <span style={{ fontSize: '18px', marginLeft: '12px', flexShrink: 0 }}>→</span>
                </button>

                <button
                  onClick={() => handleRoleSelect('agent')}
                  style={{ padding: '14px 18px', borderRadius: '14px', lineHeight: '1.3', alignSelf: 'center', width: '290px', fontFamily: 'Montserrat, sans-serif', transition: 'all 0.3s ease', boxShadow: '0 4px 12px rgba(236, 72, 153, 0.2)' }}
                  className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-medium flex items-center justify-between hover:shadow-lg hover:scale-105"
                >
                  <div className="flex items-center" style={{ gap: '14px', flex: 1 }}>
                    <span style={{ fontSize: '22px', flexShrink: 0 }}>💎</span>
                    <div className="text-left">
                      <p className="font-semibold" style={{ fontSize: '14px', lineHeight: '1.2', margin: '0', fontFamily: 'Montserrat, sans-serif' }}>Agente</p>
                      <p style={{ fontSize: '12px', opacity: 0.95, lineHeight: '1.2', margin: '2px 0 0 0', fontFamily: 'Montserrat, sans-serif' }}>Referir y ganar</p>
                    </div>
                  </div>
                  <span style={{ fontSize: '18px', marginLeft: '12px', flexShrink: 0 }}>→</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'auth-mode' && (
          <div className="border border-white/40 bg-white/15 backdrop-blur-xl" style={{ padding: '48px 36px', maxWidth: '440px', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '16px', borderRadius: '24px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)' }}>
            <h2 className="font-semibold text-gray-900 text-center" style={{ fontSize: '18px', marginBottom: '12px', fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.2px' }}>¿Qué deseas hacer?</h2>

            <button
              onClick={() => handleAuthModeSelect('signup')}
              style={{ padding: '16px 18px', borderRadius: '14px', fontFamily: 'Montserrat, sans-serif', fontSize: '15px', fontWeight: '600', transition: 'all 0.3s ease', boxShadow: '0 4px 12px rgba(250, 204, 21, 0.3)' }}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 py-3 transition hover:shadow-lg hover:scale-105"
            >
              Registrarse
            </button>

            <button
              onClick={() => handleAuthModeSelect('signin')}
              style={{ padding: '16px 18px', borderRadius: '14px', fontFamily: 'Montserrat, sans-serif', fontSize: '15px', fontWeight: '600', border: '2px solid rgba(255, 255, 255, 0.5)', transition: 'all 0.3s ease', background: 'transparent' }}
              className="w-full text-white hover:bg-white/20 py-3 transition hover:shadow-lg hover:scale-105"
            >
              Iniciar Sesión
            </button>

            <button
              type="button"
              onClick={() => {
                setRole(null)
                setStep('role-select')
                setError('')
              }}
              className="w-full text-white/80 hover:text-white text-sm font-medium py-3 transition"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              ← Volver
            </button>
          </div>
        )}

        {step === 'registration' && (
          <div className="border border-white/40 bg-white/15 backdrop-blur-xl w-full" style={{ maxWidth: '440px', padding: '40px 36px', borderRadius: '24px', fontFamily: 'Montserrat, sans-serif', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)' }}>
            <h2 className="font-semibold text-gray-900 text-center mb-8" style={{ fontSize: '18px', fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.2px' }}>Crear Cuenta</h2>

            <form onSubmit={handleRegistration} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-4 py-3.5 rounded-xl bg-white/50 border border-white/60 text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white/60 transition"
                style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '14px' }}
                required
              />

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                className="w-full px-4 py-3.5 rounded-xl bg-white/50 border border-white/60 text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white/60 transition"
                style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '14px' }}
                required
              />

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmar contraseña"
                className="w-full px-4 py-3.5 rounded-xl bg-white/50 border border-white/60 text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white/60 transition"
                style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '14px' }}
                required
              />

              {error && <div className="p-4 rounded-xl bg-red-500/40 border border-red-400/80 text-white text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-3.5 rounded-xl transition disabled:opacity-50 hover:shadow-lg hover:scale-105 disabled:scale-100"
                style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '15px' }}
              >
                {loading ? 'Creando...' : 'Crear Cuenta'}
              </button>

              <button
                type="button"
                onClick={() => setStep('auth-mode')}
                className="w-full text-white/80 hover:text-white text-sm font-medium py-2 transition"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                ← Volver
              </button>
            </form>
          </div>
        )}

        {step === 'login' && (
          <div className="border border-white/40 bg-white/15 backdrop-blur-xl w-full" style={{ maxWidth: '440px', padding: '40px 36px', borderRadius: '24px', fontFamily: 'Montserrat, sans-serif', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)' }}>
            <h2 className="font-semibold text-gray-900 text-center mb-8" style={{ fontSize: '18px', fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.2px' }}>Ingresar</h2>

            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-4 py-3.5 rounded-xl bg-white/50 border border-white/60 text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white/60 transition"
                style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '14px' }}
                required
              />

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                className="w-full px-4 py-3.5 rounded-xl bg-white/50 border border-white/60 text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white/60 transition"
                style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '14px' }}
                required
              />

              {error && <div className="p-4 rounded-xl bg-red-500/40 border border-red-400/80 text-white text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-3.5 rounded-xl transition disabled:opacity-50 hover:shadow-lg hover:scale-105 disabled:scale-100"
                style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '15px' }}
              >
                {loading ? 'Ingresando...' : 'Ingresar'}
              </button>

              <button
                type="button"
                onClick={() => setStep('auth-mode')}
                className="w-full text-white/80 hover:text-white text-sm font-medium py-2 transition"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                ← Volver
              </button>
            </form>
          </div>
        )}

        {step === 'confirmation' && (
          <div className="border border-white/40 bg-white/15 backdrop-blur-xl text-center w-full" style={{ maxWidth: '440px', padding: '40px 36px', borderRadius: '24px', fontFamily: 'Montserrat, sans-serif', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)' }}>
            <div className="text-5xl mb-4">✓</div>
            <p className="text-white font-semibold mb-3 text-base" style={{ fontFamily: 'Montserrat, sans-serif' }}>{successMessage}</p>
            <p className="text-white/80 text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>Te llevaremos al siguiente paso en unos momentos...</p>
          </div>
        )}
      </div>
    </div>
  )
}
