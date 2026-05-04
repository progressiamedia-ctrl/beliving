import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const enabledFilter = searchParams.get('enabled')

    let query = supabase
      .from('users')
      .select('id, email, agent_referral_code, agent_commission_tier, agent_enabled, agent_specialization, created_at')
      .eq('user_type', 'agent')

    if (enabledFilter === 'true') {
      query = query.eq('agent_enabled', true)
    } else if (enabledFilter === 'false') {
      query = query.eq('agent_enabled', false)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch agents' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { agentId, agent_enabled, agent_commission_tier } = await request.json()

    if (!agentId) {
      return NextResponse.json({ error: 'agentId is required' }, { status: 400 })
    }

    const updates: Record<string, any> = {}
    if (agent_enabled !== undefined) updates.agent_enabled = agent_enabled
    if (agent_commission_tier !== undefined) updates.agent_commission_tier = agent_commission_tier

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', agentId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update agent' },
      { status: 500 }
    )
  }
}
