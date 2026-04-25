'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { getBookingsByGuest, cancelBooking, Booking } from '@/lib/booking-utils'
import { properties } from '@/lib/properties-data'

function GuestBookingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
  const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null

  useEffect(() => {
    if (!userId || userRole !== 'guest') {
      router.push('/')
      return
    }

    loadBookings()

    // Show success message if redirected from booking
    if (searchParams.get('success') === 'true') {
      setSuccessMessage('¡Reserva creada exitosamente! Espera la confirmación del anfitrión.')
      setTimeout(() => setSuccessMessage(''), 5000)
    }
  }, [userId, userRole, router, searchParams])

  const loadBookings = async () => {
    try {
      if (!userId) return
      const data = await getBookingsByGuest(userId)
      setBookings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar reservas')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return

    try {
      await cancelBooking(bookingId)
      setBookings(bookings.filter((b) => b.id !== bookingId))
      setSuccessMessage('Reserva cancelada exitosamente')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cancelar reserva')
    }
  }

  const getPropertyTitle = (propertyId: string) => {
    const prop = properties.find((p) => p.id === propertyId)
    return prop?.title || 'Propiedad'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm rounded-full">✓ Confirmada</span>
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-sm rounded-full">⏳ Pendiente</span>
      case 'cancelled':
        return <span className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-full">✗ Cancelada</span>
      default:
        return null
    }
  }

  const isCheckoutPassed = (checkoutDate: string) => {
    const checkout = new Date(checkoutDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return checkout <= today
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Cargando reservas...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header title="Mis Reservas - Be Living" showThemeToggle={true} />

      <div className="border-b border-gray-200 dark:border-gray-800 sticky top-16 z-40 bg-white dark:bg-black">
        <div className="max-w-4xl mx-auto px-6 py-3">
          <Link href="/properties" className="text-black dark:text-white underline text-sm">
            ← Volver
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-light text-black dark:text-white mb-8">Mis Reservas</h1>

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg text-green-700 dark:text-green-400">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-6">No tienes reservas aún</p>
            <Link href="/properties" className="inline-block bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition">
              Explorar propiedades
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 hover:border-black dark:hover:border-white transition"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-black dark:text-white mb-2">
                      {getPropertyTitle(booking.property_id)}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <p>
                        📅 {new Date(booking.check_in).toLocaleDateString('es-ES')} → {new Date(booking.check_out).toLocaleDateString('es-ES')}
                      </p>
                      <p>🌙 {booking.nights} noches</p>
                      <p>💰 ${booking.total_price.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-start md:items-end gap-3">
                    {getStatusBadge(booking.status)}
                    {booking.status === 'pending' && (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition"
                      >
                        Cancelar
                      </button>
                    )}
                    {booking.status === 'confirmed' && isCheckoutPassed(booking.check_out) && (
                      <Link
                        href={`/bookings/${booking.id}/rate`}
                        className="text-sm bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 px-3 py-1 rounded transition"
                      >
                        Calificar
                      </Link>
                    )}
                    {booking.status !== 'cancelled' && (
                      <Link
                        href={`/guest/bookings/${booking.id}`}
                        className="text-sm text-black dark:text-white hover:underline transition"
                      >
                        Ver detalles →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function BookingsLoadingFallback() {
  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
      <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
    </div>
  )
}

export default function GuestBookingsPage() {
  return (
    <Suspense fallback={<BookingsLoadingFallback />}>
      <GuestBookingsContent />
    </Suspense>
  )
}
