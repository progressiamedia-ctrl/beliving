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
      <div className="relative mb-4 overflow-hidden rounded-2xl aspect-square bg-gray-100 shadow-md hover:shadow-xl transition-all duration-300 ease-out">
        <img
          src={property.images[0] || 'https://via.placeholder.com/300x300?text=Property'}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://via.placeholder.com/300x300?text=Property'
          }}
        />

        {property.verified && (
          <div className="absolute top-3 left-3 bg-white text-gray-900 px-3 py-1 rounded-full text-xs font-bold shadow-md border border-gray-200">
            ✓ Verificado
          </div>
        )}

        <button
          onClick={(e) => onToggleFavorite(property.id, e)}
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          aria-pressed={isFavorite}
          className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg border border-gray-200"
        >
          <svg
            className={`w-6 h-6 transition ${
              isFavorite
                ? 'text-red-500 fill-current'
                : 'text-gray-400'
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

      <div className="flex flex-col h-full transition-all duration-300 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-yellow-500 transition-colors duration-300 line-clamp-2 text-sm">
            {property.title}
          </h3>

          <p className="text-xs text-gray-500 mb-3 group-hover:text-gray-600 transition-colors duration-300">
            {property.city}, {property.location}
          </p>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1 mt-2">
              <span className="text-yellow-400 text-lg" aria-hidden="true">★</span>
              <span className="text-xs font-semibold text-gray-900">
                {property.rating.toFixed(1)}
              </span>
            </div>
            <span className="text-base font-bold text-gray-900">
              ${property.price}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}