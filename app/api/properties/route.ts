import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const limit = searchParams.get('limit') || '50'

    let query = supabase
      .from('properties')
      .select('*')
      .eq('available', true)
      .limit(parseInt(limit))

    if (city) {
      query = query.ilike('city', `%${city}%`)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Get properties error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch properties' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { host_id, title, description, location, city, price, amenities, images, max_guests, bedrooms, bathrooms } = await request.json()

    if (!host_id || !title || !location || !city || !price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('properties')
      .insert([{
        host_id,
        title,
        description,
        location,
        city,
        price: parseFloat(price),
        amenities: amenities || [],
        images: images || [],
        max_guests: max_guests || 2,
        bedrooms: bedrooms || 1,
        bathrooms: bathrooms || 1,
        available: true
      }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Create property error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create property' },
      { status: 500 }
    )
  }
}
