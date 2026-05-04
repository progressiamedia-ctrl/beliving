import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Esta función corre cada hora para descongelar comisiones
// Puede ser llamada por un cron job externo (Vercel Crons, External API, etc)

export async function POST(request: NextRequest) {
  try {
    // Validar si viene del cron autorizado (opcional: agregar auth)
    const authHeader = request.headers.get('authorization')
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // 1. Encontrar comisiones congeladas que ya están listas para descongelar
    const { data: frozenCommissions, error: fetchError } = await supabase
      .from('frozen_commissions')
      .select('id, agent_id, amount, freeze_until')
      .eq('status', 'frozen')
      .lte('freeze_until', new Date().toISOString())

    if (fetchError) {
      console.error('Error fetching frozen commissions:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch frozen commissions' },
        { status: 500 }
      )
    }

    if (!frozenCommissions || frozenCommissions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No frozen commissions to unfreeze',
        unfrozen: 0
      })
    }

    // 2. Descongelar comisiones
    const { error: updateFrozenError } = await supabase
      .from('frozen_commissions')
      .update({
        status: 'earned',
        earned_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('status', 'frozen')
      .lte('freeze_until', new Date().toISOString())

    if (updateFrozenError) {
      console.error('Error unfreezing commissions:', updateFrozenError)
      return NextResponse.json(
        { error: 'Failed to unfreeze commissions' },
        { status: 500 }
      )
    }

    // 3. Actualizar historial de comisiones
    const { error: updateHistoryError } = await supabase
      .from('commission_history')
      .update({
        status: 'earned'
      })
      .eq('status', 'frozen')
      .lte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    if (updateHistoryError) {
      console.error('Error updating commission history:', updateHistoryError)
    }

    // 4. Actualizar métricas mensuales
    const now = new Date()
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    for (const commission of frozenCommissions) {
      const { data: existing } = await supabase
        .from('agent_monthly_metrics')
        .select('*')
        .eq('agent_id', commission.agent_id)
        .eq('month_year', monthYear)
        .single()

      if (existing) {
        await supabase
          .from('agent_monthly_metrics')
          .update({
            commission_earned: (existing.commission_earned || 0) + commission.amount,
            total_earnings: (existing.total_earnings || 0) + commission.amount,
            updated_at: new Date().toISOString()
          })
          .eq('agent_id', commission.agent_id)
          .eq('month_year', monthYear)
      } else {
        await supabase
          .from('agent_monthly_metrics')
          .insert([
            {
              agent_id: commission.agent_id,
              month_year: monthYear,
              commission_earned: commission.amount,
              total_earnings: commission.amount
            }
          ])
      }
    }

    return NextResponse.json({
      success: true,
      message: `${frozenCommissions.length} comisiones decongeladas`,
      unfrozen: frozenCommissions.length,
      totalAmount: frozenCommissions.reduce((sum, c) => sum + (c.amount || 0), 0)
    })
  } catch (error) {
    console.error('Error in unfreeze-commissions cron:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
