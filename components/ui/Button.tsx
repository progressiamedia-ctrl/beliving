'use client'

import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'premium' | 'regular' | 'ghost' | 'text' | 'glass'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  isLoading?: boolean
}

const variantClasses = {
  premium: 'bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 text-black dark:bg-yellow-400 dark:hover:bg-yellow-500 dark:active:bg-yellow-600 dark:text-black shadow-md hover:shadow-lg',
  regular: 'bg-black hover:bg-gray-800 active:bg-gray-900 text-white dark:bg-white dark:hover:bg-gray-100 dark:active:bg-gray-200 dark:text-black shadow-md hover:shadow-lg',
  ghost: 'border-2 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 active:bg-gray-100 dark:active:bg-gray-800 text-black dark:text-white hover:border-gray-400 dark:hover:border-gray-600',
  text: 'text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white underline hover:no-underline active:underline',
  glass: 'backdrop-blur-[30px] bg-white/20 border border-white/40 text-black dark:text-white hover:bg-white/30 active:bg-white/25 shadow-lg',
}

const sizeClasses = {
  sm: 'py-2 px-3 text-sm',
  md: 'py-3 px-4 text-sm',
  lg: 'py-3 px-6 text-base',
}

const focusClasses = {
  premium: 'focus:ring-yellow-500 dark:focus:ring-yellow-400',
  regular: 'focus:ring-gray-800 dark:focus:ring-gray-200',
  ghost: 'focus:ring-gray-300 dark:focus:ring-gray-700',
  text: 'focus:ring-gray-500',
  glass: 'focus:ring-yellow-400 dark:focus:ring-yellow-400',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'regular',
      size = 'md',
      fullWidth = false,
      isLoading = false,
      className = '',
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseClasses = 'font-semibold transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed'
    const widthClass = fullWidth ? 'w-full' : ''
    const sizeClass = sizeClasses[size]
    const variantClass = variantClasses[variant]
    const focusClass = focusClasses[variant]

    const allClasses = `${baseClasses} ${widthClass} ${sizeClass} ${variantClass} ${focusClass} ${className}`.trim()

    return (
      <button
        ref={ref}
        className={allClasses}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? '...' : children}
      </button>
    )
  },
)

Button.displayName = 'Button'