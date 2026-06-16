'use client';

import { useState, useCallback } from 'react';

interface Booking {
  id: string;
  property_id: string;
  guest_id: string;
  host_id: string;
  check_in: string;
  check_out: string;
  total_price: number;
  nights: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  guest_name: string;
  guest_email: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async (userId: string, role: 'guest' | 'host') => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/bookings?user_id=${userId}&role=${role}`);
      if (!response.ok) throw new Error('Failed to fetch bookings');

      const data = await response.json();
      setBookings(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch bookings';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getBooking = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/bookings/${id}`);
      if (!response.ok) throw new Error('Failed to fetch booking');

      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch booking';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createBooking = useCallback(async (bookingData: Omit<Booking, 'id' | 'nights' | 'status' | 'created_at' | 'updated_at'>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create booking');
      }

      const newBooking = await response.json();
      setBookings([...bookings, newBooking]);
      return newBooking;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create booking';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [bookings]);

  const updateBookingStatus = useCallback(async (bookingId: string, status: 'pending' | 'confirmed' | 'cancelled', userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, user_id: userId })
      });

      if (!response.ok) throw new Error('Failed to update booking');

      const updated = await response.json();
      setBookings(bookings.map(b => b.id === bookingId ? updated : b));
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update booking';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [bookings]);

  return {
    bookings,
    loading,
    error,
    fetchBookings,
    getBooking,
    createBooking,
    updateBookingStatus
  };
}
