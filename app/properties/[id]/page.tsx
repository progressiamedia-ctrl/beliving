'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function PropertyDetail() {
  const router = useRouter()
  const params = useParams()
  const [property, setProperty] = useState<any>(null)
  const [host, setHost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)

  useEffect(() => {
    const propertyId = params.id as string
    loadProperty(propertyId)
  }, [params])

  const loadProperty = async (propertyId: string) => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single()

      if (error) throw error

      setProperty(data)

      // Load host info
      const { data: hostData } = await supabase
        .from('users')
        .select('email')
        .eq('id', data.host_id)
        .single()

      setHost(hostData)
    } catch (err) {
      console.error('Error loading property:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleBooking = async () => {
    setBookingLoading(true)
    try {
      const guestId = localStorage.getItem('userId')
      if (!guestId) {
        router.push('/')
        return
      }

      // For now, just show a success message
      alert('¡Solicitud de booking enviada! (Feature en desarrollo)')
    } finally {
      setBookingLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-8">
        <p className="text-gray-600">Cargando...</p>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-white p-8">
        <p className="text-red-600">Propiedad no encontrada</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/properties" className="text-black underline text-sm mb-8 inline-block">
          ← Volver
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información principal */}
          <div className="lg:col-span-2">
            <div className="bg-gray-100 h-96 rounded-lg mb-8 flex items-center justify-center">
              <p className="text-gray-400">Galería de fotos (en desarrollo)</p>
            </div>

            <h1 className="text-4xl font-light text-black mb-2">{property.title}</h1>
            <p className="text-gray-600 text-lg mb-8">{property.location}</p>

            <div className="border-t border-b border-gray-200 py-8 mb-8">
              <h2 className="text-xl font-medium text-black mb-4">Acerca de esta propiedad</h2>
              <p className="text-gray-600 leading-relaxed">{property.description}</p>
            </div>

            {property.amenities?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-medium text-black mb-4">Amenidades</h2>
                <div className="grid grid-cols-2 gap-3">
                  {property.amenities.map((amenity: string) => (
                    <div key={amenity} className="flex items-center text-black">
                      <span className="mr-3">✓</span>
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {host && (
              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-medium text-black mb-2">Host</h2>
                <p className="text-gray-600">{host.email}</p>
              </div>
            )}
          </div>

          {/* Panel de booking */}
          <div>
            <div className="border border-gray-200 rounded-lg p-6 sticky top-8">
              <div className="mb-6">
                <p className="text-gray-600 text-sm mb-2">Precio por noche</p>
                <p className="text-4xl font-light text-black">
                  ${property.price_per_night}
                </p>
              </div>

              <div className="space-y-2 mb-6 pb-6 border-b border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">1 noche × ${property.price_per_night}</span>
                  <span className="text-black">${property.price_per_night}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Fee de servicio (5%)</span>
                  <span className="text-black">${(property.price_per_night * 0.05).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between font-medium mb-6">
                <span>Total</span>
                <span className="text-2xl">
                  ${(property.price_per_night * 1.05).toFixed(2)}
                </span>
              </div>

              <button
                onClick={handleBooking}
                disabled={bookingLoading}
                className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                {bookingLoading ? 'Procesando...' : 'Reservar ahora'}
              </button>

              <p className="text-xs text-gray-600 mt-4 text-center">
                Aún no se cobra hasta confirmar la reserva
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
