'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamicImport from 'next/dynamic'
import { Header } from '@/components/Header'
import { SearchBar } from '@/components/SearchBar'
import { AdvancedFilters, FilterValues } from '@/components/AdvancedFilters'
import { properties } from '@/lib/properties-data'

const PropertyMap = dynamicImport(() => import('@/components/PropertyMap').then((m) => m.PropertyMap), {
  ssr: false,
  loading: () => <div className="w-full h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center text-gray-600 dark:text-gray-400">Cargando mapa...</div>,
})

export default function Properties() {
  const router = useRouter()
  const [filteredProperties, setFilteredProperties] = useState(properties)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('')
  const [filters, setFilters] = useState<FilterValues>({
    priceMin: 0,
    priceMax: 3000,
    ratingMin: 0,
    amenities: [],
    cities: [],
  })

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

    // Search query filter
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.city.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // City filter (from search bar)
    if (selectedCity) {
      filtered = filtered.filter((p) => p.city === selectedCity)
    }

    // Price filter (from search bar)
    if (maxPrice) {
      filtered = filtered.filter((p) => p.price <= parseInt(maxPrice))
    }

    // Advanced filters
    filtered = filtered.filter((p) => {
      // Price range
      if (p.price < filters.priceMin || p.price > filters.priceMax) return false

      // Rating
      if (p.rating < filters.ratingMin) return false

      // Cities filter
      if (filters.cities.length > 0 && !filters.cities.includes(p.city)) return false

      // Amenities filter (all selected amenities must be present)
      if (filters.amenities.length > 0) {
        return filters.amenities.every((amenity) => p.amenities.includes(amenity))
      }

      return true
    })

    setFilteredProperties(filtered)
  }, [searchQuery, selectedCity, maxPrice, filters])

  const cities = [...new Set(properties.map((p) => p.city))]
  const allAmenities = [...new Set(properties.flatMap((p) => p.amenities))]

  const handleLogout = () => {
    localStorage.removeItem('userId')
    localStorage.removeItem('userRole')
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col">
      <Header title="Be Living" showThemeToggle={true} />

      <div className="sticky top-16 z-40 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between">
        <button
          onClick={handleLogout}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition"
        >
          Salir
        </button>
        <Link
          href="/messages"
          className="text-sm text-black dark:text-white hover:underline transition"
        >
          💬 Mensajes
        </Link>
      </div>

      {/* Main content con layout split */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left side - Search, Filters & Properties */}
        <div className="w-full lg:w-1/2 flex flex-col overflow-hidden bg-white dark:bg-black">
          {/* Conversational Search Bar */}
          <div className="h-64 lg:h-80 border-b border-gray-200 dark:border-gray-800 overflow-hidden">
            <SearchBar
              properties={properties}
              cities={cities}
              onSearch={(filterData) => {
                setSearchQuery(filterData.searchQuery)
                setSelectedCity(filterData.selectedCity)
                setMaxPrice(filterData.maxPrice)
              }}
            />
          </div>

          {/* Advanced Filters */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <AdvancedFilters
              onFilterChange={setFilters}
              availableCities={cities}
              availableAmenities={allAmenities}
            />
          </div>

          {/* Properties Grid */}
          <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800">
            {filteredProperties.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400 mb-4">No hay propiedades que coincidan con tus filtros</p>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCity('')
                    setMaxPrice('')
                    setFilters({
                      priceMin: 0,
                      priceMax: 3000,
                      ratingMin: 0,
                      amenities: [],
                      cities: [],
                    })
                  }}
                  className="text-black dark:text-white underline hover:no-underline text-sm"
                >
                  Limpiar todos los filtros
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
                        ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-900 shadow-md'
                        : 'border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white hover:shadow-sm'
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* Mini image */}
                      <div className="w-24 h-24 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-black dark:text-white group-hover:underline truncate">
                          {property.title}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{property.location}</p>

                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-black dark:text-white">★ {property.rating}</span>
                          {property.verified && (
                            <span className="text-xs bg-black dark:bg-white text-white dark:text-black px-2 py-0.5 rounded">
                              Verified
                            </span>
                          )}
                        </div>

                        <p className="text-sm font-medium text-black dark:text-white mt-3">${property.price}/noche</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side - Map (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 h-full">
          <PropertyMap
            properties={filteredProperties}
            selectedPropertyId={selectedPropertyId}
          />
        </div>
      </div>
    </div>
  )
}
