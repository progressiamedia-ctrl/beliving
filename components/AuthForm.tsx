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

export function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'host' | 'guest'>('guest')
  const [isSignUp, setIsSignUp] = useState(false)
  const [authMethod, setAuthMethod] = useState<'password' | 'magic-link'>('password')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [magicLinkUrl, setMagicLinkUrl] = useState('')
  const [bgIndex, setBgIndex] = useState(0)
  const router = useRouter()

  // Rotar imagen de fondo cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % CITY_IMAGES.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMessage('')
    setMagicLinkUrl('')

    try {
      if (authMethod === 'magic-link') {
        // Validar email
        if (!email.includes('@')) throw new Error('Email inválido')

        // Generate magic link
        const { generateMagicLink, getMagicLinkURL } = await import('@/lib/magic-link-service')
        const token = await generateMagicLink(email)
        const magicUrl = getMagicLinkURL(token)

        setSuccessMessage(`¡Enlace mágico generado! Haz clic en el enlace de abajo (o cópialo):`)
        setMagicLinkUrl(magicUrl)

        // In production, you would send this via email
        console.log('Magic Link URL:', magicUrl)
      } else {
        // Password-based auth
        if (isSignUp) {
          // Validar email
          if (!email.includes('@')) throw new Error('Email inválido')
          if (password.length < 6) throw new Error('Contraseña debe tener al menos 6 caracteres')

          // Import auth functions
          const { hashPassword } = await import('@/lib/auth')
          const hashedPassword = await hashPassword(password)

          const { data, error } = await supabase
            .from('users')
            .insert([{ email, password: hashedPassword, role }])
            .select()
            .single()

          if (error) throw error
          localStorage.setItem('userId', data.id)
          localStorage.setItem('userRole', data.role)
          localStorage.setItem('userEmail', data.email)
          router.push(`/onboarding/${role}`)
        } else {
          // Import auth functions
          const { signIn } = await import('@/lib/auth')
          const user = await signIn(email, password)

          localStorage.setItem('userId', user.id)
          localStorage.setItem('userRole', user.role)
          localStorage.setItem('userEmail', user.email)
          router.push(user.role === 'host' ? '/host/dashboard' : '/properties')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en autenticación')
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
      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Card glassmorphism */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-4xl font-light text-white mb-2">Be Living</h1>
            <p className="text-white/80 text-sm">Access the global stay network</p>
          </div>

          {/* Auth Method Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('password')
                setError('')
                setSuccessMessage('')
                setMagicLinkUrl('')
              }}
              className={`flex-1 py-2 px-4 text-xs font-semibold rounded-lg transition ${
                authMethod === 'password'
                  ? 'bg-yellow-400 text-black'
                  : 'bg-white/10 border border-white/20 text-white/80 hover:bg-white/20'
              }`}
            >
              Contraseña
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('magic-link')
                setError('')
                setSuccessMessage('')
                setMagicLinkUrl('')
                setIsSignUp(false)
              }}
              className={`flex-1 py-2 px-4 text-xs font-semibold rounded-lg transition ${
                authMethod === 'magic-link'
                  ? 'bg-yellow-400 text-black'
                  : 'bg-white/10 border border-white/20 text-white/80 hover:bg-white/20'
              }`}
            >
              Magic Link
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-2 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                placeholder="tu@email.com"
                required
              />
            </div>

            {/* Contraseña (solo si está usando password auth) */}
            {authMethod === 'password' && (
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-2 uppercase tracking-wide">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                  placeholder="••••••••"
                  required
                />
              </div>
            )}

            {/* Role selector (solo en signup con password) */}
            {authMethod === 'password' && isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-3 uppercase tracking-wide">
                  Tipo de cuenta
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="host"
                      checked={role === 'host'}
                      onChange={(e) => setRole(e.target.value as 'host' | 'guest')}
                      className="mr-2 w-4 h-4"
                    />
                    <span className="text-white/80 text-sm">Host</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="guest"
                      checked={role === 'guest'}
                      onChange={(e) => setRole(e.target.value as 'host' | 'guest')}
                      className="mr-2 w-4 h-4"
                    />
                    <span className="text-white/80 text-sm">Guest</span>
                  </label>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && <p className="text-red-300 text-sm">{error}</p>}

            {/* Success message with magic link */}
            {successMessage && (
              <div className="p-4 bg-green-900/30 border border-green-400/50 rounded-lg">
                <p className="text-green-300 text-sm mb-3">{successMessage}</p>
                {magicLinkUrl && (
                  <div className="space-y-2">
                    <a
                      href={magicLinkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-yellow-400 text-black text-sm font-semibold py-2 rounded text-center hover:bg-yellow-500 transition"
                    >
                      Abre tu enlace
                    </a>
                    <p className="text-white/60 text-xs break-all p-2 bg-white/5 rounded">
                      {magicLinkUrl}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(magicLinkUrl)
                        alert('¡Enlace copiado al portapapeles!')
                      }}
                      className="text-green-300 text-xs hover:text-green-200 transition"
                    >
                      Copiar enlace
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-semibold py-3 rounded-lg transition duration-300 disabled:opacity-50 mt-6"
            >
              {loading ? 'Cargando...' : authMethod === 'magic-link' ? 'Enviar Magic Link' : isSignUp ? 'Registrarse' : 'Entrar'}
            </button>
          </form>

          {/* Toggle signup/login (solo para password auth) */}
          {authMethod === 'password' && (
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full mt-6 text-white/80 text-sm hover:text-white transition"
            >
              {isSignUp ? '¿Ya tienes cuenta? Entrar' : '¿No tienes cuenta? Registrarse'}
            </button>
          )}
        </div>
      </div>

      {/* Indicadores de imágenes */}
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
