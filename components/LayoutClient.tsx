'use client'

import { useState, useEffect } from 'react'
import { LogoutButton } from './LogoutButton'

export function LayoutClient({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const userId = localStorage.getItem('userId')
    setIsLoggedIn(!!userId)
  }, [])

  if (!mounted) return <>{children}</>

  return (
    <>
      {isLoggedIn && <LogoutButton />}
      {children}
    </>
  )
}
