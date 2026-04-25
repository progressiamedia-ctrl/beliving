import { supabase } from './supabase'

export interface Booking {
  id: string
  property_id: string
  guest_id: string
  host_id: string
  check_in: string
  check_out: string
  total_price: number
  nights: number
  status: 'pending' | 'confirmed' | 'cancelled'
  guest_name: string
  guest_email: string
  guest_phone?: string
  notes?: string
  created_at: string
  updated_at: string
}

export async function createBooking(data: {
  propertyId: string
  guestId: string
  hostId: string
  checkIn: Date
  checkOut: Date
  nights: number
  totalPrice: number
  guestName: string
  guestEmail: string
  guestPhone?: string
  notes?: string
}) {
  const { error, data: booking } = await supabase
    .from('bookings')
    .insert([
      {
        property_id: data.propertyId,
        guest_id: data.guestId,
        host_id: data.hostId,
        check_in: data.checkIn.toISOString().split('T')[0],
        check_out: data.checkOut.toISOString().split('T')[0],
        total_price: data.totalPrice,
        nights: data.nights,
        status: 'pending',
        guest_name: data.guestName,
        guest_email: data.guestEmail,
        guest_phone: data.guestPhone || null,
        notes: data.notes || null,
      },
    ])
    .select()
    .single()

  if (error) throw error
  return booking
}

export async function getBookingsByGuest(guestId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('guest_id', guestId)
    .order('check_in', { ascending: false })

  if (error) throw error
  return data as Booking[]
}

export async function getBookingsByHost(hostId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('host_id', hostId)
    .order('check_in', { ascending: false })

  if (error) throw error
  return data as Booking[]
}

export async function getPropertyBookedDates(propertyId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('check_in, check_out')
    .eq('property_id', propertyId)
    .neq('status', 'cancelled')

  if (error) throw error

  const bookedDates = new Set<string>()

  for (const booking of data) {
    const start = new Date(booking.check_in)
    const end = new Date(booking.check_out)

    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      bookedDates.add(d.toISOString().split('T')[0])
    }
  }

  return Array.from(bookedDates)
}

export async function updateBookingStatus(bookingId: string, status: 'confirmed' | 'cancelled') {
  const { error } = await supabase
    .from('bookings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', bookingId)

  if (error) throw error
}

export async function cancelBooking(bookingId: string) {
  await updateBookingStatus(bookingId, 'cancelled')
}

export async function confirmBooking(bookingId: string) {
  await updateBookingStatus(bookingId, 'confirmed')
}
