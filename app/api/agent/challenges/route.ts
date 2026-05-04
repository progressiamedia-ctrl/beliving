import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: Obtener desafíos del agente para este mes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agent_id')

    if (!agentId) {
      return NextResponse.json({ error: 'agent_id required' }, { status: 400 })
    }

    // Obtener mes actual
    const now = new Date()
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    // Obtener tier del agente
    const { data: agent } = await supabase
      .from('users')
      .select('agent_tier')
      .eq('id', agentId)
      .single()

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Obtener desafíos activos del mes
    const { data: challenges } = await supabase
      .from('monthly_challenges')
      .select('*')
      .eq('month_year', monthYear)
      .eq('is_active', true)

    // Obtener requisitos por tier
    const challengeRequirements: Record<string, any> = {}

    for (const challenge of challenges || []) {
      const { data: reqs } = await supabase
        .from('challenge_tier_requirements')
        .select('*')
        .eq('challenge_id', challenge.id)
        .eq('tier', agent.agent_tier)
        .single()

      challengeRequirements[challenge.id] = reqs
    }

    // Obtener progreso del agente
    const { data: progress } = await supabase
      .from('agent_challenge_progress')
      .select('*')
      .eq('agent_id', agentId)
      .in('challenge_id', challenges?.map(c => c.id) || [])

    return NextResponse.json({
      monthYear,
      agentTier: agent.agent_tier,
      challenges: challenges || [],
      requirements: challengeRequirements,
      progress: progress || []
    })
  } catch (error) {
    console.error('Error fetching challenges:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch challenges' },
      { status: 500 }
    )
  }
}

// POST: Crear desafíos para el mes (admin only)
interface CreateChallengesRequest {
  challenges: Array<{
    type: 'triple_threat' | 'host_magnet' | 'booking_blitz'
    name: string
    description?: string
  }>
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateChallengesRequest = await request.json()

    if (!body.challenges || body.challenges.length === 0) {
      return NextResponse.json(
        { error: 'challenges array required' },
        { status: 400 }
      )
    }

    const now = new Date()
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      '0'
    )}`

    const createdChallenges = []

    for (const challenge of body.challenges) {
      const { data: created, error: createError } = await supabase
        .from('monthly_challenges')
        .insert([
          {
            challenge_type: challenge.type,
            challenge_name: challenge.name,
            challenge_description: challenge.description || '',
            month_year: monthYear,
            is_active: true
          }
        ])
        .select()
        .single()

      if (!createError && created) {
        // Crear requisitos para cada tier
        const tierRequirements = [
          { tier: 0, subs: 10, res: 15, interactions: 20, prize_cash: 0, prize_bonus: 1.5, prize_days: 30 },
          { tier: 1, subs: 10, res: 15, interactions: 20, prize_cash: 0, prize_bonus: 1.5, prize_days: 30 },
          { tier: 2, subs: 25, res: 30, interactions: 50, prize_cash: 50, prize_bonus: 1.5, prize_days: 30 },
          { tier: 3, subs: 50, res: 60, interactions: 100, prize_cash: 100, prize_bonus: 1.5, prize_days: 30 },
          { tier: 4, subs: 100, res: 100, interactions: 200, prize_cash: 200, prize_bonus: 1.5, prize_days: 30 },
          { tier: 5, subs: 150, res: 150, interactions: 300, prize_cash: 300, prize_bonus: 1.5, prize_days: 30 }
        ]

        // Ajustar requisitos por tipo de desafío
        const adjustedRequirements = tierRequirements.map(req => {
          if (challenge.type === 'host_magnet') {
            return { ...req, res: 0, interactions: 0, prize_bonus: 0, prize_cash: req.prize_cash * 1.5 }
          }
          if (challenge.type === 'booking_blitz') {
            return { ...req, subs: 0, interactions: 0, prize_bonus: 1.0 }
          }
          return req
        })

        for (const req of adjustedRequirements) {
          await supabase
            .from('challenge_tier_requirements')
            .insert([
              {
                challenge_id: created.id,
                tier: req.tier,
                subs_required: req.subs,
                reservations_required: req.res,
                interactions_required: req.interactions,
                prize_cash: req.prize_cash,
                prize_commission_bonus_pct: req.prize_bonus,
                prize_commission_days: req.prize_days,
                prize_description: `${challenge.name} - Tier ${req.tier}`
              }
            ])
        }

        createdChallenges.push(created)
      }
    }

    return NextResponse.json({
      success: true,
      monthYear,
      challenges: createdChallenges,
      message: `${createdChallenges.length} desafíos creados para ${monthYear}`
    })
  } catch (error) {
    console.error('Error creating challenges:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create challenges' },
      { status: 500 }
    )
  }
}
