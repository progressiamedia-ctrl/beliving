'use client'

import { LogoutButton } from './LogoutButton'

interface HeaderProps {
  title?: string
}

export function Header({ title = 'Be Living' }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-[40px] bg-white/20 border-b border-white/30 shadow-lg">
      <div className="max-w-full px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Be Living"
            className="h-8 w-auto"
          />
        </div>
        <LogoutButton />
      </div>
    </header>
  )
}
