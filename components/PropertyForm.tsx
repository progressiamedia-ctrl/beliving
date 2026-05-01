'use client'

import { useState, useId } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface PropertyFormProps {
  property?: any
  onSuccess?: () => void
}

export function PropertyForm({ property, onSuccess }: PropertyFormProps) {
  const router = useRouter()
  const titleInputId = useId()
  const descriptionInputId = useId()
  const priceInputId = useId()
  const locationInputId = useId()
  const amenitiesInputId = useId()
  const errorMessageId = useId()
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

  const validateForm = (): string | null => {
    // Validate title
    if (!formData.title.trim()) return 'El título de la propiedad es requerido'
    if (formData.title.length < 5) return 'El título debe tener al menos 5 caracteres'
    if (formData.title.length > 100) return 'El título no puede exceder 100 caracteres'

    // Validate description
    if (formData.description && formData.description.length > 2000) {
      return 'La descripción no puede exceder 2000 caracteres'
    }

    // Validate price
    const price = parseFloat(formData.price_per_night)
    if (!formData.price_per_night) return 'El precio por noche es requerido'
    if (isNaN(price)) return 'El precio debe ser un número válido'
    if (price < 1) return 'El precio debe ser mayor a 0'
    if (price > 99999) return 'El precio es demasiado alto'

    // Validate location
    if (!formData.location.trim()) return 'La ubicación es requerida'
    if (formData.location.length < 3) return 'La ubicación debe tener al menos 3 caracteres'

    // Validate amenities format
    if (formData.amenities) {
      const amenities = formData.amenities.split(',').map((a: string) => a.trim()).filter(Boolean)
      if (amenities.length > 20) return 'No puedes agregar más de 20 amenidades'
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate form data
      const validationError = validateForm()
      if (validationError) throw new Error(validationError)

      const hostId = localStorage.getItem('userId')
      if (!hostId) throw new Error('Sesión expirada. Por favor inicia sesión de nuevo.')

      const amenitiesArray = formData.amenities.split(',').map((a: string) => a.trim()).filter(Boolean)
      const price = parseFloat(formData.price_per_night)

      if (property?.id) {
        // Update
        const { error } = await supabase
          .from('properties')
          .update({
            title: formData.title.trim(),
            description: formData.description.trim(),
            amenities: amenitiesArray,
            price_per_night: price,
            location: formData.location.trim(),
          })
          .eq('id', property.id)
          .eq('host_id', hostId)

        if (error) throw error
      } else {
        // Create
        const { error } = await supabase
          .from('properties')
          .insert([{
            host_id: hostId,
            title: formData.title.trim(),
            description: formData.description.trim(),
            amenities: amenitiesArray,
            price_per_night: price,
            location: formData.location.trim(),
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
        <label htmlFor={titleInputId} className="block text-sm font-medium text-black mb-1">
          Título <span aria-hidden="true">*</span>
        </label>
        <input
          id={titleInputId}
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 bg-white text-black rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          required
          aria-required="true"
          aria-describedby={error ? errorMessageId : undefined}
        />
      </div>

      <div>
        <label htmlFor={descriptionInputId} className="block text-sm font-medium text-black mb-1">
          Descripción
        </label>
        <textarea
          id={descriptionInputId}
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 bg-white text-black rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          aria-describedby={error ? errorMessageId : undefined}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor={priceInputId} className="block text-sm font-medium text-black mb-1">
            Precio por noche (USD) <span aria-hidden="true">*</span>
          </label>
          <input
            id={priceInputId}
            type="number"
            name="price_per_night"
            value={formData.price_per_night}
            onChange={handleChange}
            step="0.01"
            className="w-full px-4 py-2 border border-gray-300 bg-white text-black rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            required
            aria-required="true"
            aria-describedby={error ? errorMessageId : undefined}
          />
        </div>

        <div>
          <label htmlFor={locationInputId} className="block text-sm font-medium text-black mb-1">
            Ubicación <span aria-hidden="true">*</span>
          </label>
          <input
            id={locationInputId}
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 bg-white text-black rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            required
            aria-required="true"
            aria-describedby={error ? errorMessageId : undefined}
          />
        </div>
      </div>

      <div>
        <label htmlFor={amenitiesInputId} className="block text-sm font-medium text-black mb-1">
          Amenidades (separadas por coma)
        </label>
        <input
          id={amenitiesInputId}
          type="text"
          name="amenities"
          value={formData.amenities}
          onChange={handleChange}
          placeholder="WiFi, Piscina, Cocina, Aire acondicionado"
          className="w-full px-4 py-2 border border-gray-300 bg-white text-black rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
        />
      </div>

      {error && <p id={errorMessageId} className="text-red-600 text-sm" role="alert">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
        aria-busy={loading}
        aria-label={property ? 'Actualizar propiedad' : 'Crear nueva propiedad'}
      >
        {loading ? 'Guardando...' : property ? 'Actualizar' : 'Crear propiedad'}
      </button>
    </form>
  )
}
