'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function ReferralPage({ params }: { params: { code: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const referralType = searchParams.get('type') || 'guest'

  useEffect(() => {
    if (params.code && ['host', 'guest'].includes(referralType)) {
      localStorage.setItem('agentReferralCode', params.code)
      localStorage.setItem('agentReferralType', referralType)

      setTimeout(() => {
        router.push('/')
      }, 1500)
    } else {
      router.push('/')
    }
  }, [params.code, referralType, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
      <div className="text-center">
        <div className="mb-4">
          <img src="/logo.png" alt="Be Living" className="h-12 w-auto mx-auto" />
        </div>
        <h1 className="text-2xl font-light text-gray-900 dark:text-white mb-2">Bienvenido</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">Te estamos redirigiendo...</p>
        <div className="animate-pulse">
          <div className="h-1 w-24 bg-yellow-400 rounded mx-auto"></div>
        </div>
      </div>
    </div>
  )
}
