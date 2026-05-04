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
  const { guest_id, host_id, total_price, nights, property_id, check_in, check_out, service_fee_amount } = booking

  // Check if guest was referred by an agent
  const { data: guestData } = await supabase
    .from('users')
    .select('referred_by_agent_id, agent_commission_tier')
    .eq('id', guest_id)
    .single()

  // Check if host was referred by an agent
  const { data: hostData } = await supabase
    .from('users')
    .select('referred_by_agent_id, agent_commission_tier')
    .eq('id', host_id)
    .single()

  const agentsToUpdate = new Set<string>()
  const commissionsToCreate = []

  // Guest referral commission
  if (guestData?.referred_by_agent_id) {
    const { data: agentData } = await supabase
      .from('users')
      .select('agent_commission_tier')
      .eq('id', guestData.referred_by_agent_id)
      .single()

    if (agentData) {
      const tierPercentages: Record<number, number> = { 1: 0.5, 2: 1.0, 3: 2.0 }
      const commissionPercentage = tierPercentages[agentData.agent_commission_tier] || 0.5
      const commissionAmount = parseFloat((service_fee_amount * commissionPercentage / 100).toFixed(2))

      commissionsToCreate.push({
        agent_id: guestData.referred_by_agent_id,
        booking_id: bookingId,
        referral_type: 'guest',
        host_id,
        guest_id,
        property_id,
        check_in,
        check_out,
        nights,
        property_price_total: total_price,
        service_fee_amount,
        commission_percentage: commissionPercentage,
        commission_amount: commissionAmount,
        status: 'pending'
      })
      agentsToUpdate.add(guestData.referred_by_agent_id)
    }
  }

  // Host referral commission
  if (hostData?.referred_by_agent_id) {
    const { data: agentData } = await supabase
      .from('users')
      .select('agent_commission_tier')
      .eq('id', hostData.referred_by_agent_id)
      .single()

    if (agentData) {
      const tierPercentages: Record<number, number> = { 1: 1.0, 2: 2.0, 3: 3.0 }
      const commissionPercentage = tierPercentages[agentData.agent_commission_tier] || 1.0
      const commissionAmount = parseFloat((service_fee_amount * commissionPercentage / 100).toFixed(2))

      commissionsToCreate.push({
        agent_id: hostData.referred_by_agent_id,
        booking_id: bookingId,
        referral_type: 'host',
        host_id,
        guest_id,
        property_id,
        check_in,
        check_out,
        nights,
        property_price_total: total_price,
        service_fee_amount,
        commission_percentage: commissionPercentage,
        commission_amount: commissionAmount,
        status: 'pending'
      })
      agentsToUpdate.add(hostData.referred_by_agent_id)
    }
  }

  // Create commission records
  if (commissionsToCreate.length > 0) {
    const { error } = await supabase
      .from('agent_commissions')
      .insert(commissionsToCreate)
    if (error) throw error
  }

  // Update commission summary for each agent
  for (const agentId of agentsToUpdate) {
    const { data: commissionSummary } = await supabase
      .from('agent_commission_summary')
      .select('*')
      .eq('agent_id', agentId)
      .single()

    if (commissionSummary) {
      const totalCommission = commissionsToCreate
        .filter(c => c.agent_id === agentId)
        .reduce((sum, c) => sum + c.commission_amount, 0)

      const now = new Date()
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      await supabase
        .from('agent_commission_summary')
        .update({
          total_pending_commission: parseFloat((commissionSummary.total_pending_commission + totalCommission).toFixed(2)),
          total_lifetime_commission: parseFloat((commissionSummary.total_lifetime_commission + totalCommission).toFixed(2)),
          commission_from_hosts_this_month: commissionsToCreate.some(c => c.agent_id === agentId && c.referral_type === 'host')
            ? parseFloat((commissionSummary.commission_from_hosts_this_month + commissionsToCreate.filter(c => c.agent_id === agentId && c.referral_type === 'host').reduce((s, c) => s + c.commission_amount, 0)).toFixed(2))
            : commissionSummary.commission_from_hosts_this_month,
          commission_from_guests_this_month: commissionsToCreate.some(c => c.agent_id === agentId && c.referral_type === 'guest')
            ? parseFloat((commissionSummary.commission_from_guests_this_month + commissionsToCreate.filter(c => c.agent_id === agentId && c.referral_type === 'guest').reduce((s, c) => s + c.commission_amount, 0)).toFixed(2))
            : commissionSummary.commission_from_guests_this_month,
          total_commission_this_month: parseFloat((commissionSummary.total_commission_this_month + totalCommission).toFixed(2)),
          updated_at: new Date().toISOString()
        })
        .eq('agent_id', agentId)
    }
  }
}
