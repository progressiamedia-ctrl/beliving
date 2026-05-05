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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl backdrop-blur-[40px] bg-white/20 dark:bg-white/10 border border-white/40 rounded-2xl p-6 shadow-lg">
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Título *</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="Ej: Apartamento moderno en el centro"
          className="w-full px-4 py-3 backdrop-blur-[30px] border border-white/40 bg-white/20 dark:bg-white/15 rounded-xl focus:ring-2 focus:ring-yellow-400 text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Descripción</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Describe tu propiedad..."
          rows={4}
          className="w-full px-4 py-3 backdrop-blur-[30px] border border-white/40 bg-white/20 dark:bg-white/15 rounded-xl focus:ring-2 focus:ring-yellow-400 text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Ubicación *</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="Ej: Calle Principal 123"
            className="w-full px-4 py-3 backdrop-blur-[30px] border border-white/40 bg-white/20 dark:bg-white/15 rounded-xl focus:ring-2 focus:ring-yellow-400 text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Ciudad *</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            placeholder="Ej: Madrid"
            className="w-full px-4 py-3 backdrop-blur-[30px] border border-white/40 bg-white/20 dark:bg-white/15 rounded-xl focus:ring-2 focus:ring-yellow-400 text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Precio/noche *</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            placeholder="150"
            className="w-full px-4 py-3 backdrop-blur-[30px] border border-white/40 bg-white/20 dark:bg-white/15 rounded-xl focus:ring-2 focus:ring-yellow-400 text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Huéspedes máximo</label>
          <input
            type="number"
            name="maxGuests"
            value={formData.maxGuests}
            onChange={handleInputChange}
            min="1"
            className="w-full px-4 py-3 backdrop-blur-[30px] border border-white/40 bg-white/20 dark:bg-white/15 rounded-xl focus:ring-2 focus:ring-yellow-400 text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Recámaras</label>
          <input
            type="number"
            name="bedrooms"
            value={formData.bedrooms}
            onChange={handleInputChange}
            min="1"
            className="w-full px-4 py-3 backdrop-blur-[30px] border border-white/40 bg-white/20 dark:bg-white/15 rounded-xl focus:ring-2 focus:ring-yellow-400 text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Comodidades</label>
        <div className="grid grid-cols-2 gap-2">
          {amenitiesOptions.map(amenity => (
            <label key={amenity} className="flex items-center text-gray-900 dark:text-white">
              <input
                type="checkbox"
                checked={formData.amenities.includes(amenity)}
                onChange={() => handleAmenityToggle(amenity)}
                className="mr-2 accent-yellow-400"
              />
              {amenity}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Imágenes</label>
        <div className="border-2 border-dashed border-white/40 backdrop-blur-[20px] bg-white/10 rounded-2xl p-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
            className="block w-full text-gray-900 dark:text-white"
          />
          {uploading && <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">Subiendo... {progress}%</p>}
        </div>

        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-4 gap-2">
            {images.map((img, idx) => (
              <div key={idx} className="relative">
                <img src={img} alt="preview" className="w-full h-24 object-cover rounded-xl" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1 right-1 backdrop-blur-[20px] bg-red-500/80 border border-red-600/50 text-white rounded-full w-6 h-6 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <div className="backdrop-blur-[20px] bg-red-500/20 border border-red-400/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">{error}</div>}

      <button
        type="submit"
        disabled={creating || uploading}
        className="w-full backdrop-blur-[30px] bg-yellow-400/80 hover:bg-yellow-400 border border-yellow-500/50 text-gray-900 py-3 rounded-xl font-medium transition disabled:opacity-50"
      >
        {creating ? 'Creando...' : 'Crear Propiedad'}
      </button>
    </form>
  );
}
