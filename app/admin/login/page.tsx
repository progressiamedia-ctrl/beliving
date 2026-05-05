'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const CITY_IMAGES = [
  'https://images.unsplash.com/photo-1512453575128-d2f4b0e961c3?w=1920&h=1080&fit=crop&q=85',
  'https://images.unsplash.com/photo-1562883714-47a98a3c3872?w=1920&h=1080&fit=crop&q=85',
  'https://images.unsplash.com/photo-1543936552-5150209c26d6?w=1920&h=1080&fit=crop&q=85',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&q=85',
  'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&h=1080&fit=crop&q=85',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&h=1080&fit=crop&q=85',
]

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * CITY_IMAGES.length)
    setCurrentImageIndex(randomIndex)
  }, [mounted])

  useEffect(() => {
    const imageInterval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % CITY_IMAGES.length)
    }, 4000)
    return () => clearInterval(imageInterval)
  }, [])

  const validateEmail = (emailStr: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(emailStr)
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
        body: JSON.stringify({ email, password })
      })

      const user = await response.json()

      if (!response.ok) {
        throw new Error(user.error || 'Error al ingresar')
      }

      // Verificar que es admin
      if (user.user_type !== 'admin') {
        throw new Error('Acceso denegado. Solo administradores pueden acceder aquí.')
      }

      localStorage.setItem('userId', user.id)
      localStorage.setItem('userRole', user.user_type)
      localStorage.setItem('userEmail', user.email)

      router.push('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al ingresar')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white">
        <p className="text-gray-600">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Fondo con imagen */}
      <div
        className="absolute inset-0 transition-all duration-1000 ease-in-out"
        style={{
          backgroundImage: `url(${CITY_IMAGES[currentImageIndex]})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/35 via-black/30 to-black/40"></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-6 flex items-center justify-center">
        <div className="w-full backdrop-blur-[40px] rounded-3xl p-8 shadow-2xl border transition-all duration-300 bg-gradient-to-br from-white/25 to-white/15 border-white/40 backdrop-saturate-150 hover:border-white/50">
          {/* Logo y encabezado */}
          <div className="mb-10 text-center">
            <img
              src="/logo.png"
              alt="Be Living"
              className="h-16 w-auto mx-auto mb-4"
            />
            <p className="text-sm font-medium text-gray-600">Panel de Administración</p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-xs font-semibold text-red-700">Acceso Restringido</span>
            </div>
          </div>

          {/* Formulario de login */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="admin-email" className="block text-sm font-semibold mb-2 text-gray-900">
                Correo electrónico
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                placeholder="admin@beliving.com"
                required
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-semibold mb-2 text-gray-900">
                Contraseña
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                placeholder="Tu contraseña"
                required
              />
            </div>

            {error && (
              <div role="alert" className="p-3 border rounded-xl text-sm bg-red-50 border-red-300 text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 disabled:from-red-400/50 disabled:to-pink-500/50 text-white font-bold py-3 rounded-xl transition duration-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Ingresando...' : 'Acceder al Panel'}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-xs font-medium bg-white text-gray-600">¿Necesitas ayuda?</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push('/')}
              className="w-full text-sm transition font-medium text-gray-600 hover:text-gray-900 py-2"
            >
              ← Volver al login principal
            </button>
          </form>

          {/* Aviso de seguridad */}
          <div className="mt-8 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-xs text-amber-800">
              <span className="font-semibold">⚠️ Aviso de Seguridad:</span> Esta es una área restringida. Los intentos de acceso no autorizado serán registrados.
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}
