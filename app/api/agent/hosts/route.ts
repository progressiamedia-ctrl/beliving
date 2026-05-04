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
      .from('agent_host_referrals')
      .select('id, host_id, status, notes, registered_at, last_contacted_at, users:host_id(email, first_name, last_name)')
      .eq('agent_id', agentId)

    if (statusFilter && ['prospect', 'active', 'generating', 'inactive'].includes(statusFilter)) {
      query = query.eq('status', statusFilter)
    }

    const { data, error } = await query.order('registered_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Get hosts error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch hosts' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { referralId, notes, status, last_contacted_at } = await request.json()

    if (!referralId) {
      return NextResponse.json({ error: 'referralId is required' }, { status: 400 })
    }

    const updates: Record<string, any> = {}
    if (notes !== undefined) updates.notes = notes
    if (status !== undefined) updates.status = status
    if (last_contacted_at !== undefined) updates.last_contacted_at = last_contacted_at

    const { data, error } = await supabase
      .from('agent_host_referrals')
      .update(updates)
      .eq('id', referralId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Update host error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update host' },
      { status: 500 }
    )
  }
}
