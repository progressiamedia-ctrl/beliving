'use client'

import { LogoutButton } from './LogoutButton'

interface HeaderProps {
  title?: string
}

export function Header({ title = 'Be Living' }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-full px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Be Living"
            className="h-10 w-auto"
          />
        </div>
        <LogoutButton />
      </div>
    </header>
  )
}
