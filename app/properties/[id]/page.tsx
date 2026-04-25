'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { BookingCalendar, BookingData } from '@/components/BookingCalendar'
import { RatingsList } from '@/components/RatingsList'
import { properties } from '@/lib/properties-data'
import { getPropertyBookedDates, createBooking } from '@/lib/booking-utils'
import { getPropertyRatings, getRatingStats } from '@/lib/rating-utils'

export default function PropertyDetail() {
  const params = useParams()
  const router = useRouter()
  const property = properties.find((p) => p.id === params.id)
  const [bookedDates, setBookedDates] = useState<string[]>([])
  const [ratings, setRatings] = useState<any[]>([])
  const [ratingStats, setRatingStats] = useState({ average: 0, count: 0, distribution: {} })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
  const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null

  useEffect(() => {
    if (property) {
      loadBookedDates()
      loadRatings()
    }
  }, [property?.id])

  const loadBookedDates = async () => {
    try {
      if (!property) return
      const dates = await getPropertyBookedDates(property.id)
      setBookedDates(dates)
    } catch (err) {
      console.error('Error loading booked dates:', err)
    }
  }

  const loadRatings = async () => {
    try {
      if (!property) return
      const ratings = await getPropertyRatings(property.id)
      const stats = await getRatingStats(property.id)
      setRatings(ratings)
      setRatingStats(stats)
    } catch (err) {
      console.error('Error loading ratings:', err)
    }
  }

  const handleBookingConfirm = async (bookingData: BookingData) => {
    if (!userId || userRole !== 'guest') {
      router.push('/')
      return
    }

    setLoading(true)
    setError('')

    try {
      if (!property) throw new Error('Propiedad no encontrada')

      const guestName = localStorage.getItem('userName') || 'Guest'
      const guestEmail = localStorage.getItem('userEmail') || ''

      // Get host_id from property (we'll use a hardcoded value for now since properties-data doesn't include it)
      // In a real app, properties would have host_id
      const hostId = 'host-' + property.id

      await createBooking({
        propertyId: property.id,
        guestId: userId,
        hostId,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        nights: bookingData.nights,
        totalPrice: bookingData.totalPrice,
        guestName,
        guestEmail,
      })

      // Reload booked dates
      await loadBookedDates()

      // Show success message and redirect to bookings page
      router.push(`/guest/bookings?success=true`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la reserva')
    } finally {
      setLoading(false)
    }
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Propiedad no encontrada</p>
          <Link href="/properties" className="text-black dark:text-white underline">
            Volver a propiedades
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header title="Be Living" showThemeToggle={true} />
      <div className="border-b border-gray-200 dark:border-gray-800 sticky top-16 z-50 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <Link href="/properties" className="text-black dark:text-white underline text-sm">
            ← Volver
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Galería */}
          <div className="lg:col-span-2">
            <div className="bg-gray-100 dark:bg-gray-800 h-96 rounded-lg overflow-hidden mb-8">
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
                    <h1 className="text-3xl font-light text-black dark:text-white mb-2">{property.title}</h1>
                    <p className="text-gray-600 dark:text-gray-400">{property.location}</p>
                  </div>
                  {property.verified && (
                    <div className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full text-sm font-medium">
                      ✓ Verified
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg text-black dark:text-white">★ {property.rating}</span>
                  <span className="text-gray-600 dark:text-gray-400">({Math.floor(Math.random() * 200 + 50)} reviews)</span>
                </div>
              </div>

              {/* Descripción */}
              <div className="border-t border-b border-gray-200 dark:border-gray-800 py-8">
                <h2 className="text-lg font-medium text-black dark:text-white mb-4">Acerca de esta propiedad</h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{property.description}</p>
              </div>

              {/* Amenidades */}
              {property.amenities.length > 0 && (
                <div>
                  <h2 className="text-lg font-medium text-black dark:text-white mb-4">Amenidades</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {property.amenities.map((amenity) => (
                      <div key={amenity} className="flex items-center text-black dark:text-white">
                        <span className="mr-3 text-lg">✓</span>
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ratings */}
              {ratingStats.count > 0 && (
                <div className="border-t border-b border-gray-200 dark:border-gray-800 py-8">
                  <h2 className="text-lg font-medium text-black dark:text-white mb-6">Calificaciones de huéspedes</h2>
                  <RatingsList
                    ratings={ratings}
                    averageRating={ratingStats.average}
                    totalCount={ratingStats.count}
                  />
                </div>
              )}

              {/* Ubicación */}
              <div>
                <h2 className="text-lg font-medium text-black dark:text-white mb-4">Ubicación</h2>
                <div className="bg-gray-100 dark:bg-gray-800 h-64 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400">
                  📍 {property.city} · {property.location}
                </div>
              </div>
            </div>
          </div>

          {/* Panel de Booking */}
          <div>
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 sticky top-24 bg-white dark:bg-gray-950">
              <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Precio por noche</p>
                <p className="text-4xl font-light text-black dark:text-white">${property.price}</p>
              </div>

              {userRole === 'guest' ? (
                <>
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-400">
                      {error}
                    </div>
                  )}
                  <BookingCalendar
                    propertyId={property.id}
                    nightlyPrice={property.price}
                    bookedDates={bookedDates}
                    onConfirmBooking={handleBookingConfirm}
                    isLoading={loading}
                  />
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {userRole === 'host' ? 'Como anfitrión, no puedes reservar tus propias propiedades' : 'Inicia sesión como huésped para reservar'}
                  </p>
                  {!userId && (
                    <Link
                      href="/"
                      className="block text-center bg-black dark:bg-white text-white dark:text-black py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition"
                    >
                      Iniciar sesión
                    </Link>
                  )}
                </div>
              )}

              <p className="text-xs text-gray-600 dark:text-gray-400 mt-4 text-center">
                No se cobra hasta confirmar la reserva
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
