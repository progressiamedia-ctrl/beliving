'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { RatingForm } from '@/components/RatingForm'
import { getBookingsByGuest, Booking } from '@/lib/booking-utils'
import { createRating, getBookingRating } from '@/lib/rating-utils'
import { properties } from '@/lib/properties-data'
import { supabase } from '@/lib/supabase'

export default function RateBookingPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [alreadyRated, setAlreadyRated] = useState(false)
  const [propertyData, setPropertyData] = useState<{ title: string; images: string[] } | null>(null)
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null

  useEffect(() => {
    if (!userId) {
      router.push('/')
      return
    }

    loadBooking()
  }, [userId, bookingId, router])

  const loadBooking = async () => {
    try {
      if (!userId) return

      const bookings = await getBookingsByGuest(userId)
      const currentBooking = bookings.find((b) => b.id === bookingId)

      if (!currentBooking) {
        setError('Reserva no encontrada')
        setLoading(false)
        return
      }

      // Check if checkout date has passed
      const checkoutDate = new Date(currentBooking.check_out)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (checkoutDate > today) {
        setError('Solo puedes calificar después del checkout')
        setLoading(false)
        return
      }

      // Check if already rated
      const existingRating = await getBookingRating(bookingId)
      if (existingRating) {
        setAlreadyRated(true)
        setLoading(false)
        return
      }

      setBooking(currentBooking)

      // Resolve property data
      const staticProp = properties.find(p => p.id === currentBooking.property_id)
      if (staticProp) {
        setPropertyData({ title: staticProp.title, images: staticProp.images })
      } else {
        const { data } = await supabase
          .from('properties')
          .select('title, images')
          .eq('id', currentBooking.property_id)
          .single()
        if (data) {
          setPropertyData({ title: data.title, images: data.images || [] })
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar reserva')
    } finally {
      setLoading(false)
    }
  }

  const handleRatingSubmit = async (rating: number, comment: string) => {
    if (!booking || !userId) return

    setSubmitting(true)

    try {
      await createRating({
        bookingId: booking.id,
        propertyId: booking.property_id,
        guestId: userId,
        rating,
        comment,
      })

      setSuccess(true)
      setTimeout(() => {
        router.push('/guest/bookings')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar rating')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
      </div>
    )
  }

  if (alreadyRated) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Header title="Ya Calificado - Be Living" showThemeToggle={true} />

        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="text-center space-y-4">
            <p className="text-2xl">✓</p>
            <p className="text-xl text-black dark:text-white">Ya has calificado esta reserva</p>
            <Link href="/guest/bookings" aria-label="Volver a mis reservas" className="inline-block bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition">
              Volver a mis reservas
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (error || !booking || !propertyData) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Header title="Calificar - Be Living" showThemeToggle={true} />

        <div className="max-w-2xl mx-auto px-6 py-12">
          <p className="text-red-600 dark:text-red-400 mb-6" role="alert">{error || 'Reserva no encontrada'}</p>
          <Link href="/guest/bookings" className="text-black dark:text-white underline" aria-label="Volver a mis reservas">
            Volver a mis reservas
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header title="Calificar - Be Living" showThemeToggle={true} />

      <div className="border-b border-gray-200 dark:border-gray-800 sticky top-16 z-40 bg-white dark:bg-black">
        <div className="max-w-2xl mx-auto px-6 py-3">
          <Link href="/guest/bookings" className="text-black dark:text-white underline text-sm">
            ← Volver
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Property Image */}
        {propertyData?.images?.[0] && (
          <div className="mb-8 rounded-lg overflow-hidden">
            <img
              src={propertyData.images[0]}
              alt={propertyData.title}
              className="w-full h-64 object-cover"
            />
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg text-green-700 dark:text-green-400" role="status">
            ¡Gracias por tu calificación! Redirigiendo...
          </div>
        )}

        {/* Rating Form */}
        {!success && (
          <RatingForm
            onSubmit={handleRatingSubmit}
            isLoading={submitting}
            propertyTitle={propertyData?.title || 'Propiedad'}
          />
        )}
      </div>
    </div>
  )
}
