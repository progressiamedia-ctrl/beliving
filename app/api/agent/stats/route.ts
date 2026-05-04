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

    if (!agentId) {
      return NextResponse.json({ error: 'agent_id is required' }, { status: 400 })
    }

    // Get commission summary
    const { data: summary } = await supabase
      .from('agent_commission_summary')
      .select('*')
      .eq('agent_id', agentId)
      .single()

    // Get top hosts by commission
    const { data: topHosts } = await supabase
      .from('agent_host_referrals')
      .select('host_id, agent_host_referrals(*), users:host_id(email, first_name)')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(5)

    // Get top guests by commission
    const { data: topGuests } = await supabase
      .from('agent_guest_referrals')
      .select('guest_id, agent_guest_referrals(*), users:guest_id(email, first_name)')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(5)

    // Get monthly commission breakdown (last 6 months)
    const { data: monthlyCommissions } = await supabase
      .from('agent_commissions')
      .select('commission_amount, created_at')
      .eq('agent_id', agentId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    // Group by month
    const monthlyData: Record<string, number> = {}
    monthlyCommissions?.forEach(c => {
      const date = new Date(c.created_at)
      const monthKey = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short' })
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + c.commission_amount
    })

    return NextResponse.json({
      summary,
      topHosts: topHosts || [],
      topGuests: topGuests || [],
      monthlyBreakdown: monthlyData
    })
  } catch (error) {
    console.error('Agent stats error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
