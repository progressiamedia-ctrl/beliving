import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: Obtener sub-afiliados del agente
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agent_id')

    if (!agentId) {
      return NextResponse.json({ error: 'agent_id required' }, { status: 400 })
    }

    // Verificar que sea Tier 4+
    const { data: agent } = await supabase
      .from('users')
      .select('agent_tier')
      .eq('id', agentId)
      .single()

    if (!agent || agent.agent_tier < 4) {
      return NextResponse.json(
        { error: 'Must be Tier 4+ to have sub-affiliates' },
        { status: 403 }
      )
    }

    // Obtener sub-afiliados
    const { data: subAffiliates, error } = await supabase
      .from('agent_sub_affiliates')
      .select(`
        id,
        referred_agent_id,
        referred_user:users!referred_agent_id(
          id,
          email,
          agent_tier,
          agent_subs_active,
          agent_reservations_total
        ),
        sub_affiliate_commission_pct,
        lifetime_commission_earned,
        lifetime_commission_paid,
        referred_at,
        is_active
      `)
      .eq('referrer_agent_id', agentId)
      .order('referred_at', { ascending: false })

    if (error) {
      console.error('Error fetching sub-affiliates:', error)
      return NextResponse.json(
        { error: 'Failed to fetch sub-affiliates' },
        { status: 500 }
      )
    }

    // Obtener comisiones este mes para cada sub-afiliado
    const now = new Date()
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      '0'
    )}`

    const subAffiliatesWithMetrics = await Promise.all(
      (subAffiliates || []).map(async (sub) => {
        const { data: monthlyEarnings } = await supabase
          .from('sub_affiliate_commissions')
          .select('amount')
          .eq('sub_affiliate_id', sub.id)
          .gte('earned_at', `${monthYear}-01`)

        const monthlyTotal = monthlyEarnings?.reduce((sum, c) => sum + c.amount, 0) || 0

        return {
          ...sub,
          monthlyEarnings: monthlyTotal
        }
      })
    )

    // Calcular totales
    const totalEarnings = subAffiliatesWithMetrics.reduce(
      (sum, s) => sum + (s.lifetime_commission_earned || 0),
      0
    )
    const totalPaid = subAffiliatesWithMetrics.reduce(
      (sum, s) => sum + (s.lifetime_commission_paid || 0),
      0
    )
    const totalMonthlyEarnings = subAffiliatesWithMetrics.reduce(
      (sum, s) => sum + (s.monthlyEarnings || 0),
      0
    )

    return NextResponse.json({
      subAffiliates: subAffiliatesWithMetrics,
      totals: {
        count: subAffiliatesWithMetrics.length,
        lifetimeEarnings: totalEarnings,
        lifetimePaid: totalPaid,
        monthlyEarnings: totalMonthlyEarnings,
        averageEarningsPerAffiliate: subAffiliatesWithMetrics.length > 0 ? totalMonthlyEarnings / subAffiliatesWithMetrics.length : 0
      },
      teamLeader: subAffiliatesWithMetrics.length >= 10
    })
  } catch (error) {
    console.error('Error in sub-affiliates GET:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch sub-affiliates' },
      { status: 500 }
    )
  }
}

// POST: Crear referral de nuevo agente
interface ReferralRequest {
  referrerAgentId: string
  referredAgentId: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ReferralRequest = await request.json()

    if (!body.referrerAgentId || !body.referredAgentId) {
      return NextResponse.json(
        { error: 'referrerAgentId and referredAgentId required' },
        { status: 400 }
      )
    }

    // Verificar que referrer sea Tier 4+
    const { data: referrer } = await supabase
      .from('users')
      .select('agent_tier')
      .eq('id', body.referrerAgentId)
      .single()

    if (!referrer || referrer.agent_tier < 4) {
      return NextResponse.json(
        { error: 'Referrer must be Tier 4+' },
        { status: 403 }
      )
    }

    // Crear sub-afiliado
    const { data: subAffiliate, error } = await supabase
      .from('agent_sub_affiliates')
      .insert([
        {
          referrer_agent_id: body.referrerAgentId,
          referred_agent_id: body.referredAgentId,
          sub_affiliate_commission_pct: 2.0, // 2% default
          referred_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Sub-affiliate relationship already exists' },
          { status: 409 }
        )
      }
      console.error('Error creating sub-affiliate:', error)
      return NextResponse.json(
        { error: 'Failed to create sub-affiliate' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      subAffiliate,
      message: 'Sub-affiliate creado exitosamente'
    })
  } catch (error) {
    console.error('Error in sub-affiliates POST:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create sub-affiliate' },
      { status: 500 }
    )
  }
}
