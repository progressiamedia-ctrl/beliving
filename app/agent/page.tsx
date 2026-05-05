'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'

type AgentTab = 'resumen' | 'desafios' | 'subaff' | 'earnings' | 'config'

interface CommissionRates {
  tier: number
  subs_monthly_pct: number
  subs_annual_pct: number
  reservation_pct: number
  sub_affiliate_pct: number
}

interface MonthlyMetrics {
  subs_new: number
  subs_active: number
  reservations_count: number
  commission_earned: number
  commission_paid: number
  sub_affiliate_commission: number
  bonus_commission: number
  total_earnings: number
}

interface Challenge {
  id: string
  challenge_id: string
  subs_count: number
  reservations_count: number
  interactions_count: number
  completed: boolean
  prize_amount: number
  challenge: {
    challenge_type: string
    challenge_name: string
    challenge_description: string
  }
}

interface Bonus {
  id: string
  bonus_type: string
  bonus_label: string
  bonus_pct_subs: number
  bonus_pct_reservations: number
  expires_at: string
}

interface SubAffiliate {
  id: string
  referred_agent_id: string
  referred: { email: string }
  lifetime_commission_earned: number
  is_active: boolean
}

interface DashboardData {
  agent: {
    id: string
    email: string
    tier: number
    referralCode: string
    subsActive: number
    subsAnnual: number
    reservationsTotal: number
    reservationsThisMonth: number
    mrrResidual: number
  }
  commissionRates: CommissionRates | null
  monthlyMetrics: MonthlyMetrics
  earnings: {
    frozen: number
    earned: number
    paid: number
    subAffiliates: number
    total: number
  }
  tierProgress: {
    subsProgress: number
    subsRequired: number
    reservationsProgress: number
    reservationsRequired: number
  }
  challenges: Challenge[]
  activeBonuses: Bonus[]
  subAffiliates: SubAffiliate[]
  nextTierInfo: {
    tier: number
    requirements: {
      tier: number
      min_subs_cumulative: number
      min_reservations_per_month: number
    }
  } | null
}

const TIER_INFO = {
  0: { name: '🎯 Iniciante', color: 'from-blue-500 to-cyan-500' },
  1: { name: '⭐ Especialista', color: 'from-purple-500 to-pink-500' },
  2: { name: '💼 Profesional', color: 'from-amber-500 to-orange-500' },
  3: { name: '🔥 Experto', color: 'from-red-500 to-rose-500' },
  4: { name: '👑 Elite', color: 'from-yellow-500 to-amber-500' },
  5: { name: '💎 Supremo', color: 'from-purple-600 to-purple-400' }
}

