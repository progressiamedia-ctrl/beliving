'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function LogoutButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = () => {
    setIsLoading(true)
    localStorage.removeItem('userId')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('agentReferralCode')
    localStorage.removeItem('agentReferralType')
    router.push('/')
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="fixed top-6 right-6 p-2 rounded-lg bg-white/80 hover:bg-white/90 border border-gray-200 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md z-50 disabled:opacity-50 disabled:cursor-not-allowed"
      title="Cerrar sesión"
      aria-label="Cerrar sesión"
    >
      <svg
        className="w-6 h-6 text-gray-700"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        />
      </svg>
    </button>
  )
}
