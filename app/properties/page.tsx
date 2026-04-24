'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function Properties() {
  const router = useRouter()
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ location: '', maxPrice: '' })

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    const userRole = localStorage.getItem('userRole')

    if (!userId || userRole !== 'guest') {
      router.push('/')
      return
    }

    loadProperties()
  }, [router])

  const loadProperties = async () => {
    try {
      let query = supabase.from('properties').select('*').eq('is_available', true)

      if (filter.location) {
        query = query.ilike('location', `%${filter.location}%`)
      }

      if (filter.maxPrice) {
        query = query.lte('price_per_night', parseFloat(filter.maxPrice))
      }

      const { data, error } = await query

      if (error) throw error
      setProperties(data || [])
    } catch (err) {
      console.error('Error loading properties:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('userId')
    localStorage.removeItem('userRole')
    router.push('/')
  }

  useEffect(() => {
    loadProperties()
  }, [filter])

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-light text-black">Propiedades premium</h1>
            <p className="text-gray-600 mt-2">Descubre nuestras propiedades verificadas</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-black underline text-sm hover:no-underline"
          >
            Salir
          </button>
        </div>

        {/* Filtros */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <input
            type="text"
            placeholder="Buscar por ubicación..."
            value={filter.location}
            onChange={(e) => setFilter({ ...filter, location: e.target.value })}
            className="px-4 py-2 border border-gray-300 bg-white text-black rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          />
          <input
            type="number"
            placeholder="Precio máximo por noche"
            value={filter.maxPrice}
            onChange={(e) => setFilter({ ...filter, maxPrice: e.target.value })}
            className="px-4 py-2 border border-gray-300 bg-white text-black rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>

        {loading ? (
          <p className="text-gray-600">Cargando propiedades...</p>
        ) : properties.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No hay propiedades disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map(property => (
              <Link
                key={property.id}
                href={`/properties/${property.id}`}
                className="group cursor-pointer"
              >
                <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
                  <div className="bg-gray-100 h-48 group-hover:bg-gray-200 transition-colors flex items-center justify-center">
                    <p className="text-gray-400">Foto no disponible</p>
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-medium text-black group-hover:underline">
                      {property.title}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">{property.location}</p>

                    {property.amenities?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {property.amenities.slice(0, 3).map((amenity: string) => (
                          <span
                            key={amenity}
                            className="text-xs bg-gray-100 px-2 py-1 rounded text-black"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto pt-4 border-t border-gray-200">
                      <p className="text-2xl font-light text-black">
                        ${property.price_per_night}
                        <span className="text-sm text-gray-600">/noche</span>
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
