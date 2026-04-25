'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { supabase } from '@/lib/supabase'

interface PropertyWithStats {
  id: string
  title: string
  location: string
  city?: string
  price_per_night?: number
  price?: number
  amenities?: string[]
  image?: string
  occupancy_rate?: number
  total_bookings?: number
  monthly_revenue?: number
}

export default function HostDashboard() {
  const router = useRouter()
  const [properties, setProperties] = useState<PropertyWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, occupancy: 0, revenue: 0 })

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    const userRole = localStorage.getItem('userRole')

    if (!userId || userRole !== 'host') {
      router.push('/')
      return
    }

    loadProperties(userId)
  }, [router])

  const loadProperties = async (hostId: string) => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('host_id', hostId)

      if (error) throw error

      // Añadir estadísticas simuladas a cada propiedad
      const propertiesWithStats = (data || []).map(p => ({
        ...p,
        occupancy_rate: Math.floor(Math.random() * 40 + 60),
        total_bookings: Math.floor(Math.random() * 20 + 5),
        monthly_revenue: (p.price_per_night || p.price || 0) * Math.floor(Math.random() * 20 + 10),
      }))

      setProperties(propertiesWithStats)

      // Calcular estadísticas generales
      const totalRevenue = propertiesWithStats.reduce((sum, p) => sum + (p.monthly_revenue || 0), 0)
      const avgOccupancy = Math.round(
        propertiesWithStats.reduce((sum, p) => sum + (p.occupancy_rate || 0), 0) /
        Math.max(propertiesWithStats.length, 1)
      )

      setStats({
        total: propertiesWithStats.length,
        occupancy: avgOccupancy,
        revenue: totalRevenue,
      })
    } catch (err) {
      console.error('Error loading properties:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (propertyId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta propiedad?')) return

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId)

      if (error) throw error
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

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header title="Be Living - Host" showThemeToggle={true} />

      <div className="sticky top-16 z-40 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 px-6 py-2">
        <button
          onClick={handleLogout}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition"
        >
          Salir
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-light text-black dark:text-white mb-2">Host Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Gestiona y monitorea tus propiedades</p>
        </div>

        {/* Stats Section */}
        {!loading && properties.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Total Properties */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Propiedades</p>
                  <p className="text-4xl font-light text-blue-900 dark:text-blue-100 mt-2">{stats.total}</p>
                </div>
                <div className="text-4xl">🏠</div>
              </div>
            </div>

            {/* Avg Occupancy */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-6 border border-green-200 dark:border-green-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 dark:text-green-400 text-sm font-medium">Ocupación Promedio</p>
                  <p className="text-4xl font-light text-green-900 dark:text-green-100 mt-2">{stats.occupancy}%</p>
                </div>
                <div className="text-4xl">📈</div>
              </div>
            </div>

            {/* Monthly Revenue */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Ingresos Este Mes</p>
                  <p className="text-4xl font-light text-purple-900 dark:text-purple-100 mt-2">${stats.revenue}</p>
                </div>
                <div className="text-4xl">💰</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mb-8">
          <Link
            href="/host/properties/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition"
          >
            <span>+</span> Nueva propiedad
          </Link>
        </div>

        {/* Properties Table */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Cargando propiedades...</p>
          </div>
        ) : properties.length === 0 ? (
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
          <div className="space-y-4">
            {properties.map(property => (
              <div
                key={property.id}
                className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 hover:shadow-lg dark:hover:shadow-lg dark:shadow-black/20 transition-shadow bg-white dark:bg-gray-950"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Property Info */}
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold text-black dark:text-white mb-1">
                      {property.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                      📍 {property.location}
                    </p>
                    <p className="text-black dark:text-white font-semibold text-lg">
                      ${property.price_per_night || property.price}/noche
                    </p>
                    {property.amenities && property.amenities.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {property.amenities.slice(0, 3).map((amenity: string) => (
                          <span
                            key={amenity}
                            className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-700 dark:text-gray-300"
                          >
                            {amenity}
                          </span>
                        ))}
                        {property.amenities.length > 3 && (
                          <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                            +{property.amenities.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3">
                      <p className="text-blue-600 dark:text-blue-400 text-xs font-medium">Ocupación</p>
                      <p className="text-2xl font-light text-blue-900 dark:text-blue-100">
                        {property.occupancy_rate}%
                      </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded p-3">
                      <p className="text-green-600 dark:text-green-400 text-xs font-medium">Reservas</p>
                      <p className="text-2xl font-light text-green-900 dark:text-green-100">
                        {property.total_bookings}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 justify-end">
                    <Link
                      href={`/host/properties/${property.id}/edit`}
                      className="px-4 py-2 border border-black dark:border-white text-black dark:text-white rounded-lg hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors text-sm font-medium"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(property.id)}
                      className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors text-sm font-medium"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
