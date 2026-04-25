'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { properties } from '@/lib/properties-data'

export default function PropertiesPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; role: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredProperties, setFilteredProperties] = useState(properties)

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    const userRole = localStorage.getItem('userRole')
    const userEmail = localStorage.getItem('userEmail')

    if (!userId) {
      router.push('/')
      return
    }

    setUser({
      id: userId,
      role: userRole || 'guest',
      email: userEmail || 'user@example.com',
    })
    setLoading(false)
  }, [router])

  useEffect(() => {
    let filtered = properties

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.city.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredProperties(filtered)
  }, [searchQuery])

  const handleLogout = () => {
    localStorage.clear()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Header title="Be Living - Propiedades" showThemeToggle={false} />

      {/* Navbar */}
      <div className="sticky top-16 z-40 bg-black border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h2 className="text-white font-light text-2xl">Propiedades Disponibles</h2>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition"
          >
            Salir
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-black border-b border-gray-800 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por ciudad, ubicación o nombre..."
            className="w-full px-6 py-3 bg-gray-900 border border-gray-800 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:border-yellow-400"
          />
        </div>
      </div>

      {/* Properties Grid */}
      <div className="bg-black px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {filteredProperties.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">No hay propiedades que coincidan con tu búsqueda</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <Link
                  key={property.id}
                  href={`/properties/${property.id}`}
                  className="group bg-gray-900 rounded-xl overflow-hidden hover:shadow-2xl transition duration-300 border border-gray-800 hover:border-yellow-400"
                >
                  {/* Image */}
                  <div className="relative w-full h-64 bg-gray-800 overflow-hidden">
                    <img
                      src={property.images[0] || 'https://via.placeholder.com/400x300?text=No+Image'}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    {property.verified && (
                      <div className="absolute top-4 right-4 bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-bold">
                        ✓ Verificado
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-yellow-400 transition">
                      {property.title}
                    </h3>

                    <p className="text-gray-400 text-sm mb-4">{property.location}</p>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400">★</span>
                        <span className="text-white text-sm font-medium">{property.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-gray-400 text-sm">{property.city}</span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                      <span className="text-white font-bold text-xl">${property.price}</span>
                      <span className="text-gray-400 text-sm">por noche</span>
                    </div>

                    {property.amenities.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {property.amenities.slice(0, 3).map((amenity) => (
                          <span key={amenity} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">
                            {amenity}
                          </span>
                        ))}
                        {property.amenities.length > 3 && (
                          <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">
                            +{property.amenities.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