export default function AgentDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<AgentTab>('resumen')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)

  const fetchDashboard = useCallback(async (agentId: string) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/agent/dashboard?agent_id=${agentId}`, {
        headers: {
          'Authorization': `Bearer ${agentId}`
        }
      })
      if (res.ok) {
        const dashboardData = await res.json()
        setData(dashboardData)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const role = localStorage.getItem('userRole')
    const storedUserId = localStorage.getItem('userId')

    if (role !== 'agent' || !storedUserId) {
      router.push('/')
      return
    }

    fetchDashboard(storedUserId)
  }, [router, fetchDashboard])

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <div className="w-12 h-12 border-4 border-yellow-400/30 border-t-yellow-400 rounded-full"></div>
          </div>
          <p className="text-gray-400">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  const tierData = TIER_INFO[data.agent.tier as keyof typeof TIER_INFO]
  const nextTier = data.nextTierInfo?.tier || 5
  const nextTierData = TIER_INFO[nextTier as keyof typeof TIER_INFO]

  const subsProgress = data.tierProgress.subsRequired > 0 ? (data.tierProgress.subsProgress / data.tierProgress.subsRequired) * 100 : 0
  const resProgress = data.tierProgress.reservationsRequired > 0 ? (data.tierProgress.reservationsProgress / data.tierProgress.reservationsRequired) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* TIER HERO CARD */}
        <div className={`bg-gradient-to-r ${tierData.color} rounded-2xl p-8 mb-8 shadow-2xl relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-white/80 mb-1">Tu Tier Actual</p>
                <h1 className="text-4xl font-bold">{tierData.name}</h1>
              </div>
              <div className="text-6xl opacity-20">✨</div>
            </div>
            {data.agent.tier < 5 && (
              <p className="text-white/90 text-sm">
                Falta {data.tierProgress.subsRequired - data.tierProgress.subsProgress} suscripciones y{' '}
                {data.tierProgress.reservationsRequired - data.tierProgress.reservationsProgress} reservas para{' '}
                {nextTierData.name}
              </p>
            )}
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Ingresos Este Mes */}
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 hover:border-yellow-500/50 transition">
            <p className="text-gray-400 text-sm mb-2">Este Mes</p>
            <h3 className="text-3xl font-bold text-yellow-400">
              ${data.monthlyMetrics?.commission_earned?.toFixed(2) || '0.00'}
            </h3>
            <div className="mt-4 text-xs text-gray-500">
              <p>Suscripciones: ${((data.monthlyMetrics?.commission_earned || 0) * 0.6).toFixed(2)}</p>
              <p>Reservas: ${((data.monthlyMetrics?.commission_earned || 0) * 0.4).toFixed(2)}</p>
            </div>
          </div>

          {/* Total de Vida */}
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 hover:border-purple-500/50 transition">
            <p className="text-gray-400 text-sm mb-2">Total de Vida</p>
            <h3 className="text-3xl font-bold text-purple-400">
              ${data.earnings.total?.toFixed(2) || '0.00'}
            </h3>
            <div className="mt-4 text-xs text-gray-500">
              <p>Ganado: ${data.earnings.earned?.toFixed(2) || '0.00'}</p>
              <p>Congelado: ${data.earnings.frozen?.toFixed(2) || '0.00'}</p>
            </div>
          </div>

          {/* Comisión Actual */}
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 hover:border-green-500/50 transition">
            <p className="text-gray-400 text-sm mb-2">Comisión Actual</p>
            <h3 className="text-3xl font-bold text-green-400">{data.commissionRates?.reservation_pct}%</h3>
            <div className="mt-4 text-xs text-gray-500">
              <p>Reservas: {data.commissionRates?.reservation_pct}%</p>
              <p>Suscripciones: {data.commissionRates?.subs_monthly_pct}%</p>
            </div>
          </div>
        </div>

        {/* PROGRESS BARS */}
        {data.agent.tier < 5 && (
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold mb-6">Progreso hacia {nextTierData.name}</h3>
            <div className="space-y-6">
              {/* Suscripciones */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Suscripciones</span>
                  <span className="text-sm font-semibold text-yellow-400">
                    {data.tierProgress.subsProgress}/{data.tierProgress.subsRequired}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-yellow-400 to-amber-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(subsProgress, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {data.tierProgress.subsRequired - data.tierProgress.subsProgress} más needed
                </p>
              </div>

              {/* Reservas */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Reservas Este Mes</span>
                  <span className="text-sm font-semibold text-blue-400">
                    {data.tierProgress.reservationsProgress}/{data.tierProgress.reservationsRequired}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-400 to-cyan-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(resProgress, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {data.tierProgress.reservationsRequired - data.tierProgress.reservationsProgress} más needed
                </p>
              </div>
            </div>
          </div>
        )}

        {/* NAVEGACIÓN DE TABS */}
        <div className="flex gap-4 mb-8 border-b border-gray-700">
          {([
            { id: 'resumen' as AgentTab, label: '📊 Resumen', icon: '' },
            { id: 'desafios' as AgentTab, label: '🏆 Desafíos', icon: '' },
            ...(data.agent.tier >= 4 ? [{ id: 'subaff' as AgentTab, label: '👥 Sub-Afiliados', icon: '' }] : []),
            { id: 'earnings' as AgentTab, label: '💰 Earnings', icon: '' },
            { id: 'config' as AgentTab, label: '⚙️ Configuración', icon: '' }
          ] as const).map((tab: { id: AgentTab; label: string; icon: string }) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-medium transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'text-yellow-400 border-yellow-400'
                    : 'text-gray-400 border-transparent hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
        </div>

        {/* TAB CONTENT */}
        <div className="min-h-96">
          {/* RESUMEN */}
          {activeTab === 'resumen' && (
            <div className="space-y-6">
              {/* Earnings Breakdown */}
              <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Desglose de Ingresos</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <span className="text-gray-400">Comisión Suscripciones</span>
                    <span className="font-semibold text-yellow-400">
                      ${((data.monthlyMetrics?.commission_earned || 0) * 0.6).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <span className="text-gray-400">Comisión Reservas</span>
                    <span className="font-semibold text-blue-400">
                      ${((data.monthlyMetrics?.commission_earned || 0) * 0.4).toFixed(2)}
                    </span>
                  </div>
                  {data.agent.tier >= 4 && (
                    <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <span className="text-gray-400">Sub-Afiliados</span>
                      <span className="font-semibold text-purple-400">
                        ${data.earnings.subAffiliates?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Activos */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-4">
                  <p className="text-gray-400 text-sm">Suscripciones Activas</p>
                  <p className="text-2xl font-bold text-yellow-400">{data.agent.subsActive}</p>
                </div>
                <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-4">
                  <p className="text-gray-400 text-sm">Reservas Este Mes</p>
                  <p className="text-2xl font-bold text-blue-400">{data.agent.reservationsThisMonth}</p>
                </div>
              </div>
            </div>
          )}

          {/* DESAFÍOS */}
          {activeTab === 'desafios' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.challenges && data.challenges.length > 0 ? (
                data.challenges.map((challenge: { id: string; challenge?: { challenge_name: string }; completed: boolean; prize_amount: number }) => (
                  <div
                    key={challenge.id}
                    className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 hover:border-yellow-500/50 transition"
                  >
                    <h4 className="font-semibold mb-3">{challenge.challenge?.challenge_name}</h4>
                    <div className="text-xs text-gray-400 space-y-2 mb-4">
                      <p>Progreso: {challenge.completed ? '✅ Completado' : '⏳ En Progreso'}</p>
                    </div>
                    {challenge.prize_amount > 0 && (
                      <p className="text-sm font-semibold text-yellow-400">Prize: ${challenge.prize_amount.toFixed(2)}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-400">No hay desafíos disponibles este mes</p>
              )}
            </div>
          )}

          {/* SUB-AFILIADOS */}
          {activeTab === 'subaff' && data.agent.tier >= 4 && (
            <div className="space-y-4">
              {data.subAffiliates && data.subAffiliates.length > 0 ? (
                <>
                  <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-semibold mb-4">Tu Equipo de Sub-Afiliados</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-gray-400 text-sm">Total de Agentes</p>
                        <p className="text-2xl font-bold text-purple-400">{data.subAffiliates.length}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Comisión Ganada</p>
                        <p className="text-2xl font-bold text-yellow-400">
                          ${data.subAffiliates
                            .reduce((sum: number, s: { lifetime_commission_earned?: number; id: string }) => sum + (s.lifetime_commission_earned || 0), 0)
                            .toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Team Leader</p>
                        <p className="text-2xl font-bold text-green-400">{data.subAffiliates.length >= 10 ? '✓' : '-'}</p>
                      </div>
                    </div>
                  </div>

                  {data.subAffiliates.map((sub: { id: string; referred_user?: { email: string; agent_tier: number }; lifetime_commission_earned?: number }) => (
                    <div key={sub.id} className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-200">{sub.referred_user?.email}</p>
                          <p className="text-xs text-gray-500">Tier {sub.referred_user?.agent_tier}</p>
                        </div>
                        <p className="font-bold text-yellow-400">${sub.lifetime_commission_earned?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-gray-400">Aún no tienes sub-afiliados. ¡Comienza a referir agentes!</p>
              )}
            </div>
          )}

          {/* EARNINGS */}
          {activeTab === 'earnings' && (
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-6">Historial de Earnings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                  <span className="text-gray-400">Ganado Este Mes</span>
                  <span className="font-bold text-yellow-400">${data.monthlyMetrics?.commission_earned?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                  <span className="text-gray-400">Pagado</span>
                  <span className="font-bold text-green-400">${data.earnings.paid?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                  <span className="text-gray-400">Congelado (Período de Cancelación)</span>
                  <span className="font-bold text-orange-400">${data.earnings.frozen?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>
          )}

          {/* CONFIGURACIÓN */}
          {activeTab === 'config' && (
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 space-y-6">
              <div>
                <p className="text-gray-400 text-sm mb-2">Tu Código de Referido</p>
                <div className="flex items-center gap-2 bg-gray-700/30 rounded-lg p-4">
                  <code className="font-mono text-yellow-400 font-bold text-lg">{data.agent.referralCode}</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(data.agent.referralCode)
                    }}
                    className="ml-auto px-3 py-1 bg-yellow-500 text-black text-sm font-medium rounded hover:bg-yellow-400 transition"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-2">Links de Referencia</p>
                <div className="space-y-2">
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Para Hosts</p>
                    <code className="text-blue-400 text-sm break-all">
                      {typeof window !== 'undefined' && `${window.location.origin}/ref/${data.agent.referralCode}?type=host`}
                    </code>
                  </div>
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Para Guests</p>
                    <code className="text-purple-400 text-sm break-all">
                      {typeof window !== 'undefined' && `${window.location.origin}/ref/${data.agent.referralCode}?type=guest`}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
