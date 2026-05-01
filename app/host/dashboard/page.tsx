'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { getBookingsByHost, Booking } from '@/lib/booking-utils'
import { supabase } from '@/lib/supabase'

interface Property {
  id: string
  title: string
  location: string
  price_per_night?: number
  price?: number
  amenities?: string[]
}

export default function HostDashboard() {
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'month' | '3months' | 'year'>('month')

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    const userRole = localStorage.getItem('userRole')

    if (!userId || userRole !== 'host') {
      router.push('/')
      return
    }

    loadData(userId)
  }, [router])

  const loadData = async (userId: string) => {
    try {
      const [propsRes, bookingsData] = await Promise.all([
        supabase.from('properties').select('*').eq('host_id', userId),
        getBookingsByHost(userId),
      ])

      setProperties(propsRes.data || [])
      setBookings(bookingsData)
    } catch (err) {
      console.error('Error loading dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter bookings by period
  const filteredBookings = bookings.filter(b => {
    const checkIn = new Date(b.check_in)
    const now = new Date()

    if (period === 'month') {
      return checkIn.getMonth() === now.getMonth() && checkIn.getFullYear() === now.getFullYear()
    }
    if (period === '3months') {
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)
      return checkIn >= threeMonthsAgo
    }
    return checkIn.getFullYear() === now.getFullYear()
  })

  // Calculate KPIs
  const confirmedRevenue = filteredBookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + b.total_price, 0)
  const confirmedCount = filteredBookings.filter(b => b.status === 'confirmed').length
  const pendingCount = bookings.filter(b => b.status === 'pending').length
  const cancelledCount = filteredBookings.filter(b => b.status === 'cancelled').length
  const totalCount = filteredBookings.length

  // Monthly data for chart (last 6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - (5 - i))
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('es-ES', { month: 'short' })
    const revenue = bookings
      .filter(b => b.status === 'confirmed' && b.check_in.startsWith(key))
      .reduce((sum, b) => sum + b.total_price, 0)
    return { key, label, revenue }
  })
  const maxRevenue = Math.max(...monthlyData.map(m => m.revenue), 1)

  // Per-property stats
  const propStats: Record<string, { revenue: number; bookings: number }> = {}
  bookings.forEach(b => {
    if (!propStats[b.property_id]) propStats[b.property_id] = { revenue: 0, bookings: 0 }
    if (b.status === 'confirmed') propStats[b.property_id].revenue += b.total_price
    propStats[b.property_id].bookings++
  })

  // Recent bookings (last 5)
  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  const getPropertyTitle = (propertyId: string) => {
    return properties.find(p => p.id === propertyId)?.title || 'Propiedad'
  }

  const handleDelete = async (propertyId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta propiedad?')) return
    try {
      await supabase.from('properties').delete().eq('id', propertyId)
      setProperties(prev => prev.filter(p => p.id !== propertyId))
    } catch (err) {
      console.error('Error deleting property:', err)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('userId')
    localStorage.removeItem('userRole')
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Header title="Be Living - Host" showThemeToggle={true} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-600 dark:text-gray-400">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header title="Be Living - Host" showThemeToggle={true} />

      {/* Sticky nav */}
      <nav className="sticky top-16 z-40 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between gap-4" aria-label="Acciones del dashboard">
        <button onClick={handleLogout} aria-label="Cerrar sesión" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition">
          Salir
        </button>
        <div className="flex gap-3">
          <Link href="/host/bookings" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition" aria-label="Ver todas las reservas">
            Ver reservas →
          </Link>
          <Link href="/host/properties/new" className="text-sm px-3 py-1 bg-black dark:bg-white text-white dark:text-black rounded hover:bg-gray-800 dark:hover:bg-gray-200 transition" aria-label="Crear una nueva propiedad">
            + Nueva propiedad
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Title and Period Selector */}
        <div className="mb-8">
          <h1 className="text-4xl font-light text-black dark:text-white mb-4">Host Dashboard</h1>
          <div className="flex gap-2" role="group" aria-label="Seleccionar período de datos">
            {(['month', '3months', 'year'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                aria-current={period === p ? 'true' : undefined}
                className={`px-4 py-2 text-sm rounded-lg transition ${
                  period === p
                    ? 'bg-black dark:bg-white text-white dark:text-black'
                    : 'border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-black dark:hover:border-white'
                }`}
              >
                {p === 'month' ? 'Este mes' : p === '3months' ? 'Últimos 3 meses' : 'Este año'}
              </button>
            ))}
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="border border-black dark:border-white rounded-lg p-4" aria-label={`Total de ingresos: ${confirmedRevenue.toFixed(0)} dólares`}>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Ingresos</p>
            <p className="text-3xl font-light text-black dark:text-white">${confirmedRevenue.toFixed(0)}</p>
          </div>
          <div className="border border-green-300 dark:border-green-700 rounded-lg p-4 bg-green-50 dark:bg-green-900/20" aria-label={`Reservas confirmadas: ${confirmedCount}`}>
            <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-2">Confirmadas</p>
            <p className="text-3xl font-light text-green-900 dark:text-green-100">{confirmedCount}</p>
          </div>
          <div className="border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/20" aria-label={`Reservas pendientes: ${pendingCount}`}>
            <p className="text-xs font-medium text-yellow-700 dark:text-yellow-300 mb-2">Pendientes</p>
            <p className="text-3xl font-light text-yellow-900 dark:text-yellow-100">{pendingCount}</p>
          </div>
          <div className="border border-blue-300 dark:border-blue-700 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20" aria-label={`Total de propiedades: ${properties.length}`}>
            <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">Propiedades</p>
            <p className="text-3xl font-light text-blue-900 dark:text-blue-100">{properties.length}</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-black dark:text-white mb-6">Ingresos — Últimos 6 meses</h2>
            <div className="flex items-end gap-1.5 h-36 pt-4" role="img" aria-label={`Gráfico de ingresos: ${monthlyData.map(m => `${m.label}: $${m.revenue.toFixed(0)}`).join(', ')}`}>
              {monthlyData.map(m => (
                <div key={m.key} className="flex-1 flex flex-col items-center gap-1">
                  {m.revenue > 0 && (
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      ${m.revenue >= 1000 ? `${(m.revenue / 1000).toFixed(1)}k` : m.revenue.toFixed(0)}
                    </span>
                  )}
                  <div className="w-full flex-1 flex items-end justify-center">
                    <div
                      className="w-3/4 bg-black dark:bg-white rounded-t-sm transition-all duration-700"
                      style={{
                        height: `${(m.revenue / maxRevenue) * 100}%`,
                        minHeight: m.revenue > 0 ? '4px' : '0',
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 capitalize">{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status Distribution */}
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-black dark:text-white mb-6">Estado de Reservas</h2>
            <div className="space-y-4" role="region" aria-label={`Distribución de reservas: Confirmadas ${confirmedCount}, Pendientes ${pendingCount}, Canceladas ${cancelledCount}`}>
              {[
                { label: 'Confirmadas', count: confirmedCount, color: 'bg-green-500' },
                { label: 'Pendientes', count: pendingCount, color: 'bg-yellow-400' },
                { label: 'Canceladas', count: cancelledCount, color: 'bg-red-500' },
              ].map(({ label, count, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">{label}</span>
                    <span className="font-medium text-black dark:text-white">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} rounded-full transition-all duration-700`}
                      style={{ width: totalCount > 0 ? `${(count / totalCount) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Bookings */}
        {recentBookings.length > 0 && (
          <div className="mb-12">
            <h2 className="text-lg font-semibold text-black dark:text-white mb-4">Últimas Reservas</h2>
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
              <table className="w-full" aria-label="Tabla de últimas reservas con información de propiedad, huésped, fechas y estado">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 dark:text-gray-400">Propiedad</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 dark:text-gray-400">Huésped</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 dark:text-gray-400">Check-in</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 dark:text-gray-400">Noches</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-600 dark:text-gray-400">Total</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-600 dark:text-gray-400">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map(b => (
                    <tr key={b.id} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition">
                      <td className="px-6 py-3 text-sm text-black dark:text-white">{getPropertyTitle(b.property_id)}</td>
                      <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">{b.guest_name}</td>
                      <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(b.check_in).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">{b.nights}</td>
                      <td className="px-6 py-3 text-sm font-medium text-right text-black dark:text-white">${b.total_price.toFixed(0)}</td>
                      <td className="px-6 py-3 text-right">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          b.status === 'confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : b.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        }`} aria-label={`Estado de reserva: ${b.status === 'confirmed' ? 'Confirmada' : b.status === 'pending' ? 'Pendiente' : 'Cancelada'}`}>
                          {b.status === 'confirmed' ? 'Confirmada' : b.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Properties */}
        {properties.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            <div className="text-5xl mb-4">🏠</div>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">Aún no tienes propiedades</p>
            <Link
              href="/host/properties/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition"
            >
              <span>+</span> Crear la primera
            </Link>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold text-black dark:text-white mb-4">Mis Propiedades</h2>
            <div className="space-y-4">
              {properties.map(property => {
                const stats = propStats[property.id] || { revenue: 0, bookings: 0 }
                return (
                  <div key={property.id} className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="md:col-span-2">
                        <h3 className="text-lg font-semibold text-black dark:text-white mb-1">{property.title}</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">📍 {property.location}</p>
                        <p className="text-black dark:text-white font-semibold">${property.price_per_night || property.price}/noche</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3">
                          <p className="text-blue-600 dark:text-blue-400 text-xs font-medium">Ingresos</p>
                          <p className="text-xl font-light text-blue-900 dark:text-blue-100">${stats.revenue}</p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 rounded p-3">
                          <p className="text-green-600 dark:text-green-400 text-xs font-medium">Reservas</p>
                          <p className="text-xl font-light text-green-900 dark:text-green-100">{stats.bookings}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Link
                          href={`/host/properties/${property.id}/edit`}
                          className="px-4 py-2 border border-black dark:border-white text-black dark:text-white rounded-lg hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors text-sm font-medium"
                          aria-label={`Editar propiedad ${property.title}`}
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleDelete(property.id)}
                          aria-label={`Eliminar propiedad ${property.title}`}
                          className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors text-sm font-medium"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
