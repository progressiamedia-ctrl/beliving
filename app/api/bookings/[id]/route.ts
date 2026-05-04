import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface BookingParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  { params }: BookingParams
) {
  try {
    const { id } = await params
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Get booking error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch booking' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: BookingParams
) {
  try {
    const { id } = await params
    const { status, user_id } = await request.json()

    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Verify authorization (only guest or host can update)
    const { data: booking } = await supabase
      .from('bookings')
      .select('guest_id, host_id, total_price, nights, property_id, check_in, check_out, service_fee_amount')
      .eq('id', id)
      .single()

    if (!booking || (booking.guest_id !== user_id && booking.host_id !== user_id)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('bookings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Trigger commission calculation when booking is confirmed
    if (status === 'confirmed') {
      try {
        await calculateCommissions(booking, id)
      } catch (commError) {
        console.error('Commission calculation error:', commError)
        // Don't fail the booking update due to commission error
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Update booking error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update booking' },
      { status: 500 }
    )
  }
}

async function calculateCommissions(booking: any, bookingId: string) {
  const { guest_id, host_id, total_price, service_fee_amount } = booking

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  const { data: guestData } = await supabase
    .from('users')
    .select('referred_by_agent_id')
    .eq('id', guest_id)
    .single()

  const { data: hostData } = await supabase
    .from('users')
    .select('referred_by_agent_id')
    .eq('id', host_id)
    .single()

  if (guestData?.referred_by_agent_id) {
    await fetch(`${baseUrl}/api/agent/commission-reservation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId,
        guestId: guest_id,
        hostId: host_id,
        propertyId: booking.property_id,
        totalPrice: total_price,
        serviceFee: service_fee_amount,
        checkIn: booking.check_in,
        checkOut: booking.check_out
      })
    }).catch(err => {
      // Log but don't fail booking update
    })
  }
}
