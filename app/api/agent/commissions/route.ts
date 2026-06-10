import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agent_id')
    const statusFilter = searchParams.get('status')

    if (!agentId) {
      return NextResponse.json({ error: 'agent_id is required' }, { status: 400 })
    }

    let query = supabase
      .from('agent_commissions')
      .select('id, booking_id, referral_type, property_id, check_in, check_out, nights, service_fee_amount, commission_percentage, commission_amount, status, created_at')
      .eq('agent_id', agentId)

    if (statusFilter && ['pending', 'earned', 'paid'].includes(statusFilter)) {
      query = query.eq('status', statusFilter)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Get commissions error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch commissions' },
      { status: 500 }
    )
  }
}
