import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('property_id')

    if (!propertyId) {
      return NextResponse.json(
        { error: 'property_id is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('ratings')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Get ratings error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch ratings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { booking_id, property_id, guest_id, rating, comment } = await request.json()

    if (!booking_id || !property_id || !guest_id || !rating || !comment) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Check if rating already exists for this booking
    const { data: existingRating } = await supabase
      .from('ratings')
      .select('id')
      .eq('booking_id', booking_id)
      .single()

    if (existingRating) {
      return NextResponse.json(
        { error: 'Rating already exists for this booking' },
        { status: 409 }
      )
    }

    const { data, error } = await supabase
      .from('ratings')
      .insert([{
        booking_id,
        property_id,
        guest_id,
        rating: parseInt(rating),
        comment
      }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Create rating error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create rating' },
      { status: 500 }
    )
  }
}
