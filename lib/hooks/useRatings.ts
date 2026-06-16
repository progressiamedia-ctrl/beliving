'use client';

import { useState, useCallback } from 'react';

interface Rating {
  id: string;
  booking_id: string;
  property_id: string;
  guest_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export function useRatings() {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPropertyRatings = useCallback(async (propertyId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/ratings?property_id=${propertyId}`);
      if (!response.ok) throw new Error('Failed to fetch ratings');

      const data = await response.json();
      setRatings(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch ratings';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createRating = useCallback(async (ratingData: Omit<Rating, 'id' | 'created_at'>) => {
    setLoading(true);
    setError(null);
    try {
      if (ratingData.rating < 1 || ratingData.rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ratingData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create rating');
      }

      const newRating = await response.json();
      setRatings([...ratings, newRating]);
      return newRating;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create rating';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [ratings]);

  const getAverageRating = useCallback(() => {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / ratings.length) * 10) / 10;
  }, [ratings]);

  const getRatingDistribution = useCallback(() => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach(r => {
      distribution[r.rating as keyof typeof distribution]++;
    });
    return distribution;
  }, [ratings]);

  return {
    ratings,
    loading,
    error,
    fetchPropertyRatings,
    createRating,
    getAverageRating,
    getRatingDistribution
  };
}
