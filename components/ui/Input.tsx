'use client'

import React, { useId } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  as?: 'input' | 'textarea'
  rows?: number
}

export const Input = React.forwardRef<HTMLInputElement & HTMLTextAreaElement, InputProps>(
  (
    {
      label,
      error,
      as = 'input',
      rows = 4,
      className = '',
      type = 'text',
      required = false,
      ...props
    },
    ref,
  ) => {
    const inputId = useId()
    const errorId = useId()

    const baseClasses = 'w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition'
    const borderClasses = error
      ? 'border-red-500 dark:border-red-400 focus:ring-red-400'
      : 'border-gray-300 dark:border-gray-700 focus:ring-yellow-400'

    const allClasses = `${baseClasses} ${borderClasses} ${className}`.trim()

    return (
      <div className="flex flex-col">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
            {label}
            {required && <span className="text-red-500" aria-hidden="true">*</span>}
          </label>
        )}
        {as === 'textarea' ? (
          <textarea
            ref={ref as any}
            id={inputId}
            className={allClasses}
            rows={rows}
            required={required}
            aria-required={required}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={allClasses}
            required={required}
            aria-required={required}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
          />
        )}
        {error && (
          <p id={errorId} role="alert" className="mt-1 text-sm text-red-500 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'