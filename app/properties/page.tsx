'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { properties } from '@/lib/properties-data'

const PropertyMap = dynamic(() => import('@/components/PropertyMap').then((m) => m.PropertyMap), {
  ssr: false,
  loading: () => <div className="w-full h-screen bg-gray-100 flex items-center justify-center">Cargando mapa...</div>,
})

export default function Properties() {
  const router = useRouter()
  const [filteredProperties, setFilteredProperties] = useState(properties)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('')

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    const userRole = localStorage.getItem('userRole')

    if (!userId || userRole !== 'guest') {
      router.push('/')
      return
    }
  }, [router])

  useEffect(() => {
    let filtered = properties

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (selectedCity) {
      filtered = filtered.filter((p) => p.city === selectedCity)
    }

    if (maxPrice) {
      filtered = filtered.filter((p) => p.price <= parseInt(maxPrice))
    }

    setFilteredProperties(filtered)
  }, [searchQuery, selectedCity, maxPrice])

  const cities = [...new Set(properties.map((p) => p.city))]

  const handleLogout = () => {
    localStorage.removeItem('userId')
    localStorage.removeItem('userRole')
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header fijo */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-full px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-light text-black">Be Living</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-black transition"
          >
            Salir
          </button>
        </div>
      </header>

      {/* Main content con layout split */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left side - Properties */}
        <div className="w-full lg:w-1/2 flex flex-col overflow-hidden">
          {/* Search & Filters */}
          <div className="border-b border-gray-200 bg-white p-6 flex-shrink-0 space-y-4 overflow-y-auto max-h-[30vh]">
            {/* Main search */}
            <div>
              <input
                type="text"
                placeholder="¿Dónde quieres quedarte?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black placeholder-gray-500"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black text-sm"
              >
                <option value="">Todas las ciudades</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Precio máx"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black placeholder-gray-500 text-sm"
              />
            </div>

            <p className="text-xs text-gray-600">{filteredProperties.length} propiedades</p>
          </div>

          {/* Properties Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredProperties.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No hay propiedades que coincidan</p>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCity('')
                    setMaxPrice('')
                  }}
                  className="text-black underline hover:no-underline text-sm"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProperties.map((property) => (
                  <Link
                    key={property.id}
                    href={`/properties/${property.id}`}
                    onMouseEnter={() => setSelectedPropertyId(property.id)}
                    onMouseLeave={() => setSelectedPropertyId('')}
                    className={`group block p-4 border rounded-lg cursor-pointer transition ${
                      selectedPropertyId === property.id
                        ? 'border-black bg-gray-50 shadow-md'
                        : 'border-gray-200 hover:border-black hover:shadow-sm'
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* Mini image */}
                      <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-black group-hover:underline truncate">
                          {property.title}
                        </h3>
                        <p className="text-xs text-gray-600 truncate">{property.location}</p>

                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs">★ {property.rating}</span>
                          {property.verified && (
                            <span className="text-xs bg-black text-white px-2 py-0.5 rounded">
                              Verified
                            </span>
                          )}
                        </div>

                        <div className="mt-2 text-sm font-medium text-black">
                          ${property.price}/noche
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side - Map (hidden on mobile) */}
        <div className="hidden lg:block w-1/2 border-l border-gray-200 flex-shrink-0">
          <PropertyMap properties={filteredProperties} selectedPropertyId={selectedPropertyId} />
        </div>
      </div>
    </div>
  )
}
