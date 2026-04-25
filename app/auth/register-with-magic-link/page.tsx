'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/Header'

export default function RegisterWithMagicLinkPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'host' | 'guest'>('guest')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const pendingEmail = sessionStorage.getItem('pendingMagicLinkEmail')
    if (!pendingEmail) {
      router.push('/')
      return
    }
    setEmail(pendingEmail)
  }, [router])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (existingUser) {
        // User already exists, just log them in
        localStorage.setItem('userId', existingUser.id)
        localStorage.setItem('userRole', existingUser.role)
        localStorage.setItem('userEmail', existingUser.email)
        sessionStorage.removeItem('pendingMagicLinkEmail')
        router.push(existingUser.role === 'host' ? '/host/dashboard' : '/properties')
        return
      }

      // Create new user without password (magic link only)
      const { data, error: insertError } = await supabase
        .from('users')
        .insert([
          {
            email,
            role,
            password: null, // No password for magic link users
          },
        ])
        .select()
        .single()

      if (insertError) throw insertError

      localStorage.setItem('userId', data.id)
      localStorage.setItem('userRole', data.role)
      localStorage.setItem('userEmail', data.email)
      sessionStorage.removeItem('pendingMagicLinkEmail')

      setSuccess(true)
      setTimeout(() => {
        router.push(role === 'host' ? '/onboarding/host' : '/onboarding/guest')
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header title="Completar Registro - Be Living" showThemeToggle={true} />

      <div className="max-w-md mx-auto px-6 py-12 mt-16">
        <h1 className="text-3xl font-light text-black dark:text-white mb-2">Completa tu registro</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Selecciona el tipo de cuenta para continuar</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg text-green-700 dark:text-green-400 text-sm">
            ¡Registro exitoso! Redirigiendo...
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Verificado con Magic Link</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Tipo de cuenta
            </label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer flex-1">
                <input
                  type="radio"
                  value="host"
                  checked={role === 'host'}
                  onChange={(e) => setRole(e.target.value as 'host' | 'guest')}
                  className="mr-3 w-4 h-4"
                />
                <div>
                  <span className="text-black dark:text-white font-medium">Anfitrión</span>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Alquila tus propiedades</p>
                </div>
              </label>
              <label className="flex items-center cursor-pointer flex-1">
                <input
                  type="radio"
                  value="guest"
                  checked={role === 'guest'}
                  onChange={(e) => setRole(e.target.value as 'host' | 'guest')}
                  className="mr-3 w-4 h-4"
                />
                <div>
                  <span className="text-black dark:text-white font-medium">Huésped</span>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Busca estadías</p>
                </div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black dark:bg-white text-white dark:text-black py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition disabled:opacity-50"
          >
            {loading ? 'Procesando...' : 'Continuar'}
          </button>
        </form>

        <p className="text-xs text-gray-600 dark:text-gray-400 text-center mt-6">
          Al continuar, aceptas nuestros términos de servicio
        </p>
      </div>
    </div>
  )
}
