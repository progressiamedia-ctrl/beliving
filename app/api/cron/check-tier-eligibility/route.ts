import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Cron job que corre diariamente para verificar tier eligibility

export async function POST(request: NextRequest) {
  try {
    const tiersUpdated: any[] = []
    const tiersDowngraded: any[] = []

    // 1. Obtener todos los agentes activos
    const { data: agents } = await supabase
      .from('users')
      .select('id, agent_tier, agent_subs_active, agent_reservations_this_month, agent_reservations_total')
      .eq('user_type', 'agent')
      .eq('agent_enabled', true)

    if (!agents || agents.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No agents to check',
        updated: 0
      })
    }

    // 2. Obtener todos los requisitos de tier
    const { data: tierReqs } = await supabase
      .from('tier_requirements')
      .select('*')
      .order('tier', { ascending: true })

    const tierRequirementsMap = tierReqs?.reduce((acc: Record<number, any>, req) => {
      acc[req.tier] = req
      return acc
    }, {}) || {}

    // 3. Verificar cada agente
    for (const agent of agents) {
      const currentTier = agent.agent_tier || 0
      let newTier = currentTier

      // Verificar si puede subir de tier
      for (let tier = currentTier + 1; tier <= 5; tier++) {
        const requirements = tierRequirementsMap[tier]

        if (
          requirements &&
          agent.agent_subs_active >= requirements.min_subs_cumulative &&
          agent.agent_reservations_this_month >= requirements.min_reservations_per_month
        ) {
          newTier = tier
        } else {
          break // Si no cumple este tier, no puede cumplir los superiores
        }
      }

      // Si subió de tier
      if (newTier > currentTier) {
        const { error: updateError } = await supabase
          .from('users')
          .update({
            agent_tier: newTier,
            agent_last_tier_change: new Date().toISOString()
          })
          .eq('id', agent.id)

        if (!updateError) {
          // Registrar en tier_history
          await supabase
            .from('tier_history')
            .insert([
              {
                agent_id: agent.id,
                from_tier: currentTier,
                to_tier: newTier,
                reason: 'requirements_met',
                details: `Auto tier up: subs=${agent.agent_subs_active}, reservations=${agent.agent_reservations_this_month}`,
                changed_by: 'system'
              }
            ])

          // Crear bonus de tier up (5% bonus en ambas comisiones por 30 días)
          const expiresAt = new Date()
          expiresAt.setDate(expiresAt.getDate() + 30)

          await supabase
            .from('agent_active_bonuses')
            .insert([
              {
                agent_id: agent.id,
                bonus_type: 'tier_up',
                bonus_label: `🎉 Tier Up a ${newTier}`,
                bonus_pct_subs: 1.0,
                bonus_pct_reservations: 0.5,
                expires_at: expiresAt.toISOString()
              }
            ])

          tiersUpdated.push({
            agentId: agent.id,
            from: currentTier,
            to: newTier
          })
        }
      }

      // Verificar si debe bajar de tier (2 meses bajo requisitos)
      // Implementar después si es necesario
    }

    return NextResponse.json({
      success: true,
      message: `Tier check completado`,
      tiersUpdated: tiersUpdated.length,
      tiersDowngraded: tiersDowngraded.length,
      details: {
        updated: tiersUpdated,
        downgraded: tiersDowngraded
      }
    })
  } catch (error) {
    console.error('Error checking tier eligibility:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
