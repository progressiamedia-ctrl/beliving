'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { properties } from '@/lib/properties-data'

export default function Properties() {
  const router = useRouter()
  const [filteredProperties, setFilteredProperties] = useState(properties)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-light text-black">Be Living</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-black transition"
          >
            Salir
          </button>
        </div>
      </header>

      {/* Search & Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          {/* Main search */}
          <div>
            <input
              type="text"
              placeholder="¿Dónde quieres quedarte?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black placeholder-gray-500"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-4 flex-wrap">
            {/* City filter */}
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
            >
              <option value="">Todas las ciudades</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            {/* Price filter */}
            <input
              type="number"
              placeholder="Precio máximo"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black placeholder-gray-500"
            />
          </div>

          {/* Results count */}
          <p className="text-sm text-gray-600">
            {filteredProperties.length} propiedades disponibles
          </p>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {filteredProperties.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600 mb-4">No hay propiedades que coincidan con tu búsqueda</p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCity('')
                setMaxPrice('')
              }}
              className="text-black underline hover:no-underline"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProperties.map((property) => (
              <Link
                key={property.id}
                href={`/properties/${property.id}`}
                className="group cursor-pointer"
              >
                <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden bg-gray-100">
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {property.verified && (
                      <div className="absolute top-4 right-4 bg-black text-white px-3 py-1 rounded-full text-xs font-medium">
                        ✓ Verified
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-lg font-medium text-black group-hover:underline mb-1">
                      {property.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">{property.location}</p>

                    {/* Amenities */}
                    {property.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {property.amenities.slice(0, 2).map((amenity) => (
                          <span
                            key={amenity}
                            className="text-xs bg-gray-100 px-2 py-1 rounded text-black"
                          >
                            {amenity}
                          </span>
                        ))}
                        {property.amenities.length > 2 && (
                          <span className="text-xs text-gray-600">
                            +{property.amenities.length - 2} más
                          </span>
                        )}
                      </div>
                    )}

                    {/* Rating & Price */}
                    <div className="mt-auto space-y-3 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">★ {property.rating}</div>
                      </div>
                      <div className="text-2xl font-light text-black">
                        ${property.price}
                        <span className="text-sm text-gray-600">/noche</span>
                      </div>
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
