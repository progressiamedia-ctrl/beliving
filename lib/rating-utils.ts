import { supabase } from './supabase'

export interface Rating {
  id: string
  booking_id: string
  property_id: string
  guest_id: string
  rating: number // 1-5
  comment: string
  created_at: string
}

export async function createRating(data: {
  bookingId: string
  propertyId: string
  guestId: string
  rating: number
  comment: string
}) {
  const { error, data: rating } = await supabase
    .from('ratings')
    .insert([
      {
        booking_id: data.bookingId,
        property_id: data.propertyId,
        guest_id: data.guestId,
        rating: Math.max(1, Math.min(5, data.rating)),
        comment: data.comment.trim(),
      },
    ])
    .select()
    .single()

  if (error) throw error
  return rating
}

export async function getPropertyRatings(propertyId: string) {
  const { data, error } = await supabase
    .from('ratings')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as Rating[]) || []
}

export async function getRatingStats(propertyId: string) {
  const ratings = await getPropertyRatings(propertyId)

  if (ratings.length === 0) {
    return { average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }
  }

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  let sum = 0

  for (const rating of ratings) {
    sum += rating.rating
    distribution[rating.rating as keyof typeof distribution]++
  }

  return {
    average: sum / ratings.length,
    count: ratings.length,
    distribution,
  }
}

export async function getBookingRating(bookingId: string) {
  const { data } = await supabase
    .from('ratings')
    .select('*')
    .eq('booking_id', bookingId)
    .single()

  return data as Rating | null
}

export async function hasUserRatedProperty(guestId: string, propertyId: string) {
  const { data } = await supabase
    .from('ratings')
    .select('id')
    .eq('guest_id', guestId)
    .eq('property_id', propertyId)
    .limit(1)
    .single()

  return !!data
}
