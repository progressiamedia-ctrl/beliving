'use client'

import { useEffect, useRef, useState, FormEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { properties, Property } from '@/lib/properties-data'
import { BookingCalendar, BookingData } from '@/components/BookingCalendar'
import { getPropertyBookedDates, createBooking } from '@/lib/booking-utils'
import { getOrCreateConversation } from '@/lib/chat-utils'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { getPropertyRatings, Rating } from '@/lib/rating-utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type ResolvedProperty = Property & { host_id: string | null }

export default function PropertyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.id as string

  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
  const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null

  const [property, setProperty] = useState<ResolvedProperty | null | undefined>(undefined)
  const [bookedDates, setBookedDates] = useState<string[]>([])
  const [pendingBooking, setPendingBooking] = useState<BookingData | null>(null)
  const [isBooking, setIsBooking] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestNotes, setGuestNotes] = useState('')
  const [ratings, setRatings] = useState<Rating[]>([])
  const modalRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement | HTMLDivElement>(null)

  // Property resolution: static first, then Supabase
  useEffect(() => {
    const staticProp = properties.find((p) => p.id === propertyId)
    if (staticProp) {
      setProperty({ ...staticProp, host_id: null })
      getPropertyBookedDates(propertyId).then(setBookedDates).catch(() => setBookedDates([]))
      return
    }

    if (propertyId.includes('-')) {
      supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single()
        .then(({ data, error }: { data: any; error: any }) => {
          if (error || !data) {
            setProperty(null)
            return
          }
          setProperty({
            id: data.id,
            title: data.title,
            price: data.price_per_night || 0,
            location: data.location,
            city: data.city,
            lat: data.latitude || 0,
            lng: data.longitude || 0,
            amenities: data.amenities || [],
            rating: 0,
            verified: data.verified || false,
            images: data.images || [],
            description: data.description || '',
            host_id: data.host_id,
          })
          getPropertyBookedDates(propertyId).then(setBookedDates).catch(() => setBookedDates([]))
          getPropertyRatings(propertyId).then(setRatings).catch(() => {})
        })
    } else {
      setProperty(null)
    }
  }, [propertyId])

  // Pre-fill guest info when booking is confirmed
  useEffect(() => {
    if (!pendingBooking) return
    const email = localStorage.getItem('userEmail') || ''
    setGuestEmail(email)
    getCurrentUser().then((user) => {
      if (user?.name) setGuestName(user.name)
    })
  }, [pendingBooking])

  // Focus management for modal
  useEffect(() => {
    if (pendingBooking && modalRef.current) {
      triggerRef.current = document.activeElement as HTMLButtonElement | HTMLDivElement
      modalRef.current.focus()
    } else if (!pendingBooking && triggerRef.current) {
      triggerRef.current.focus()
    }
  }, [pendingBooking])

  const handleBookingSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!pendingBooking || !userId || !property?.host_id) return

    setIsBooking(true)
    setBookingError('')

    try {
      const newBooking = await createBooking({
        propertyId: property.id,
        guestId: userId,
        hostId: property.host_id,
        checkIn: pendingBooking.checkIn,
        checkOut: pendingBooking.checkOut,
        nights: pendingBooking.nights,
        totalPrice: pendingBooking.totalPrice,
        guestName,
        guestEmail,
        guestPhone: guestPhone || undefined,
        notes: guestNotes || undefined,
      })

      // Fetch host info to create conversation
      const { data: host } = await supabase
        .from('users')
        .select('email, first_name, last_name')
        .eq('id', property.host_id)
        .single()

      const hostName =
        [host?.first_name, host?.last_name].filter(Boolean).join(' ') ||
        host?.email?.split('@')[0] ||
        'Anfitrión'

      // Create conversation for messaging
      await getOrCreateConversation(
        newBooking.id,
        userId,
        property.host_id,
        guestName,
        hostName,
        guestEmail,
        host?.email || '',
        property.id,
        property.title,
      )

      router.push('/guest/bookings?success=true')
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Error al crear la reserva')
      setIsBooking(false)
    }
  }

  // Show loading state while resolving property
  if (property === undefined) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Header title="Cargando..." />
        <div className="max-w-4xl mx-auto px-6 py-12 mt-16">
          <p className="text-gray-600 dark:text-gray-400">Cargando propiedad...</p>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Header title="Propiedad no encontrada" />
        <div className="max-w-4xl mx-auto px-6 py-12 mt-16">
          <p className="text-gray-900 dark:text-white mb-6">La propiedad que buscas no existe.</p>
          <Link href="/properties" className="text-yellow-500 dark:text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-500">
            ← Volver a propiedades
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header title={property.title} />

      <div className="max-w-4xl mx-auto px-6 py-12 mt-16">
        {/* Back button */}
        <Link href="/properties" className="text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm mb-8 inline-block transition">
          ← Volver a propiedades
        </Link>

        {/* Image */}
        <div className="mb-12 rounded-2xl overflow-hidden h-96 bg-gray-200 dark:bg-gray-900">
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
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">{property.title}</h1>
                  <p className="text-gray-700 dark:text-gray-300 text-base sm:text-lg">{property.location}</p>
                </div>
                {property.verified && (
                  <div className="bg-yellow-400 text-black px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap">
                    ✓ Verificado
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400 text-2xl" aria-hidden="true">★</span>
                    <span className="text-gray-900 dark:text-white text-2xl font-bold">{property.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-gray-700 dark:text-gray-400">({ratings.length} reseña{ratings.length !== 1 ? 's' : ''})</span>
                </div>
                {property.host_id && (
                  <Link
                    href={`/host/${property.host_id}`}
                    className="text-sm text-gray-700 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 underline transition"
                  >
                    Ver perfil →
                  </Link>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-gray-900 dark:text-white text-xl font-semibold mb-4">Acerca de este lugar</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">{property.description}</p>
            </div>

            {/* Amenities */}
            <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-gray-900 dark:text-white text-xl font-semibold mb-4">Amenidades</h2>
              <div className="grid grid-cols-2 gap-4">
                {property.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <span className="text-yellow-400">✓</span>
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <h2 className="text-gray-900 dark:text-white text-xl font-semibold mb-4">Ubicación</h2>
              <p className="text-gray-700 dark:text-gray-300 text-lg mb-2">{property.city}</p>
              <p className="text-gray-700 dark:text-gray-400 text-sm">Coordenadas: {property.lat.toFixed(4)}, {property.lng.toFixed(4)}</p>
            </div>
          </div>

          {/* Right - Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 sticky top-32">
              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">${property.price}</span>
                  <span className="text-gray-700 dark:text-gray-400">/noche</span>
                </div>
              </div>

              {!userId || userRole !== 'guest' ? (
                <p className="text-gray-700 dark:text-gray-400 text-sm text-center py-8">
                  <Link href="/" className="text-yellow-500 dark:text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-500 underline">
                    Inicia sesión
                  </Link>{' '}
                  como huésped para reservar
                </p>
              ) : !property.host_id ? (
                <p className="text-gray-400 text-sm text-center py-8">
                  Reservas disponibles solo para propiedades publicadas en la plataforma
                </p>
              ) : (
                <BookingCalendar
                  propertyId={property.id}
                  nightlyPrice={property.price}
                  bookedDates={bookedDates}
                  onConfirmBooking={setPendingBooking}
                />
              )}
            </div>
          </div>
        </div>

        {/* Booking Confirmation Modal */}
        {pendingBooking && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="booking-modal-title"
              className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 max-w-md w-full max-h-[90vh] overflow-y-auto"
              tabIndex={-1}
            >
              <h2 id="booking-modal-title" className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Confirmar reserva</h2>
              <p className="text-gray-700 dark:text-gray-400 text-sm mb-6">{property?.title}</p>

              {/* Price Summary */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm space-y-2">
                <div className="flex justify-between text-gray-700 dark:text-gray-400">
                  <span>
                    {pendingBooking.checkIn.toLocaleDateString('es-ES')} →{' '}
                    {pendingBooking.checkOut.toLocaleDateString('es-ES')}
                  </span>
                  <span>{pendingBooking.nights} noches</span>
                </div>
                <div className="flex justify-between font-semibold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                  <span>Total</span>
                  <span>${pendingBooking.totalPrice.toFixed(2)}</span>
                </div>
              </div>

              {bookingError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm" role="status">
                  {bookingError}
                </div>
              )}

              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <Input
                  label="Nombre completo"
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
                <Input
                  label="Email"
                  type="email"
                  required
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                />
                <Input
                  label="Teléfono"
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                />
                <Input
                  label="Notas para el anfitrión"
                  as="textarea"
                  rows={3}
                  value={guestNotes}
                  onChange={(e) => setGuestNotes(e.target.value)}
                />
                <Button
                  type="submit"
                  variant="premium"
                  fullWidth
                  isLoading={isBooking}
                >
                  {isBooking ? 'Enviando...' : 'Confirmar reserva'}
                </Button>
                <Button
                  type="button"
                  variant="text"
                  fullWidth
                  onClick={() => {
                    setPendingBooking(null)
                    setBookingError('')
                  }}
                >
                  Cancelar
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Reviews Section */}
        {ratings.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
            <h2 className="text-gray-900 dark:text-white text-2xl font-semibold mb-6">Reseñas ({ratings.length})</h2>
            <div className="space-y-6">
              {ratings.slice(0, 5).map((r) => (
                <div key={r.id} className="border-b border-gray-200 dark:border-gray-800 pb-6">
                  <div className="flex items-center gap-2 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={i < r.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-700'}
                        aria-hidden="true"
                      >
                        ★
                      </span>
                    ))}
                    <span className="text-sm text-gray-600 dark:text-gray-500 ml-2">
                      {new Date(r.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  {r.comment && (
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{r.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
