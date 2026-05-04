import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('agent_id')

    if (!userId) {
      return NextResponse.json({ error: 'agent_id required' }, { status: 400 })
    }

    // 1. Obtener datos del agente
    const { data: agent, error: agentError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        agent_tier,
        agent_referral_code,
        agent_subs_active,
        agent_subs_annual,
        agent_reservations_total,
        agent_reservations_this_month,
        agent_mrr_residual,
        agent_last_tier_change
      `)
      .eq('id', userId)
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // 2. Obtener tasas de comisión del tier actual
    const { data: tierRates } = await supabase
      .from('tier_commission_rates')
      .select('*')
      .eq('tier', agent.agent_tier)
      .single()

    // 3. Obtener requisitos del próximo tier
    const nextTier = agent.agent_tier + 1
    const { data: nextTierReqs } = await supabase
      .from('tier_requirements')
      .select('*')
      .eq('tier', nextTier)
      .single()

    // 4. Obtener métricas del mes actual
    const now = new Date()
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const { data: monthlyMetrics } = await supabase
      .from('agent_monthly_metrics')
      .select('*')
      .eq('agent_id', userId)
      .eq('month_year', monthYear)
      .single()

    // 5. Obtener comisiones congeladas
    const { data: frozenCommissions } = await supabase
      .from('frozen_commissions')
      .select('*')
      .eq('agent_id', userId)
      .eq('status', 'frozen')

    // 6. Obtener comisiones ganadas este mes
    const { data: earnedCommissions } = await supabase
      .from('commission_history')
      .select('*')
      .eq('agent_id', userId)
      .eq('status', 'earned')
      .gte('earned_at', `${monthYear}-01`)

    // 7. Obtener sub-afiliados activos (si Tier 4+)
    let subAffiliates: any[] = []
    if (agent.agent_tier >= 4) {
      const { data: subs } = await supabase
        .from('agent_sub_affiliates')
        .select(`
          id,
          referred_agent_id,
          referred:users(email),
          lifetime_commission_earned,
          is_active
        `)
        .eq('referrer_agent_id', userId)
        .eq('is_active', true)

      subAffiliates = subs || []
    }

    // 8. Obtener desafíos del mes
    const { data: challenges } = await supabase
      .from('agent_challenge_progress')
      .select(`
        id,
        challenge_id,
        subs_count,
        reservations_count,
        interactions_count,
        completed,
        prize_amount,
        challenge:monthly_challenges(
          challenge_type,
          challenge_name,
          challenge_description
        )
      `)
      .eq('agent_id', userId)
      .eq('challenge:monthly_challenges.month_year', monthYear)

    // 9. Obtener bonificaciones activas
    const { data: activeBonuses } = await supabase
      .from('agent_active_bonuses')
      .select('*')
      .eq('agent_id', userId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())

    // 10. Calcular totales
    const totalFrozen = frozenCommissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0
    const totalEarned = monthlyMetrics?.commission_earned || 0
    const totalPaid = monthlyMetrics?.commission_paid || 0
    const subAffiliateEarnings = monthlyMetrics?.sub_affiliate_commission || 0

    // 11. Calcular progreso hacia próximo tier
    let tierProgress = {
      subsProgress: 0,
      subsRequired: 0,
      reservationsProgress: 0,
      reservationsRequired: 0
    }

    if (nextTierReqs) {
      tierProgress = {
        subsProgress: agent.agent_subs_active,
        subsRequired: nextTierReqs.min_subs_cumulative,
        reservationsProgress: agent.agent_reservations_this_month,
        reservationsRequired: nextTierReqs.min_reservations_per_month
      }
    }

    return NextResponse.json({
      agent: {
        id: agent.id,
        email: agent.email,
        tier: agent.agent_tier,
        referralCode: agent.agent_referral_code,
        subsActive: agent.agent_subs_active,
        subsAnnual: agent.agent_subs_annual,
        reservationsTotal: agent.agent_reservations_total,
        reservationsThisMonth: agent.agent_reservations_this_month,
        mrrResidual: agent.agent_mrr_residual
      },
      commissionRates: tierRates,
      monthlyMetrics: monthlyMetrics || {
        subs_new: 0,
        subs_active: 0,
        reservations_count: 0,
        commission_earned: 0,
        commission_paid: 0,
        sub_affiliate_commission: 0,
        bonus_commission: 0,
        total_earnings: 0
      },
      earnings: {
        frozen: totalFrozen,
        earned: totalEarned,
        paid: totalPaid,
        subAffiliates: subAffiliateEarnings,
        total: totalEarned + subAffiliateEarnings
      },
      tierProgress,
      challenges: challenges || [],
      activeBonuses: activeBonuses || [],
      subAffiliates: subAffiliates || [],
      nextTierInfo: nextTierReqs ? {
        tier: nextTier,
        requirements: nextTierReqs
      } : null
    })
  } catch (error) {
    console.error('Error fetching agent dashboard:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch dashboard' },
      { status: 500 }
    )
  }
}
