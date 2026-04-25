'use client'

import { useState } from 'react'

interface RatingFormProps {
  onSubmit: (rating: number, comment: string) => Promise<void>
  isLoading?: boolean
  propertyTitle: string
}

export function RatingForm({ onSubmit, isLoading, propertyTitle }: RatingFormProps) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (rating < 1 || rating > 5) {
      setError('Selecciona una calificación entre 1 y 5')
      return
    }

    if (comment.trim().length < 10) {
      setError('El comentario debe tener al menos 10 caracteres')
      return
    }

    try {
      await onSubmit(rating, comment)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar rating')
    }
  }

  const getRatingLabel = (value: number) => {
    switch (value) {
      case 1:
        return 'Muy malo'
      case 2:
        return 'Malo'
      case 3:
        return 'Regular'
      case 4:
        return 'Bueno'
      case 5:
        return 'Excelente'
      default:
        return ''
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-light text-black dark:text-white mb-2">¿Cómo fue tu estadía?</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">en {propertyTitle}</p>
      </div>

      {/* Star Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          Calificación
        </label>
        <div className="flex gap-3 items-center">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`text-4xl transition transform hover:scale-110 ${
                  star <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-700'
                }`}
              >
                ★
              </button>
            ))}
          </div>
          <span className="text-lg font-medium text-black dark:text-white ml-4">
            {getRatingLabel(rating)}
          </span>
        </div>
      </div>

      {/* Comment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Comparte tu experiencia
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="¿Qué te pareció? ¿Algo especial que quieras destacar o mejorar?"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          rows={4}
          required
        />
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
          {comment.length}/300 caracteres
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-black dark:bg-white text-white dark:text-black py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition disabled:opacity-50"
        >
          {isLoading ? 'Enviando...' : 'Enviar Rating'}
        </button>
      </div>
    </form>
  )
}
