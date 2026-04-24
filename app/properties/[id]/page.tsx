'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { properties } from '@/lib/properties-data'

export default function PropertyDetail() {
  const params = useParams()
  const router = useRouter()
  const property = properties.find((p) => p.id === params.id)

  if (!property) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Propiedad no encontrada</p>
          <Link href="/properties" className="text-black underline">
            Volver a propiedades
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 sticky top-0 z-50 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/properties" className="text-black underline text-sm">
            ← Volver
          </Link>
          <h1 className="text-lg font-light text-black">Be Living</h1>
          <div className="w-8" />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Galería */}
          <div className="lg:col-span-2">
            <div className="bg-gray-100 h-96 rounded-lg overflow-hidden mb-8">
              <img
                src={property.images[0]}
                alt={property.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Información */}
            <div className="space-y-8">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-light text-black mb-2">{property.title}</h1>
                    <p className="text-gray-600">{property.location}</p>
                  </div>
                  {property.verified && (
                    <div className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium">
                      ✓ Verified
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg">★ {property.rating}</span>
                  <span className="text-gray-600">({Math.floor(Math.random() * 200 + 50)} reviews)</span>
                </div>
              </div>

              {/* Descripción */}
              <div className="border-t border-b border-gray-200 py-8">
                <h2 className="text-lg font-medium text-black mb-4">Acerca de esta propiedad</h2>
                <p className="text-gray-600 leading-relaxed">{property.description}</p>
              </div>

              {/* Amenidades */}
              {property.amenities.length > 0 && (
                <div>
                  <h2 className="text-lg font-medium text-black mb-4">Amenidades</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {property.amenities.map((amenity) => (
                      <div key={amenity} className="flex items-center text-black">
                        <span className="mr-3 text-lg">✓</span>
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ubicación */}
              <div>
                <h2 className="text-lg font-medium text-black mb-4">Ubicación</h2>
                <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center text-gray-600">
                  📍 {property.city} · {property.location}
                </div>
              </div>
            </div>
          </div>

          {/* Panel de Booking */}
          <div>
            <div className="border border-gray-200 rounded-lg p-6 sticky top-24">
              <div className="mb-6">
                <p className="text-gray-600 text-sm mb-2">Precio por noche</p>
                <p className="text-4xl font-light text-black">${property.price}</p>
              </div>

              {/* Detalles */}
              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">1 noche × ${property.price}</span>
                  <span className="text-black">${property.price}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Fee de servicio (5%)</span>
                  <span className="text-black">${(property.price * 0.05).toFixed(2)}</span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between font-medium mb-6">
                <span>Total</span>
                <span className="text-2xl">${(property.price * 1.05).toFixed(2)}</span>
              </div>

              {/* Booking Button */}
              <button
                onClick={() => alert('✓ Solicitud de reserva enviada!')}
                className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition mb-3"
              >
                Reservar ahora
              </button>

              <button
                onClick={() => alert('♥ Agregado a favoritos')}
                className="w-full border-2 border-black text-black py-3 rounded-lg font-medium hover:bg-black hover:text-white transition"
              >
                Guardar
              </button>

              <p className="text-xs text-gray-600 mt-4 text-center">
                No se cobra hasta confirmar la reserva
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
