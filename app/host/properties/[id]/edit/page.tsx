'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { PropertyForm } from '@/components/PropertyForm'

export default function EditProperty() {
  const router = useRouter()
  const params = useParams()
  const [property, setProperty] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const propertyId = params.id as string
    loadProperty(propertyId)
  }, [params])

  const loadProperty = async (propertyId: string) => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single()

      if (error) throw error
      setProperty(data)
    } catch (err) {
      console.error('Error loading property:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/host/dashboard" className="text-black underline text-sm mb-8 inline-block">
          ← Volver
        </Link>

        <h1 className="text-4xl font-light text-black mb-2">Editar propiedad</h1>
        <p className="text-gray-600 mb-8">Actualiza los detalles de tu propiedad</p>

        {loading ? (
          <p className="text-gray-600">Cargando...</p>
        ) : property ? (
          <PropertyForm property={property} onSuccess={() => router.push('/host/dashboard')} />
        ) : (
          <p className="text-red-600">Propiedad no encontrada</p>
        )}
      </div>
    </div>
  )
}
