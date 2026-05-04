'use client';

import { useState } from 'react';
import { useProperties } from '@/lib/hooks';
import { useUpload } from '@/lib/hooks';

interface PropertyFormProps {
  hostId: string;
  onSuccess?: (property: any) => void;
}

export function PropertyForm({ hostId, onSuccess }: PropertyFormProps) {
  const { createProperty, loading: creating } = useProperties();
  const { uploadFile, loading: uploading, progress } = useUpload();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    city: '',
    price: '',
    amenities: [] as string[],
    maxGuests: '2',
    bedrooms: '1',
    bathrooms: '1'
  });

  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const amenitiesOptions = ['WiFi', 'AC', 'Calefacción', 'Cocina', 'Lavadora', 'Piscina', 'Parking', 'Balcón'];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const file = e.target.files[0];
    const result = await uploadFile(file, hostId, 'properties');

    if (result) {
      setImages([...images, result.url]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title || !formData.location || !formData.city || !formData.price) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    const property = await createProperty({
      host_id: hostId,
      title: formData.title,
      description: formData.description,
      location: formData.location,
      city: formData.city,
      price: parseFloat(formData.price),
      amenities: formData.amenities,
      images: images,
      max_guests: parseInt(formData.maxGuests),
      bedrooms: parseInt(formData.bedrooms),
      bathrooms: parseInt(formData.bathrooms),
      available: true
    });

    if (property) {
      setFormData({
        title: '',
        description: '',
        location: '',
        city: '',
        price: '',
        amenities: [],
        maxGuests: '2',
        bedrooms: '1',
        bathrooms: '1'
      });
      setImages([]);
      onSuccess?.(property);
    } else {
      setError('Error al crear la propiedad');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div>
        <label className="block text-sm font-medium mb-1">Título *</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="Ej: Apartamento moderno en el centro"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Descripción</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Describe tu propiedad..."
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Ubicación *</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="Ej: Calle Principal 123"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Ciudad *</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            placeholder="Ej: Madrid"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Precio/noche *</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            placeholder="150"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Huéspedes máximo</label>
          <input
            type="number"
            name="maxGuests"
            value={formData.maxGuests}
            onChange={handleInputChange}
            min="1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Recámaras</label>
          <input
            type="number"
            name="bedrooms"
            value={formData.bedrooms}
            onChange={handleInputChange}
            min="1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Comodidades</label>
        <div className="grid grid-cols-2 gap-2">
          {amenitiesOptions.map(amenity => (
            <label key={amenity} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.amenities.includes(amenity)}
                onChange={() => handleAmenityToggle(amenity)}
                className="mr-2"
              />
              {amenity}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Imágenes</label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
            className="block w-full"
          />
          {uploading && <p className="mt-2 text-sm">Subiendo... {progress}%</p>}
        </div>

        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-4 gap-2">
            {images.map((img, idx) => (
              <div key={idx} className="relative">
                <img src={img} alt="preview" className="w-full h-24 object-cover rounded" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

      <button
        type="submit"
        disabled={creating || uploading}
        className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
      >
        {creating ? 'Creando...' : 'Crear Propiedad'}
      </button>
    </form>
  );
}
