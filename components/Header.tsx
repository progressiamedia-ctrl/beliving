'use client'

import { useState, useEffect } from 'react'

interface HeaderProps {
  showThemeToggle?: boolean
  title?: string
}

function ThemeToggleButton() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    // Get initial theme from DOM
    const isDark = document.documentElement.classList.contains('dark')
    setTheme(isDark ? 'dark' : 'light')
  }, [])

  const handleToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    // Dispatch event for context to listen to
    window.dispatchEvent(new CustomEvent('theme-toggle', { detail: { theme: newTheme } }))
  }

  if (!isMounted) {
    return (
      <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-900" />
    )
  }

  return (
    <button
      onClick={handleToggle}
      className="relative w-14 h-7 rounded-full transition-all duration-300 border-2 flex items-center px-1"
      style={{
        backgroundColor: theme === 'light' ? '#fef3c7' : '#1f2937',
        borderColor: theme === 'light' ? '#fbbf24' : '#374151'
      }}
      aria-label="Toggle theme"
      title={theme === 'light' ? 'Dark mode' : 'Light mode'}
    >
      <div
        className="absolute w-5 h-5 rounded-full transition-all duration-300 flex items-center justify-center"
        style={{
          left: theme === 'light' ? '3px' : '27px',
          backgroundColor: theme === 'light' ? 'white' : '#1f2937'
        }}
      >
        {theme === 'light' ? (
          <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.536l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.121-10.607a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.464 7.464a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        )}
      </div>
    </button>
  )
}

export function Header({ showThemeToggle = true, title = 'Be Living' }: HeaderProps) {

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-full px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Be Living"
            className="h-10 w-auto"
          />
        </div>
        {showThemeToggle && <ThemeToggleButton />}
      </div>
    </header>
  )
}
