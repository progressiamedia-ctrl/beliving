'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'host' | 'guest'>('guest')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isSignUp) {
        // Sign up - save password as-is for now
        const { data, error } = await supabase
          .from('users')
          .insert([{ email, password, role }])
          .select()
          .single()

        if (error) throw error
        localStorage.setItem('userId', data.id)
        localStorage.setItem('userRole', data.role)
        router.push(data.role === 'host' ? '/host/dashboard' : '/properties')
      } else {
        // Sign in
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single()

        if (error || !data) throw new Error('Usuario no encontrado')

        if (password !== data.password) throw new Error('Contraseña incorrecta')

        localStorage.setItem('userId', data.id)
        localStorage.setItem('userRole', data.role)
        router.push(data.role === 'host' ? '/host/dashboard' : '/properties')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en autenticación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-md p-8">
        <h1 className="text-4xl font-light mb-2 text-black">Be Living</h1>
        <p className="text-gray-600 mb-8">Premium Property Network</p>

        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 bg-white text-black rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 bg-white text-black rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              required
            />
          </div>

          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Tipo de cuenta
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="host"
                    checked={role === 'host'}
                    onChange={(e) => setRole(e.target.value as 'host' | 'guest')}
                    className="mr-2"
                  />
                  Host
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="guest"
                    checked={role === 'guest'}
                    onChange={(e) => setRole(e.target.value as 'host' | 'guest')}
                    className="mr-2"
                  />
                  Guest
                </label>
              </div>
            </div>
          )}

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Cargando...' : isSignUp ? 'Registrarse' : 'Entrar'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full mt-4 text-black underline text-sm"
        >
          {isSignUp ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
        </button>
      </div>
    </div>
  )
}
