'use client'

import { useState } from 'react'

export interface FilterValues {
  priceMin: number
  priceMax: number
  ratingMin: number
  amenities: string[]
  cities: string[]
}

interface AdvancedFiltersProps {
  onFilterChange: (filters: FilterValues) => void
  availableCities: string[]
  availableAmenities: string[]
}

const ALL_AMENITIES = [
  'WiFi',
  'Pool',
  'Gym',
  'Kitchen',
  'AC',
  'Heating',
  'Elevator',
  'Concierge',
  'Restaurant',
  'Beach Access',
  'Garden',
  'Spa',
  'Cinema',
]

const AMENITY_ICONS: Record<string, string> = {
  'WiFi': '📡',
  'Pool': '🏊',
  'Gym': '💪',
  'Kitchen': '🍳',
  'AC': '❄️',
  'Heating': '🔥',
  'Elevator': '🛗',
  'Concierge': '🎩',
  'Restaurant': '🍽️',
  'Beach Access': '🏖️',
  'Garden': '🌿',
  'Spa': '💆',
  'Cinema': '🎬',
}

export function AdvancedFilters({
  onFilterChange,
  availableCities,
  availableAmenities,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [priceMin, setPriceMin] = useState(0)
  const [priceMax, setPriceMax] = useState(3000)
  const [ratingMin, setRatingMin] = useState(0)
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [selectedCities, setSelectedCities] = useState<string[]>([])

  const handleAmenityToggle = (amenity: string) => {
    const newAmenities = selectedAmenities.includes(amenity)
      ? selectedAmenities.filter((a) => a !== amenity)
      : [...selectedAmenities, amenity]
    setSelectedAmenities(newAmenities)
    updateFilters(priceMin, priceMax, ratingMin, newAmenities, selectedCities)
  }

  const handleCityToggle = (city: string) => {
    const newCities = selectedCities.includes(city)
      ? selectedCities.filter((c) => c !== city)
      : [...selectedCities, city]
    setSelectedCities(newCities)
    updateFilters(priceMin, priceMax, ratingMin, selectedAmenities, newCities)
  }

  const updateFilters = (
    pMin: number,
    pMax: number,
    rMin: number,
    amenities: string[],
    cities: string[]
  ) => {
    onFilterChange({
      priceMin: pMin,
      priceMax: pMax,
      ratingMin: rMin,
      amenities,
      cities,
    })
  }

  const handlePriceMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value)
    setPriceMin(val)
    updateFilters(val, priceMax, ratingMin, selectedAmenities, selectedCities)
  }

  const handlePriceMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value)
    setPriceMax(val)
    updateFilters(priceMin, val, ratingMin, selectedAmenities, selectedCities)
  }

  const handleRatingChange = (val: number) => {
    setRatingMin(val)
    updateFilters(priceMin, priceMax, val, selectedAmenities, selectedCities)
  }

  const resetFilters = () => {
    setPriceMin(0)
    setPriceMax(3000)
    setRatingMin(0)
    setSelectedAmenities([])
    setSelectedCities([])
    updateFilters(0, 3000, 0, [], [])
  }

  const activeFilterCount = selectedAmenities.length + selectedCities.length + (priceMin > 0 || priceMax < 3000 || ratingMin > 0 ? 1 : 0)

  return (
    <div className="space-y-4">
      {/* Filter Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-black dark:bg-white text-white dark:text-black px-4 py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition"
      >
        <span>🔍 Filtros Avanzados {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
        <span>{isOpen ? '▼' : '▶'}</span>
      </button>

      {/* Filters Panel */}
      {isOpen && (
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 space-y-6">
          {/* Price Range */}
          <div>
            <h3 className="font-medium text-black dark:text-white mb-4">Rango de Precio</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">
                  Mínimo: ${priceMin}
                </label>
                <input
                  type="range"
                  min="0"
                  max="3000"
                  value={priceMin}
                  onChange={handlePriceMinChange}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">
                  Máximo: ${priceMax}
                </label>
                <input
                  type="range"
                  min="0"
                  max="3000"
                  value={priceMax}
                  onChange={handlePriceMaxChange}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Rating Filter */}
          <div>
            <h3 className="font-medium text-black dark:text-white mb-4">Calificación Mínima</h3>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  onClick={() => handleRatingChange(val)}
                  className={`px-3 py-2 rounded-lg text-sm transition ${
                    ratingMin === val
                      ? 'bg-black dark:bg-white text-white dark:text-black'
                      : 'border border-gray-300 dark:border-gray-700 text-black dark:text-white hover:border-black dark:hover:border-white'
                  }`}
                >
                  {val === 0 ? 'Todas' : `${val}⭐+`}
                </button>
              ))}
            </div>
          </div>

          {/* Cities Filter */}
          {availableCities.length > 0 && (
            <div>
              <h3 className="font-medium text-black dark:text-white mb-4">Ciudades</h3>
              <div className="space-y-2">
                {availableCities.map((city) => (
                  <label key={city} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCities.includes(city)}
                      onChange={() => handleCityToggle(city)}
                      className="mr-3 w-4 h-4"
                    />
                    <span className="text-black dark:text-white">{city}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Amenities Filter */}
          <div>
            <h3 className="font-medium text-black dark:text-white mb-4">Amenidades</h3>
            <div className="grid grid-cols-2 gap-3">
              {ALL_AMENITIES.map((amenity) => (
                <button
                  key={amenity}
                  onClick={() => handleAmenityToggle(amenity)}
                  className={`px-3 py-2 rounded-lg text-sm transition text-left ${
                    selectedAmenities.includes(amenity)
                      ? 'bg-black dark:bg-white text-white dark:text-black'
                      : 'border border-gray-300 dark:border-gray-700 text-black dark:text-white hover:border-black dark:hover:border-white'
                  }`}
                >
                  {AMENITY_ICONS[amenity]} {amenity}
                </button>
              ))}
            </div>
          </div>

          {/* Reset Button */}
          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 text-black dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition"
            >
              Limpiar Filtros
            </button>
          )}
        </div>
      )}
    </div>
  )
}
