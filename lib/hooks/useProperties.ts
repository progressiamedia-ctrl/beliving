'use client';

import { useState, useCallback } from 'react';

interface Property {
  id: string;
  host_id: string;
  title: string;
  description: string;
  location: string;
  city: string;
  price: number;
  amenities: string[];
  images: string[];
  rating: number;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  available: boolean;
  created_at: string;
}

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = useCallback(async (city?: string, limit?: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (city) params.append('city', city);
      if (limit) params.append('limit', limit.toString());

      const response = await fetch(`/api/properties?${params}`);
      if (!response.ok) throw new Error('Failed to fetch properties');

      const data = await response.json();
      setProperties(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch properties';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getProperty = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/properties/${id}`);
      if (!response.ok) throw new Error('Failed to fetch property');

      const data = await response.json();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch property';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createProperty = useCallback(async (propertyData: Omit<Property, 'id' | 'created_at' | 'rating'>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(propertyData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create property');
      }

      const newProperty = await response.json();
      setProperties([...properties, newProperty]);
      return newProperty;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create property';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [properties]);

  const updateProperty = useCallback(async (id: string, updates: Partial<Property>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/properties/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error('Failed to update property');

      const updated = await response.json();
      setProperties(properties.map(p => p.id === id ? updated : p));
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update property';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [properties]);

  return {
    properties,
    loading,
    error,
    fetchProperties,
    getProperty,
    createProperty,
    updateProperty
  };
}
