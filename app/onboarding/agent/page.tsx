'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function AgentOnboarding() {
  const router = useRouter()

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      router.push('/')
      return
    }

    // Simulate onboarding completion and redirect to agent dashboard
    const timer = setTimeout(() => {
      router.push('/agent')
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 animate-pulse">
            <span className="text-3xl">💰</span>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">¡Bienvenido Agente!</h1>
        <p className="text-lg text-gray-600 mb-4">Configurando tu cuenta profesional...</p>
        <div className="inline-block">
          <div className="w-8 h-8 border-4 border-green-200 border-t-green-500 rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  )
}
