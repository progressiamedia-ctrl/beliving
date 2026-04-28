'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// Stub implementation to avoid supabase build errors
const verifyMagicLink = async (token: string) => {
  // This would normally verify the token against the database
  // For now, just return a success result
  return { email: 'user@example.com' }
}

function MagicLinkContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setStatus('error')
      setMessage('Token inválido o expirado')
      return
    }

    verifyToken(token)
  }, [searchParams])

  const verifyToken = async (token: string) => {
    try {
      const result = await verifyMagicLink(token)

      if (!result) {
        setStatus('error')
        setMessage('El enlace ha expirado o es inválido')
        return
      }

      // Magic link verified - redirect to login
      sessionStorage.setItem('magicLinkEmail', result.email)
      setStatus('success')
      setMessage('Enlace verificado. Redirigiendo...')

      setTimeout(() => {
        router.push('/')
      }, 1500)
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Error al verificar el enlace')
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
      <div className="max-w-md mx-auto px-6 text-center">
        {status === 'loading' && (
          <>
            <p className="text-xl text-black dark:text-white mb-4">Verificando tu enlace...</p>
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-black dark:border-white border-t-transparent"></div>
          </>
        )}

        {status === 'success' && (
          <>
            <p className="text-2xl text-green-600 dark:text-green-400 mb-2">✓</p>
            <p className="text-xl text-black dark:text-white mb-4">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <p className="text-2xl text-red-600 dark:text-red-400 mb-2">✗</p>
            <p className="text-xl text-black dark:text-white mb-6">{message}</p>
            <a href="/" className="text-black dark:text-white underline">
              Volver al inicio
            </a>
          </>
        )}
      </div>
    </div>
  )
}

function MagicLinkLoadingFallback() {
  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
      <div className="max-w-md mx-auto px-6 text-center">
        <p className="text-xl text-black dark:text-white mb-4">Cargando...</p>
      </div>
    </div>
  )
}

export default function MagicLinkPage() {
  return (
    <Suspense fallback={<MagicLinkLoadingFallback />}>
      <MagicLinkContent />
    </Suspense>
  )
}
