'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function HostDashboard() {
  const router = useRouter()
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

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
      setProperties(data || [])
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
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-light text-black">Host Dashboard</h1>
            <p className="text-gray-600 mt-2">Gestiona tus propiedades</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-black underline text-sm hover:no-underline"
          >
            Salir
          </button>
        </div>

        <Link
          href="/host/properties/new"
          className="inline-block mb-8 px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800"
        >
          + Nueva propiedad
        </Link>

        {loading ? (
          <p className="text-gray-600">Cargando...</p>
        ) : properties.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Aún no tienes propiedades</p>
            <Link
              href="/host/properties/new"
              className="text-black underline"
            >
              Crear la primera
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {properties.map(property => (
              <div
                key={property.id}
                className="flex justify-between items-start p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow"
              >
                <div className="flex-1">
                  <h3 className="text-xl font-medium text-black">
                    {property.title}
                  </h3>
                  <p className="text-gray-600 mt-1">{property.location}</p>
                  <p className="text-black font-medium mt-2">
                    ${property.price_per_night}/noche
                  </p>
                  {property.amenities?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {property.amenities.map((amenity: string) => (
                        <span
                          key={amenity}
                          className="text-xs bg-gray-100 px-2 py-1 rounded text-black"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <Link
                    href={`/host/properties/${property.id}/edit`}
                    className="px-4 py-2 border border-black text-black rounded-lg hover:bg-black hover:text-white transition-colors text-sm"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => handleDelete(property.id)}
                    className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
