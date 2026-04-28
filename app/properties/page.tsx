'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { properties } from '@/lib/properties-data'

type CategoryFilter = 'all' | 'accommodations' | 'experiences' | 'services'
type NavTab = 'explore' | 'favorites' | 'trips' | 'messages' | 'profile'

export default function PropertiesPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; role: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all')
  const [filteredProperties, setFilteredProperties] = useState(properties)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [activeNav, setActiveNav] = useState<NavTab>('explore')
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    const userRole = localStorage.getItem('userRole')
    const userEmail = localStorage.getItem('userEmail')
    const savedFavorites = localStorage.getItem('favorites')

    if (!userId) {
      router.push('/')
      return
    }

    setUser({
      id: userId,
      role: userRole || 'guest',
      email: userEmail || 'user@example.com',
    })

    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)))
    }

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
  }, [searchQuery, activeCategory])

  const toggleFavorite = (propertyId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const newFavorites = new Set(favorites)
    if (newFavorites.has(propertyId)) {
      newFavorites.delete(propertyId)
    } else {
      newFavorites.add(propertyId)
    }
    setFavorites(newFavorites)
    localStorage.setItem('favorites', JSON.stringify([...newFavorites]))
  }

  const handleLogout = () => {
    localStorage.clear()
    router.push('/')
  }

  const handleNavClick = (tab: NavTab) => {
    setActiveNav(tab)
    if (tab === 'profile') {
      setShowProfileMenu(!showProfileMenu)
    } else {
      setShowProfileMenu(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <p className="text-gray-900 dark:text-white">Cargando...</p>
      </div>
    )
  }

  const favoritesOnly = activeNav === 'favorites' ? filteredProperties.filter(p => favorites.has(p.id)) : filteredProperties

  return (
    <div className="min-h-screen bg-white dark:bg-black pb-24">
      <Header title="Be Living" showThemeToggle={true} />

      {/* Search Bar */}
      <div className="sticky top-16 z-30 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-900 rounded-full px-5 py-3 border border-gray-200 dark:border-gray-800">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="¿Dónde quieres quedarte?"
              className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none text-lg"
            />
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-6 overflow-x-auto pb-2">
            {[
              { id: 'all', label: 'Alojamientos', badge: false },
              { id: 'experiences', label: 'Experiencias', badge: true },
              { id: 'services', label: 'Servicios', badge: true },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id as CategoryFilter)}
                className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeCategory === tab.id
                    ? 'text-gray-900 dark:text-white border-b-2 border-yellow-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
                {tab.badge && (
                  <span className="bg-blue-900 text-white text-xs px-2 py-1 rounded-full font-bold">NUEVO</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-black px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {activeNav === 'favorites' && favoritesOnly.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">No tienes favoritos aún</p>
              <button
                onClick={() => setActiveNav('explore')}
                className="text-yellow-400 hover:text-yellow-500 font-medium"
              >
                Explorar propiedades
              </button>
            </div>
          ) : activeNav === 'explore' ? (
            <>
              {/* Recent Searches Section */}
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sigue buscando alojamientos en tu destino favorito</h2>
                  <button className="text-gray-900 dark:text-white hover:text-yellow-400 dark:hover:text-yellow-400 transition">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {filteredProperties.length > 0 && (
                  <Link
                    href={`/properties/${filteredProperties[0].id}`}
                    className="flex gap-6 bg-gray-50 dark:bg-gray-900 rounded-3xl p-6 hover:shadow-lg transition group cursor-pointer border border-gray-200 dark:border-gray-800"
                  >
                    <div className="flex-1">
                      <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">{filteredProperties[0].city}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">22 jun - 5 jul • 4 viajeros</p>
                    </div>
                    <div className="w-40 h-32 rounded-2xl overflow-hidden flex-shrink-0">
                      <img
                        src={filteredProperties[0].images[0] || 'https://via.placeholder.com/200x150?text=Property'}
                        alt={filteredProperties[0].title}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x150?text=Property'
                        }}
                      />
                    </div>
                  </Link>
                )}
              </div>

              {/* Properties Section */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Consultados recientemente</h2>
                  <button className="text-gray-900 dark:text-white hover:text-yellow-400 dark:hover:text-yellow-400 transition">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {filteredProperties.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-gray-600 dark:text-gray-400 text-lg">No hay propiedades que coincidan con tu búsqueda</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProperties.map((property) => (
                      <Link
                        key={property.id}
                        href={`/properties/${property.id}`}
                        className="group cursor-pointer"
                      >
                        <div className="relative mb-4 overflow-hidden rounded-3xl aspect-square bg-gray-200 dark:bg-gray-900 shadow-md hover:shadow-xl transition">
                          <img
                            src={property.images[0] || 'https://via.placeholder.com/300x300?text=Property'}
                            alt={property.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300?text=Property'
                            }}
                          />

                          {property.verified && (
                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1 rounded-full text-xs font-bold">
                              ✓ Verificado
                            </div>
                          )}

                          <button
                            onClick={(e) => toggleFavorite(property.id, e)}
                            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition shadow-md"
                          >
                            <svg
                              className={`w-6 h-6 transition ${
                                favorites.has(property.id)
                                  ? 'text-red-500 fill-current'
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}
                              fill={favorites.has(property.id) ? 'currentColor' : 'none'}
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                              />
                            </svg>
                          </button>
                        </div>

                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-yellow-400 transition line-clamp-1">
                            {property.title}
                          </h3>

                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {property.city}, {property.location}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-400">★</span>
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">{property.rating.toFixed(1)}</span>
                            </div>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">${property.price}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : activeNav === 'favorites' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favoritesOnly.map((property) => (
                <Link
                  key={property.id}
                  href={`/properties/${property.id}`}
                  className="group cursor-pointer"
                >
                  <div className="relative mb-4 overflow-hidden rounded-3xl aspect-square bg-gray-200 dark:bg-gray-900 shadow-md hover:shadow-xl transition">
                    <img
                      src={property.images[0] || 'https://via.placeholder.com/300x300?text=Property'}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300?text=Property'
                      }}
                    />

                    {property.verified && (
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1 rounded-full text-xs font-bold">
                        ✓ Verificado
                      </div>
                    )}

                    <button
                      onClick={(e) => toggleFavorite(property.id, e)}
                      className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition shadow-md"
                    >
                      <svg
                        className={`w-6 h-6 transition ${
                          favorites.has(property.id)
                            ? 'text-red-500 fill-current'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}
                        fill={favorites.has(property.id) ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    </button>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-yellow-400 transition line-clamp-1">
                      {property.title}
                    </h3>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {property.city}, {property.location}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400">★</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{property.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">${property.price}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-600 dark:text-gray-400 text-lg">{activeNav === 'trips' ? 'Mis viajes' : activeNav === 'messages' ? 'Mensajes' : 'Perfil'} - Próximamente</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 px-4 py-3 flex justify-around">
        <button
          onClick={() => handleNavClick('explore')}
          className={`flex flex-col items-center gap-1 transition ${
            activeNav === 'explore'
              ? 'text-yellow-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs font-semibold">Explorar</span>
        </button>

        <button
          onClick={() => handleNavClick('favorites')}
          className={`flex flex-col items-center gap-1 transition ${
            activeNav === 'favorites'
              ? 'text-yellow-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="text-xs font-semibold">Favoritos</span>
        </button>

        <button
          onClick={() => handleNavClick('trips')}
          className={`flex flex-col items-center gap-1 transition ${
            activeNav === 'trips'
              ? 'text-yellow-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l4-4m0 0l4 4m-4-4v18" />
          </svg>
          <span className="text-xs font-semibold">Viajes</span>
        </button>

        <button
          onClick={() => handleNavClick('messages')}
          className={`flex flex-col items-center gap-1 transition ${
            activeNav === 'messages'
              ? 'text-yellow-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-semibold">Mensajes</span>
        </button>

        <div className="relative">
          <button
            onClick={() => handleNavClick('profile')}
            className={`flex flex-col items-center gap-1 transition ${
              activeNav === 'profile'
                ? 'text-yellow-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-semibold">Perfil</span>
          </button>

          {showProfileMenu && (
            <div className="absolute bottom-16 right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl min-w-48 z-50">
              <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.email}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition font-medium"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
