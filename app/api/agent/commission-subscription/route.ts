import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface CommissionRequest {
  agentId: string
  hostId: string
  subscriptionId: string
  subscriptionType: 'monthly' | 'annual' // 'monthly' | 'annual'
  amount: number // Total de suscripción ($19.99 o $254.88)
}

export async function POST(request: NextRequest) {
  try {
    const body: CommissionRequest = await request.json()

    if (!body.agentId || !body.subscriptionId || !body.amount) {
      return NextResponse.json(
        { error: 'agentId, subscriptionId, amount required' },
        { status: 400 }
      )
    }

    // 1. Obtener datos del agente
    const { data: agent, error: agentError } = await supabase
      .from('users')
      .select('agent_tier')
      .eq('id', body.agentId)
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // 2. Obtener tasa de comisión
    const { data: tierRates } = await supabase
      .from('tier_commission_rates')
      .select('subs_monthly_pct, subs_annual_pct')
      .eq('tier', agent.agent_tier)
      .single()

    if (!tierRates) {
      return NextResponse.json({ error: 'Tier rates not found' }, { status: 404 })
    }

    const commissionPct =
      body.subscriptionType === 'monthly'
        ? tierRates.subs_monthly_pct
        : tierRates.subs_annual_pct

    const commissionAmount = (body.amount * commissionPct) / 100

    // 3. Calcular fecha de descongelación
    const freezePeriodDays = body.subscriptionType === 'monthly' ? 7 : 15
    const freezeUntil = new Date()
    freezeUntil.setDate(freezeUntil.getDate() + freezePeriodDays)

    // 4. Crear comisión congelada
    const { data: frozenCommission, error: freezeError } = await supabase
      .from('frozen_commissions')
      .insert([
        {
          agent_id: body.agentId,
          subscription_id: body.subscriptionId,
          subscription_type: body.subscriptionType,
          amount: commissionAmount,
          freeze_until: freezeUntil.toISOString(),
          status: 'frozen'
        }
      ])
      .select()
      .single()

    if (freezeError) {
      console.error('Error creating frozen commission:', freezeError)
      return NextResponse.json(
        { error: 'Failed to create frozen commission' },
        { status: 500 }
      )
    }

    // 5. Crear registro en historial con status 'frozen'
    const { error: historyError } = await supabase
      .from('commission_history')
      .insert([
        {
          agent_id: body.agentId,
          commission_type:
            body.subscriptionType === 'monthly'
              ? 'subscription_monthly'
              : 'subscription_annual',
          source_id: body.subscriptionId,
          amount: commissionAmount,
          tier: agent.agent_tier,
          commission_pct: commissionPct,
          status: 'frozen',
          earned_at: null
        }
      ])

    if (historyError) {
      console.error('Error creating commission history:', historyError)
    }

    // 6. Actualizar métricas del agente
    const { data: currentAgent } = await supabase
      .from('users')
      .select('agent_subs_active, agent_subs_annual, agent_mrr_residual')
      .eq('id', body.agentId)
      .single()

    const updateData: Record<string, any> = {
      agent_mrr_residual: (currentAgent?.agent_mrr_residual || 0) + body.amount * (commissionPct / 100)
    }

    if (body.subscriptionType === 'monthly') {
      updateData.agent_subs_active = (currentAgent?.agent_subs_active || 0) + 1
    } else {
      updateData.agent_subs_annual = (currentAgent?.agent_subs_annual || 0) + 1
    }

    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', body.agentId)

    if (updateError) {
      console.error('Error updating agent metrics:', updateError)
    }

    return NextResponse.json({
      success: true,
      commission: {
        id: frozenCommission.id,
        amount: commissionAmount,
        status: 'frozen',
        freezeUntil: freezeUntil.toISOString(),
        freezePeriodDays,
        willUnfreezeAt: new Date(freezeUntil.toISOString()).toLocaleDateString('es-ES')
      },
      message: `Comisión de $${commissionAmount.toFixed(2)} congelada por ${freezePeriodDays} días`
    })
  } catch (error) {
    console.error('Error processing subscription commission:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process commission' },
      { status: 500 }
    )
  }
}
