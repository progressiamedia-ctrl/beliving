'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

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
      <Input
        label="Comparte tu experiencia"
        as="textarea"
        rows={4}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="¿Qué te pareció? ¿Algo especial que quieras destacar o mejorar?"
        required
      />
      <p className="text-xs text-gray-600 dark:text-gray-400">
        {comment.length}/300 caracteres
      </p>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        variant="regular"
        fullWidth
        isLoading={isLoading}
      >
        {isLoading ? 'Enviando...' : 'Enviar Rating'}
      </Button>
    </form>
  )
}
