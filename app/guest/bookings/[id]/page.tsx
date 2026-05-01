'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { cancelBooking, type Booking } from '@/lib/booking-utils'
import { supabase } from '@/lib/supabase'
import { properties } from '@/lib/properties-data'

export default function BookingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string

  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
  const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null

  const [booking, setBooking] = useState<Booking | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!userId || userRole !== 'guest') {
      router.push('/')
      return
    }

    loadBooking()
  }, [userId, userRole, router])

  const loadBooking = async () => {
    try {
      const { data, error: err } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .eq('guest_id', userId)
        .single()

      if (err || !data) {
        setError('Reserva no encontrada')
        setLoading(false)
        return
      }

      setBooking(data as Booking)

      // Find conversation for this booking
      const { data: conv } = await supabase
        .from('conversations')
        .select('id')
        .eq('booking_id', bookingId)
        .single()

      if (conv) setConversationId(conv.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la reserva')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('¿Cancelar esta reserva?')) return
    if (!booking) return

    setCancelling(true)
    try {
      await cancelBooking(booking.id)
      setBooking({ ...booking, status: 'cancelled' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cancelar')
    } finally {
      setCancelling(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-3 py-1 rounded-full text-xs font-semibold'
    switch (status) {
      case 'pending':
        return <span className={`${baseClasses} bg-yellow-50 text-yellow-700`} aria-label="Reserva pendiente de confirmación">Pendiente</span>
      case 'confirmed':
        return <span className={`${baseClasses} bg-green-50 text-green-700`} aria-label="Reserva confirmada">Confirmada</span>
      case 'cancelled':
        return <span className={`${baseClasses} bg-red-50 text-red-700`} aria-label="Reserva cancelada">Cancelada</span>
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-700`} aria-label={`Estado de reserva: ${status}`}>{status}</span>
    }
  }

  const getPropertyTitle = (propertyId: string) => {
    const prop = properties.find((p) => p.id === propertyId)
    return prop?.title || 'Propiedad'
  }

  const isCheckoutPassed = (checkoutDate: string) => {
    const checkout = new Date(checkoutDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return checkout <= today
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Header />
        <div className="max-w-2xl mx-auto px-6 py-12 mt-16">
          <p className="text-gray-600 dark:text-gray-400">Cargando reserva...</p>
        </div>
      </div>
    )
  }

  if (!booking || error) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Header />
        <div className="max-w-2xl mx-auto px-6 py-12 mt-16">
          <Link href="/guest/bookings" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white text-sm mb-8 inline-block">
            ← Volver a mis reservas
          </Link>
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400" role="alert">
              {error}
            </div>
          )}
        </div>
      </div>
    )
  }

  const propertyTitle = getPropertyTitle(booking.property_id)
  const checkoutPassed = isCheckoutPassed(booking.check_out)

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header />

      {/* Back Nav */}
      <div className="sticky top-16 z-40 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 px-6 py-3">
        <Link href="/guest/bookings" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition">
          ← Volver a mis reservas
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Title and Status */}
        <div className="mb-8">
          <h1 className="text-3xl font-light text-black dark:text-white mb-3">{propertyTitle}</h1>
          <div className="flex items-center gap-4">
            {getStatusBadge(booking.status)}
            <span className="text-sm text-gray-500 dark:text-gray-400">ID: {booking.id.slice(0, 8)}...</span>
          </div>
        </div>

        {/* Booking Details Card */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-black dark:text-white mb-4">Detalles de la reserva</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Check-in</span>
              <span className="text-black dark:text-white font-medium">
                {new Date(booking.check_in).toLocaleDateString('es-ES')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Check-out</span>
              <span className="text-black dark:text-white font-medium">
                {new Date(booking.check_out).toLocaleDateString('es-ES')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Noches</span>
              <span className="text-black dark:text-white font-medium">{booking.nights}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-800 pt-3 mt-3 flex justify-between">
              <span className="text-gray-600 dark:text-gray-400 font-medium">Precio total</span>
              <span className="text-black dark:text-white font-bold text-lg">${booking.total_price.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Guest Info Card */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-black dark:text-white mb-4">Tus datos</h2>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">Nombre</p>
              <p className="text-black dark:text-white">{booking.guest_name}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">Email</p>
              <p className="text-black dark:text-white">{booking.guest_email}</p>
            </div>
            {booking.guest_phone && (
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Teléfono</p>
                <p className="text-black dark:text-white">{booking.guest_phone}</p>
              </div>
            )}
            {booking.notes && (
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Notas</p>
                <p className="text-black dark:text-white">{booking.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
          {conversationId && (
            <Link
              href={`/messages/${conversationId}`}
              aria-label={`Abrir chat sobre reserva en ${propertyTitle}`}
              className="inline-block bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition"
            >
              💬 Abrir chat
            </Link>
          )}

          {booking.status === 'pending' && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              aria-label={`Cancelar reserva en ${propertyTitle}`}
              className="px-6 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition disabled:opacity-50 font-medium"
            >
              {cancelling ? 'Cancelando...' : 'Cancelar reserva'}
            </button>
          )}

          {booking.status === 'confirmed' && checkoutPassed && (
            <Link
              href={`/bookings/${booking.id}/rate`}
              aria-label={`Calificar tu estadía en ${propertyTitle}`}
              className="inline-block bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 px-6 py-2 rounded-lg transition font-medium"
            >
              Calificar estadía
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
