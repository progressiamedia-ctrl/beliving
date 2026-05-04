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
    const period = searchParams.get('period') || 'month' // 'month', 'quarter', 'year'

    if (!agentId) {
      return NextResponse.json({ error: 'agent_id required' }, { status: 400 })
    }

    // Obtener datos del agente
    const { data: agent } = await supabase
      .from('users')
      .select('agent_tier, agent_subs_active, agent_reservations_this_month')
      .eq('id', agentId)
      .single()

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Calcular rango de fechas
    const now = new Date()
    let dateFrom: Date
    let monthYear: string

    monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    switch (period) {
      case 'quarter':
        dateFrom = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
        break
      case 'year':
        dateFrom = new Date(now.getFullYear(), 0, 1)
        break
      case 'month':
      default:
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1)
        break
    }

    // 1. Comisiones de suscripción congeladas
    const { data: frozenSubs } = await supabase
      .from('frozen_commissions')
      .select('amount')
      .eq('agent_id', agentId)
      .eq('subscription_type', 'monthly')
      .eq('status', 'frozen')

    const frozenSubsTotal = frozenSubs?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0

    // 2. Comisiones por reservas (ganadas)
    const { data: reservationCommissions } = await supabase
      .from('commission_history')
      .select('amount, commission_type, earned_at')
      .eq('agent_id', agentId)
      .eq('commission_type', 'reservation')
      .eq('status', 'earned')
      .gte('earned_at', dateFrom.toISOString())

    const reservationTotal = reservationCommissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0

    // 3. Comisiones por suscripción anual (one-time)
    const { data: annualSubsCommissions } = await supabase
      .from('commission_history')
      .select('amount, earned_at')
      .eq('agent_id', agentId)
      .eq('commission_type', 'subscription_annual')
      .eq('status', 'earned')
      .gte('earned_at', dateFrom.toISOString())

    const annualSubsTotal = annualSubsCommissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0

    // 4. Comisiones de sub-afiliados
    const { data: subAffiliateCommissions } = await supabase
      .from('sub_affiliate_commissions')
      .select('amount, earned_at')
      .eq('referrer_agent_id', agentId)
      .eq('status', 'earned')
      .gte('earned_at', dateFrom.toISOString())

    const subAffiliateTotal = subAffiliateCommissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0

    // 5. Bonificaciones
    const { data: bonusCommissions } = await supabase
      .from('commission_history')
      .select('amount, earned_at')
      .eq('agent_id', agentId)
      .eq('commission_type', 'challenge_bonus')
      .eq('status', 'earned')
      .gte('earned_at', dateFrom.toISOString())

    const bonusTotal = bonusCommissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0

    // 6. Comisiones pagadas
    const { data: paidCommissions } = await supabase
      .from('commission_history')
      .select('amount, paid_at')
      .eq('agent_id', agentId)
      .eq('status', 'paid')
      .gte('paid_at', dateFrom.toISOString())

    const paidTotal = paidCommissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0

    // 7. Proyección para el mes/período
    const daysInPeriod = Math.ceil((now.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24))
    const daysRemaining = period === 'month' ? 30 - daysInPeriod : 0

    const projectedEarnings = period === 'month' && daysRemaining > 0
      ? {
          monthly: {
            projectedTotal: (reservationTotal / daysInPeriod) * 30,
            confidence: daysInPeriod >= 15 ? 0.9 : 0.6
          }
        }
      : {}

    // 8. Desglose por tipo
    const breakdown = {
      subscriptions: {
        monthly: frozenSubsTotal, // Congelado
        annual: annualSubsTotal, // Ganado
        total: frozenSubsTotal + annualSubsTotal
      },
      reservations: reservationTotal,
      subAffiliates: subAffiliateTotal,
      bonuses: bonusTotal,
      total: reservationTotal + annualSubsTotal + subAffiliateTotal + bonusTotal,
      frozen: frozenSubsTotal,
      paid: paidTotal
    }

    // 9. Histórico mensual (últimos 6 meses)
    const monthlyHistory = []
    for (let i = 0; i < 6; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`

      const { data: metrics } = await supabase
        .from('agent_monthly_metrics')
        .select('*')
        .eq('agent_id', agentId)
        .eq('month_year', monthStr)
        .single()

      if (metrics) {
        monthlyHistory.unshift({
          month: monthStr,
          earned: metrics.commission_earned || 0,
          paid: metrics.commission_paid || 0,
          subAffiliates: metrics.sub_affiliate_commission || 0,
          bonuses: metrics.bonus_commission || 0,
          total: metrics.total_earnings || 0
        })
      }
    }

    return NextResponse.json({
      period,
      agentTier: agent.agent_tier,
      breakdown,
      monthlyHistory,
      projections: projectedEarnings,
      stats: {
        avgMonthlyEarnings: monthlyHistory.length > 0
          ? monthlyHistory.reduce((sum, m) => sum + m.total, 0) / monthlyHistory.length
          : 0,
        bestMonth: monthlyHistory.length > 0
          ? monthlyHistory.reduce((max, m) => m.total > max.total ? m : max)
          : null
      }
    })
  } catch (error) {
    console.error('Error fetching earnings:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch earnings' },
      { status: 500 }
    )
  }
}
