import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const referralCode = generateReferralCode()

    const { data, error } = await supabase
      .from('users')
      .update({
        user_type: 'agent',
        agent_referral_code: referralCode,
        agent_enabled: false,
        agent_commission_tier: 1
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    // Create commission summary record
    await supabase
      .from('agent_commission_summary')
      .insert({
        agent_id: userId
      })

    return NextResponse.json({
      id: data.id,
      agent_referral_code: data.agent_referral_code,
      agent_commission_tier: data.agent_commission_tier,
      agent_enabled: data.agent_enabled
    })
  } catch (error) {
    console.error('Agent setup error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to setup agent' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, email, agent_referral_code, agent_commission_tier, agent_enabled, agent_specialization')
      .eq('id', userId)
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Get agent error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch agent' },
      { status: 500 }
    )
  }
}
