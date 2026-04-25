'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { supabase } from '@/lib/supabase'
import { hashPassword, verifyPassword } from '@/lib/auth'

interface User {
  id: string
  email: string
  role: 'host' | 'guest'
  created_at: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    const userRole = localStorage.getItem('userRole')

    if (!userId || !userRole) {
      router.push('/')
      return
    }

    loadUser(userId)
  }, [router])

  const loadUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, role, created_at')
        .eq('id', userId)
        .single()

      if (error) throw error
      setUser(data)
    } catch (err) {
      console.error('Error loading user:', err)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    try {
      if (!user) throw new Error('Usuario no encontrado')

      // Verify current password
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('password')
        .eq('id', user.id)
        .single()

      if (fetchError || !userData) throw new Error('Error al cargar usuario')

      const isValid = await verifyPassword(currentPassword, userData.password)
      if (!isValid) throw new Error('Contraseña actual incorrecta')

      // Hash new password
      const hashedPassword = await hashPassword(newPassword)

      // Update password
      const { error: updateError } = await supabase
        .from('users')
        .update({ password: hashedPassword })
        .eq('id', user.id)

      if (updateError) throw updateError

      setMessage('✓ Contraseña actualizada correctamente')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar contraseña')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('userId')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userEmail')
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header title="Perfil - Be Living" showThemeToggle={true} />

      <div className="sticky top-16 z-40 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 px-6 py-2">
        <button
          onClick={handleLogout}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition"
        >
          Salir
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-light text-black dark:text-white mb-8">Mi Perfil</h1>

        {/* User Info */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-8 mb-8 bg-white dark:bg-gray-950">
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Email</p>
            <p className="text-lg text-black dark:text-white">{user?.email}</p>
          </div>

          <div className="mb-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Tipo de Cuenta</p>
            <p className="text-lg text-black dark:text-white capitalize">
              {user?.role === 'host' ? 'Anfitrión' : 'Huésped'}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Miembro desde</p>
            <p className="text-lg text-black dark:text-white">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('es-ES') : '-'}
            </p>
          </div>
        </div>

        {/* Change Password */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-8 bg-white dark:bg-gray-950">
          <h2 className="text-2xl font-light text-black dark:text-white mb-6">Cambiar Contraseña</h2>

          {message && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg text-green-700 dark:text-green-400">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contraseña Actual
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nueva Contraseña
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirmar Contraseña
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition"
            >
              Actualizar Contraseña
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
