'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface PropertyFormProps {
  property?: any
  onSuccess?: () => void
}

export function PropertyForm({ property, onSuccess }: PropertyFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: property?.title || '',
    description: property?.description || '',
    price_per_night: property?.price_per_night || '',
    location: property?.location || '',
    amenities: property?.amenities?.join(', ') || '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const hostId = localStorage.getItem('userId')
      if (!hostId) throw new Error('No host ID found')

      const amenitiesArray = formData.amenities.split(',').map((a: string) => a.trim()).filter(Boolean)

      if (property?.id) {
        // Update
        const { error } = await supabase
          .from('properties')
          .update({
            ...formData,
            amenities: amenitiesArray,
            price_per_night: parseFloat(formData.price_per_night),
          })
          .eq('id', property.id)

        if (error) throw error
      } else {
        // Create
        const { error } = await supabase
          .from('properties')
          .insert([{
            host_id: hostId,
            ...formData,
            amenities: amenitiesArray,
            price_per_night: parseFloat(formData.price_per_night),
          }])

        if (error) throw error
      }

      onSuccess?.()
      router.push('/host/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar propiedad')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div>
        <label className="block text-sm font-medium text-black mb-1">
          Título
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 bg-white text-black rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1">
          Descripción
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 bg-white text-black rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Precio por noche (USD)
          </label>
          <input
            type="number"
            name="price_per_night"
            value={formData.price_per_night}
            onChange={handleChange}
            step="0.01"
            className="w-full px-4 py-2 border border-gray-300 bg-white text-black rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Ubicación
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 bg-white text-black rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1">
          Amenidades (separadas por coma)
        </label>
        <input
          type="text"
          name="amenities"
          value={formData.amenities}
          onChange={handleChange}
          placeholder="WiFi, Piscina, Cocina, Aire acondicionado"
          className="w-full px-4 py-2 border border-gray-300 bg-white text-black rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? 'Guardando...' : property ? 'Actualizar' : 'Crear propiedad'}
      </button>
    </form>
  )
}
