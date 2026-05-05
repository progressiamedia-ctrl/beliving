'use client';

import { useState, useEffect } from 'react';
import { useProperties } from '@/lib/hooks';
import Link from 'next/link';

interface PropertyGridProps {
  city?: string;
  limit?: number;
}

export function PropertyGrid({ city, limit = 12 }: PropertyGridProps) {
  const { properties, loading, error, fetchProperties } = useProperties();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchProperties(city, limit);

    // Load favorites from localStorage
    const saved = localStorage.getItem('favorites');
    if (saved) {
      setFavorites(new Set(JSON.parse(saved)));
    }
  }, [city, limit, fetchProperties]);

  const toggleFavorite = (propertyId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(propertyId)) {
      newFavorites.delete(propertyId);
    } else {
      newFavorites.add(propertyId);
    }
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(Array.from(newFavorites)));
  };

  if (loading) {
    return <div className="text-center py-12">Cargando propiedades...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-600">Error: {error}</div>;
  }

  if (properties.length === 0) {
    return <div className="text-center py-12 text-gray-500">No hay propiedades disponibles</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map(property => (
        <Link
          key={property.id}
          href={`/properties/${property.id}`}
          className="group"
        >
          <div className="backdrop-blur-[40px] bg-white/20 dark:bg-white/10 rounded-2xl overflow-hidden border border-white/40 hover:shadow-2xl transition-shadow shadow-lg">
            {/* Image */}
            <div className="relative w-full h-48 bg-gray-200 overflow-hidden">
              {property.images && property.images.length > 0 ? (
                <img
                  src={property.images[0]}
                  alt={property.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-500">
                  Sin imagen
                </div>
              )}

              {/* Favorite Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  toggleFavorite(property.id);
                }}
                className="absolute top-3 right-3 backdrop-blur-[20px] bg-white/20 border border-white/40 rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-white/30"
              >
                <span className="text-xl">
                  {favorites.has(property.id) ? '❤️' : '🤍'}
                </span>
              </button>

              {/* Price Badge */}
              <div className="absolute bottom-3 left-3 backdrop-blur-[20px] bg-black/40 text-white px-3 py-1 rounded-full text-sm font-semibold border border-white/30">
                ${property.price}/noche
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-lg line-clamp-2 text-gray-900 dark:text-white group-hover:text-yellow-400">
                  {property.title}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm">{property.city}</p>
              </div>

              {/* Description */}
              <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-2">
                {property.description || 'Sin descripción'}
              </p>

              {/* Details */}
              <div className="flex gap-4 text-sm text-gray-700 dark:text-gray-300">
                <span>🛏️ {property.bedrooms} recámara{property.bedrooms !== 1 ? 's' : ''}</span>
                <span>🚿 {property.bathrooms} baño{property.bathrooms !== 1 ? 's' : ''}</span>
                <span>👥 {property.max_guests} huéspedes</span>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-lg">
                      {i < Math.floor(property.rating) ? '⭐' : '☆'}
                    </span>
                  ))}
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">{property.rating.toFixed(1)}</span>
              </div>

              {/* Amenities */}
              <div className="flex flex-wrap gap-1">
                {property.amenities && property.amenities.slice(0, 3).map((amenity, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 backdrop-blur-[15px] bg-white/20 text-gray-900 dark:text-white text-xs rounded-full border border-white/30"
                  >
                    {amenity}
                  </span>
                ))}
                {property.amenities && property.amenities.length > 3 && (
                  <span className="px-2 py-1 backdrop-blur-[15px] bg-white/20 text-gray-900 dark:text-white text-xs rounded-full border border-white/30">
                    +{property.amenities.length - 3}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
