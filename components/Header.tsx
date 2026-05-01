'use client'

interface HeaderProps {
  title?: string
}

export function Header({ title = 'Be Living' }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-full px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Be Living"
            className="h-10 w-auto"
          />
        </div>
      </div>
    </header>
  )
}
