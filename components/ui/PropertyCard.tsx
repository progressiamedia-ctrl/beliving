'use client'

import Link from 'next/link'
import { Property } from '@/lib/properties-data'

interface PropertyCardProps {
  property: Property
  isFavorite: boolean
  onToggleFavorite: (id: string, e: React.MouseEvent) => void
  onMouseEnter?: (id: string) => void
  onMouseLeave?: () => void
}

export function PropertyCard({
  property,
  isFavorite,
  onToggleFavorite,
  onMouseEnter,
  onMouseLeave,
}: PropertyCardProps) {
  return (
    <Link
      href={`/properties/${property.id}`}
      className="group cursor-pointer"
      aria-label={`Ver ${property.title}`}
      onMouseEnter={() => onMouseEnter?.(property.id)}
      onMouseLeave={onMouseLeave}
    >
      <div className="relative mb-4 overflow-hidden rounded-3xl aspect-square bg-gray-200 dark:bg-gray-900 shadow-2xl hover:shadow-3xl transition-all duration-300 ease-out">
        <img
          src={property.images[0] || 'https://via.placeholder.com/300x300?text=Property'}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://via.placeholder.com/300x300?text=Property'
          }}
        />

        {property.verified && (
          <div className="absolute top-4 left-4 backdrop-blur-[20px] bg-white/20 border border-white/40 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            ✓ Verificado
          </div>
        )}

        <button
          onClick={(e) => onToggleFavorite(property.id, e)}
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          aria-pressed={isFavorite}
          className="absolute top-4 right-4 w-10 h-10 rounded-full backdrop-blur-[30px] bg-white/20 border border-white/40 flex items-center justify-center hover:scale-125 hover:bg-white/30 active:scale-110 transition-all duration-200 shadow-lg"
        >
          <svg
            className={`w-6 h-6 transition ${
              isFavorite
                ? 'text-red-500 fill-current'
                : 'text-gray-600 dark:text-gray-400'
            }`}
            fill={isFavorite ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>
      </div>

      <div className="flex flex-col h-full transition-all duration-300 backdrop-blur-[40px] bg-white/15 border border-white/30 rounded-2xl p-3 shadow-lg">
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-yellow-400 transition-colors duration-300 line-clamp-1">
            {property.title}
          </h3>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">
            {property.city}, {property.location}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-yellow-400" aria-hidden="true">★</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {property.rating.toFixed(1)}
              </span>
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              ${property.price}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}