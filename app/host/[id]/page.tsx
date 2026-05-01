'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { supabase } from '@/lib/supabase'
import { Rating, getPropertyRatings } from '@/lib/rating-utils'

interface HostData {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  bio: string | null
  avatar_url: string | null
  created_at: string
}

interface Property {
  id: string
  title: string
  city: string
  price: number
  images: string[]
  rating: number
}

export default function HostProfilePage() {
  const params = useParams()
  const router = useRouter()
  const hostId = params.id as string

  const [host, setHost] = useState<HostData | null>(null)
  const [hostProperties, setHostProperties] = useState<Property[]>([])
  const [ratings, setRatings] = useState<Rating[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [hostRes, propsRes] = await Promise.all([
          supabase
            .from('users')
            .select('id, email, first_name, last_name, bio, avatar_url, created_at')
            .eq('id', hostId)
            .single(),
          supabase
            .from('properties')
            .select('id, title, city, price_per_night, images, rating')
            .eq('host_id', hostId),
        ])

        if (hostRes.error || !hostRes.data) {
          setError('Anfitrión no encontrado')
          setLoading(false)
          return
        }

        setHost(hostRes.data)

        const props = (propsRes.data || []).map((p: any) => ({
          id: p.id,
          title: p.title,
          city: p.city,
          price: p.price_per_night || 0,
          images: p.images || [],
          rating: p.rating || 0,
        }))

        setHostProperties(props)

        if (props.length > 0) {
          const { data: ratingsData } = await supabase
            .from('ratings')
            .select('*')
            .in('property_id', props.map((p: any) => p.id))
            .order('created_at', { ascending: false })
            .limit(20)

          setRatings((ratingsData as Rating[]) || [])
        }

        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el anfitrión')
        setLoading(false)
      }
    }

    load()
  }, [hostId])

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Cargando perfil...</p>
      </div>
    )
  }

  if (error || !host) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Header title="Anfitrión - Be Living" />

        <div className="max-w-4xl mx-auto px-6 py-12">
          <p className="text-red-600 dark:text-red-400 mb-6" role="alert">{error || 'Anfitrión no encontrado'}</p>
          <Link href="/properties" className="text-gray-900 dark:text-white underline" aria-label="Volver a propiedades">
            ← Volver a propiedades
          </Link>
        </div>
      </div>
    )
  }

  const hostName = [host.first_name, host.last_name].filter(Boolean).join(' ') || host.email.split('@')[0]
  const avgRating =
    ratings.length > 0
      ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1)
      : null

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header title={`${hostName} - Be Living`} />

      <div className="border-b border-gray-200 dark:border-gray-800 sticky top-16 z-40 bg-white dark:bg-black">
        <div className="max-w-4xl mx-auto px-6 py-3">
          <Link href="/properties" className="text-gray-900 dark:text-white underline text-sm">
            ← Volver
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6">
            {host.avatar_url ? (
              <img
                src={host.avatar_url}
                alt={hostName}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-900 flex items-center justify-center text-2xl font-bold text-gray-700 dark:text-gray-300">
                {hostName.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{hostName}</h1>
              {host.bio && (
                <p className="text-gray-700 dark:text-gray-300 mb-4">{host.bio}</p>
              )}

              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-400">Propiedades</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{hostProperties.length}</p>
                </div>
                {ratings.length > 0 && (
                  <>
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-400">Reseñas</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{ratings.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-400">Calificación</p>
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400 text-lg">★</span>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{avgRating}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {hostProperties.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Propiedades del anfitrión</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {hostProperties.map((property) => (
                <Link
                  key={property.id}
                  href={`/properties/${property.id}`}
                  className="group cursor-pointer"
                >
                  <div className="relative mb-4 overflow-hidden rounded-2xl aspect-square bg-gray-200 dark:bg-gray-900 shadow-md hover:shadow-lg transition">
                    <img
                      src={property.images[0] || 'https://via.placeholder.com/300x300?text=Property'}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://via.placeholder.com/300x300?text=Property'
                      }}
                    />
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-yellow-400 transition line-clamp-1">
                      {property.title}
                    </h3>

                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{property.city}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400">★</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {property.rating.toFixed(1)}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">${property.price}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {ratings.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Reseñas recientes</h2>

            <div className="space-y-6">
              {ratings.slice(0, 5).map((r) => (
                <div
                  key={r.id}
                  className="border-b border-gray-200 dark:border-gray-800 pb-6"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={i < r.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-700'}
                      >
                        ★
                      </span>
                    ))}
                    <span className="text-sm text-gray-600 dark:text-gray-500 ml-2">
                      {new Date(r.created_at).toLocaleDateString('es-ES', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  {r.comment && (
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{r.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {hostProperties.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Este anfitrión aún no tiene propiedades publicadas</p>
          </div>
        )}
      </div>
    </div>
  )
}