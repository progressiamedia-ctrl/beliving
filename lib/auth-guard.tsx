'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: 'host' | 'guest'
  redirectTo?: string
}

export function AuthGuard({ children, requiredRole, redirectTo = '/' }: AuthGuardProps) {
  const router = useRouter()

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    const userRole = localStorage.getItem('userRole') as 'host' | 'guest' | null

    // Check if user is authenticated
    if (!userId) {
      router.push(redirectTo)
      return
    }

    // Check if user has required role
    if (requiredRole && userRole !== requiredRole) {
      router.push(redirectTo)
    }
  }, [requiredRole, redirectTo, router])

  return <>{children}</>
}
