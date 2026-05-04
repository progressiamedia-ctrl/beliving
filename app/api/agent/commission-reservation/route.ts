import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ReservationCommissionRequest {
  bookingId: string
  guestId: string
  hostId: string
  propertyId: string
  totalPrice: number
  serviceFee: number // 10% máximo
  checkIn: string
  checkOut: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ReservationCommissionRequest = await request.json()

    if (!body.bookingId || !body.guestId || !body.serviceFee) {
      return NextResponse.json(
        { error: 'bookingId, guestId, serviceFee required' },
        { status: 400 }
      )
    }

    const commissionsCreated = []

    // 1. Verificar si el guest fue referido por un agente
    const { data: guest } = await supabase
      .from('users')
      .select('referred_by_agent_id')
      .eq('id', body.guestId)
      .single()

    if (guest?.referred_by_agent_id) {
      const agentId = guest.referred_by_agent_id

      // 2. Obtener tier del agente
      const { data: agent } = await supabase
        .from('users')
        .select('agent_tier')
        .eq('id', agentId)
        .single()

      if (agent) {
        // 3. Obtener comisión por reserva según tier
        const { data: tierRates } = await supabase
          .from('tier_commission_rates')
          .select('reservation_pct, sub_affiliate_pct')
          .eq('tier', agent.agent_tier)
          .single()

        if (tierRates) {
          const commissionAmount =
            (body.serviceFee * tierRates.reservation_pct) / 100

          // 4. Crear comisión en historial
          const { data: commission, error: commError } = await supabase
            .from('commission_history')
            .insert([
              {
                agent_id: agentId,
                commission_type: 'reservation',
                source_id: body.bookingId,
                amount: commissionAmount,
                tier: agent.agent_tier,
                commission_pct: tierRates.reservation_pct,
                status: 'earned',
                earned_at: new Date().toISOString()
              }
            ])
            .select()
            .single()

          if (!commError && commission) {
            commissionsCreated.push({
              agentId,
              amount: commissionAmount,
              type: 'reservation'
            })

            // 5. Actualizar métricas del agente
            const { data: currentUser } = await supabase
              .from('users')
              .select('agent_reservations_total, agent_reservations_this_month')
              .eq('id', agentId)
              .single()

            if (currentUser) {
              await supabase
                .from('users')
                .update({
                  agent_reservations_total: (currentUser.agent_reservations_total || 0) + 1,
                  agent_reservations_this_month: (currentUser.agent_reservations_this_month || 0) + 1
                })
                .eq('id', agentId)
            }

            // 6. Procesar sub-afiliados si agente es Tier 4+
            if (agent.agent_tier >= 4) {
              const { data: subAffiliates } = await supabase
                .from('agent_sub_affiliates')
                .select('*')
                .eq('referrer_agent_id', agentId)
                .eq('is_active', true) as any

              if (subAffiliates && subAffiliates.length > 0) {
                for (const subAff of subAffiliates) {
                  const subAffCommissionAmount =
                    (commissionAmount * subAff.sub_affiliate_commission_pct) / 100

                  // Crear comisión de sub-afiliado
                  const { error: subAffError } = await supabase
                    .from('sub_affiliate_commissions')
                    .insert([
                      {
                        sub_affiliate_id: subAff.id,
                        referrer_agent_id: agentId,
                        referred_agent_id: subAff.referred_agent_id,
                        original_commission_id: commission.id,
                        amount: subAffCommissionAmount,
                        commission_pct: subAff.sub_affiliate_commission_pct,
                        status: 'earned',
                        earned_at: new Date().toISOString()
                      }
                    ])

                  if (!subAffError) {
                    // Actualizar comisión lifetime del sub-afiliado
                    await supabase
                      .from('agent_sub_affiliates')
                      .update({
                        lifetime_commission_earned: (subAff.lifetime_commission_earned || 0) + subAffCommissionAmount
                      })
                      .eq('id', subAff.id)

                    commissionsCreated.push({
                      agentId: subAff.referred_agent_id,
                      amount: subAffCommissionAmount,
                      type: 'sub_affiliate',
                      fromAgent: agentId
                    })
                  }
                }
              }
            }
          }
        }
      }
    }

    // 7. Actualizar métricas mensuales
    const now = new Date()
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      '0'
    )}`

    for (const comm of commissionsCreated) {
      const { data: existing } = await supabase
        .from('agent_monthly_metrics')
        .select('*')
        .eq('agent_id', comm.agentId)
        .eq('month_year', monthYear)
        .single()

      if (existing) {
        await supabase
          .from('agent_monthly_metrics')
          .update({
            reservations_count: (existing.reservations_count || 0) + 1,
            commission_earned: (existing.commission_earned || 0) + comm.amount,
            total_earnings: (existing.total_earnings || 0) + comm.amount
          })
          .eq('agent_id', comm.agentId)
          .eq('month_year', monthYear)
      } else {
        await supabase
          .from('agent_monthly_metrics')
          .insert([
            {
              agent_id: comm.agentId,
              month_year: monthYear,
              reservations_count: 1,
              commission_earned: comm.amount,
              total_earnings: comm.amount
            }
          ])
      }
    }

    return NextResponse.json({
      success: true,
      commissionsCreated,
      message: `${commissionsCreated.length} comisión(es) registrada(s)`
    })
  } catch (error) {
    console.error('Error processing reservation commission:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process commission' },
      { status: 500 }
    )
  }
}
