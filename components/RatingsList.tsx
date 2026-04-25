'use client'

import { Rating } from '@/lib/rating-utils'

interface RatingsListProps {
  ratings: Rating[]
  averageRating: number
  totalCount: number
}

export function RatingsList({ ratings, averageRating, totalCount }: RatingsListProps) {
  const getInitials = (email: string) => {
    return email
      .split('@')[0]
      .split('.')
      .map((part) => part[0].toUpperCase())
      .join('')
  }

  return (
    <div className="space-y-6">
      {/* Average Rating */}
      <div className="flex items-start gap-4">
        <div className="text-center">
          <p className="text-4xl font-light text-black dark:text-white">{averageRating.toFixed(1)}</p>
          <div className="flex gap-1 justify-center mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={star <= Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-700'}
              >
                ★
              </span>
            ))}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {totalCount} {totalCount === 1 ? 'calificación' : 'calificaciones'}
          </p>
        </div>

        {/* Distribution */}
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratings.filter((r) => r.rating === star).length
            const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0

            return (
              <div key={star} className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400 w-4">{star}★</span>
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400 w-6 text-right">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Ratings */}
      {ratings.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
          <h3 className="text-lg font-medium text-black dark:text-white mb-4">Reseñas</h3>
          <div className="space-y-4">
            {ratings.slice(0, 5).map((rating) => (
              <div
                key={rating.id}
                className="border border-gray-200 dark:border-gray-800 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-xs font-semibold text-white">
                      {getInitials(rating.guest_id)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-black dark:text-white">Huésped</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {new Date(rating.created_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={
                          star <= rating.rating ? 'text-yellow-400 text-sm' : 'text-gray-300 dark:text-gray-700 text-sm'
                        }
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{rating.comment}</p>
              </div>
            ))}
          </div>

          {ratings.length > 5 && (
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
              y {ratings.length - 5} más...
            </p>
          )}
        </div>
      )}
    </div>
  )
}
