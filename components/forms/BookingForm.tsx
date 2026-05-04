'use client';

import { useState } from 'react';
import { useBookings } from '@/lib/hooks';

interface BookingFormProps {
  propertyId: string;
  propertyPrice: number;
  hostId: string;
  guestId: string;
  guestName: string;
  guestEmail: string;
  onSuccess?: (booking: any) => void;
}

export function BookingForm({
  propertyId,
  propertyPrice,
  hostId,
  guestId,
  guestName,
  guestEmail,
  onSuccess
}: BookingFormProps) {
  const { createBooking, loading } = useBookings();

  const [formData, setFormData] = useState({
    checkIn: '',
    checkOut: '',
    notes: ''
  });

  const [error, setError] = useState<string | null>(null);

  const calculateNights = (): number => {
    if (!formData.checkIn || !formData.checkOut) return 0;
    const checkIn = new Date(formData.checkIn);
    const checkOut = new Date(formData.checkOut);
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();
  const totalPrice = nights * propertyPrice;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.checkIn || !formData.checkOut) {
      setError('Por favor selecciona fechas de entrada y salida');
      return;
    }

    if (new Date(formData.checkOut) <= new Date(formData.checkIn)) {
      setError('La fecha de salida debe ser después de la entrada');
      return;
    }

    const booking = await createBooking({
      property_id: propertyId,
      guest_id: guestId,
      host_id: hostId,
      check_in: formData.checkIn,
      check_out: formData.checkOut,
      total_price: totalPrice,
      guest_name: guestName,
      guest_email: guestEmail,
      notes: formData.notes
    });

    if (booking) {
      setFormData({
        checkIn: '',
        checkOut: '',
        notes: ''
      });
      onSuccess?.(booking);
    } else {
      setError('Error al crear la reserva. Por favor intenta de nuevo.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
      <h3 className="text-lg font-semibold mb-4">Hacer una reserva</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Check-in *</label>
          <input
            type="date"
            name="checkIn"
            value={formData.checkIn}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Check-out *</label>
          <input
            type="date"
            name="checkOut"
            value={formData.checkOut}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Notas (opcional)</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          placeholder="Ej: Llegada tarde, tengo mascotas..."
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        <div className="flex justify-between">
          <span>${propertyPrice}/noche</span>
          <span>{nights} noche{nights !== 1 ? 's' : ''}</span>
        </div>
        <div className="border-t border-gray-300 pt-2 flex justify-between font-semibold">
          <span>Total</span>
          <span>${totalPrice}</span>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">{error}</div>}

      <button
        type="submit"
        disabled={loading || nights === 0}
        className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? 'Creando reserva...' : `Reservar - $${totalPrice}`}
      </button>
    </form>
  );
}
