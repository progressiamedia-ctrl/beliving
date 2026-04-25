'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { getBookingsByHost, confirmBooking, cancelBooking, Booking } from '@/lib/booking-utils'
import { properties } from '@/lib/properties-data'

export default function HostBookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all')
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
  const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null

  useEffect(() => {
    if (!userId || userRole !== 'host') {
      router.push('/')
      return
    }

    loadBookings()
  }, [userId, userRole, router])

  const loadBookings = async () => {
    try {
      if (!userId) return
      // For demo, we'll show all bookings. In real app, filter by host_id
      const data = await getBookingsByHost(userId)
      setBookings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar reservas')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      await confirmBooking(bookingId)
      setBookings(bookings.map((b) => (b.id === bookingId ? { ...b, status: 'confirmed' } : b)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al confirmar reserva')
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('¿Estás seguro de que deseas rechazar esta reserva?')) return

    try {
      await cancelBooking(bookingId)
      setBookings(bookings.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al rechazar reserva')
    }
  }

  const getPropertyTitle = (propertyId: string) => {
    const prop = properties.find((p) => p.id === propertyId)
    return prop?.title || 'Propiedad'
  }

  const filteredBookings = bookings.filter((b) => filterStatus === 'all' || b.status === filterStatus)

  const stats = {
    pending: bookings.filter((b) => b.status === 'pending').length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    totalRevenue: bookings
      .filter((b) => b.status === 'confirmed')
      .reduce((sum, b) => sum + b.total_price, 0),
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm rounded-full">✓ Confirmada</span>
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-sm rounded-full">⏳ Pendiente</span>
      case 'cancelled':
        return <span className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-full">✗ Rechazada</span>
      default:
        return null
    }
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
      <Header title="Reservas Recibidas - Be Living" showThemeToggle={true} />

      <div className="border-b border-gray-200 dark:border-gray-800 sticky top-16 z-40 bg-white dark:bg-black">
        <div className="max-w-4xl mx-auto px-6 py-3">
          <Link href="/host/dashboard" className="text-black dark:text-white underline text-sm">
            ← Volver al dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-light text-black dark:text-white mb-8">Reservas Recibidas</h1>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pendientes</p>
            <p className="text-3xl font-light text-black dark:text-white">{stats.pending}</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Confirmadas</p>
            <p className="text-3xl font-light text-black dark:text-white">{stats.confirmed}</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Ingresos</p>
            <p className="text-3xl font-light text-black dark:text-white">${stats.totalRevenue.toFixed(0)}</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Filter */}
        <div className="mb-6 flex gap-2">
          {(['all', 'pending', 'confirmed', 'cancelled'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 text-sm rounded-lg transition ${
                filterStatus === status
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'border border-gray-200 dark:border-gray-800 text-black dark:text-white hover:border-black dark:hover:border-white'
              }`}
            >
              {status === 'all' ? 'Todas' : status === 'pending' ? 'Pendientes' : status === 'confirmed' ? 'Confirmadas' : 'Rechazadas'}
            </button>
          ))}
        </div>

        {/* Bookings */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No hay reservas en esta categoría</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 hover:border-black dark:hover:border-white transition"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-black dark:text-white mb-2">
                      {getPropertyTitle(booking.property_id)}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <p>
                        👤 {booking.guest_name} ({booking.guest_email})
                      </p>
                      <p>
                        📅 {new Date(booking.check_in).toLocaleDateString('es-ES')} → {new Date(booking.check_out).toLocaleDateString('es-ES')}
                      </p>
                      <p>🌙 {booking.nights} noches</p>
                      <p>💰 ${booking.total_price.toFixed(2)}</p>
                      {booking.notes && <p>📝 {booking.notes}</p>}
                    </div>
                  </div>

                  <div className="flex flex-col items-start md:items-end gap-3">
                    {getStatusBadge(booking.status)}
                    {booking.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleConfirmBooking(booking.id)}
                          className="text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 px-3 py-1 rounded transition"
                        >
                          Aceptar
                        </button>
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 px-3 py-1 rounded transition"
                        >
                          Rechazar
                        </button>
                      </div>
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
