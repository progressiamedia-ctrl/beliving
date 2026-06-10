import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const role = searchParams.get('role') // 'guest' or 'host'

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    let query = supabase.from('bookings').select('*')

    if (role === 'guest') {
      query = query.eq('guest_id', userId)
    } else if (role === 'host') {
      query = query.eq('host_id', userId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Get bookings error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { property_id, guest_id, host_id, check_in, check_out, total_price, guest_name, guest_email, notes } = await request.json()

    if (!property_id || !guest_id || !host_id || !check_in || !check_out || !total_price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate dates
    const checkInDate = new Date(check_in)
    const checkOutDate = new Date(check_out)
    if (checkOutDate <= checkInDate) {
      return NextResponse.json(
        { error: 'Check-out date must be after check-in date' },
        { status: 400 }
      )
    }

    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
    const totalPriceNum = parseFloat(total_price)
    const service_fee_amount = parseFloat((totalPriceNum * 5 / 105).toFixed(2))

    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        property_id,
        guest_id,
        host_id,
        check_in,
        check_out,
        total_price: totalPriceNum,
        nights,
        service_fee_amount,
        guest_name,
        guest_email,
        notes,
        status: 'pending'
      }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Create booking error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create booking' },
      { status: 500 }
    )
  }
}
