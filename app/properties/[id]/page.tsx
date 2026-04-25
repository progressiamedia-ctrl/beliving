'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { properties } from '@/lib/properties-data'

export default function PropertyDetailPage() {
  const params = useParams()
  const propertyId = params.id as string
  const property = properties.find((p) => p.id === propertyId)

  if (!property) {
    return (
      <div className="min-h-screen bg-black">
        <Header title="Propiedad no encontrada" showThemeToggle={false} />
        <div className="max-w-4xl mx-auto px-6 py-12 mt-16">
          <p className="text-white mb-6">La propiedad que buscas no existe.</p>
          <Link href="/properties" className="text-yellow-400 hover:text-yellow-500">
            ← Volver a propiedades
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Header title={property.title} showThemeToggle={false} />

      <div className="max-w-4xl mx-auto px-6 py-12 mt-16">
        {/* Back button */}
        <Link href="/properties" className="text-gray-400 hover:text-white text-sm mb-8 inline-block transition">
          ← Volver a propiedades
        </Link>

        {/* Image */}
        <div className="mb-12 rounded-xl overflow-hidden h-96 bg-gray-900">
          <img
            src={property.images[0] || 'https://via.placeholder.com/800x400?text=No+Image'}
            alt={property.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left - Info */}
          <div className="lg:col-span-2">
            {/* Title and Rating */}
            <div className="mb-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">{property.title}</h1>
                  <p className="text-gray-400 text-lg">{property.location}</p>
                </div>
                {property.verified && (
                  <div className="bg-yellow-400 text-black px-4 py-2 rounded-lg text-sm font-bold">
                    ✓ Verificado
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 text-2xl">★</span>
                  <span className="text-white text-2xl font-bold">{property.rating.toFixed(1)}</span>
                </div>
                <span className="text-gray-400">({Math.floor(Math.random() * 100) + 10} reseñas)</span>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8 pb-8 border-b border-gray-800">
              <h2 className="text-white text-xl font-semibold mb-4">Acerca de este lugar</h2>
              <p className="text-gray-300 leading-relaxed text-lg">{property.description}</p>
            </div>

            {/* Amenities */}
            <div className="mb-8 pb-8 border-b border-gray-800">
              <h2 className="text-white text-xl font-semibold mb-4">Amenidades</h2>
              <div className="grid grid-cols-2 gap-4">
                {property.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-3 text-gray-300">
                    <span className="text-yellow-400">✓</span>
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <h2 className="text-white text-xl font-semibold mb-4">Ubicación</h2>
              <p className="text-gray-300 text-lg mb-2">{property.city}</p>
              <p className="text-gray-400 text-sm">Coordenadas: {property.lat.toFixed(4)}, {property.lng.toFixed(4)}</p>
            </div>
          </div>

          {/* Right - Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 sticky top-32">
              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-white">${property.price}</span>
                  <span className="text-gray-400">/noche</span>
                </div>
                <p className="text-gray-400 text-sm">Incluye impuestos y tasas</p>
              </div>

              {/* Booking Info */}
              <div className="space-y-4 mb-8 pb-8 border-b border-gray-800">
                <div className="flex justify-between text-gray-300 text-sm">
                  <span>Check-in</span>
                  <span className="text-white">Flexible</span>
                </div>
                <div className="flex justify-between text-gray-300 text-sm">
                  <span>Check-out</span>
                  <span className="text-white">Flexible</span>
                </div>
                <div className="flex justify-between text-gray-300 text-sm">
                  <span>Huéspedes</span>
                  <span className="text-white">Hasta 4</span>
                </div>
              </div>

              {/* Reserve Button */}
              <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 rounded-lg transition mb-4">
                Reservar ahora
              </button>

              <button className="w-full border border-gray-700 text-white hover:bg-gray-800 font-semibold py-3 rounded-lg transition">
                Contactar anfitrión
              </button>

              {/* Info */}
              <p className="text-gray-500 text-xs text-center mt-6">
                Responde en menos de una hora
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
