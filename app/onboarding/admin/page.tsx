'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function AdminOnboarding() {
  const router = useRouter()

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      router.push('/')
      return
    }

    // Simulate onboarding completion and redirect to admin dashboard
    const timer = setTimeout(() => {
      router.push('/admin')
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
      <div className="text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-pink-600 animate-pulse">
            <span className="text-3xl">👨‍💼</span>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">¡Bienvenido Administrador!</h1>
        <p className="text-lg text-gray-600 mb-4">Inicializando panel de control...</p>
        <div className="inline-block">
          <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  )
}
