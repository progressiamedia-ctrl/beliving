'use client'

import { useState } from 'react'

interface BookingCalendarProps {
  propertyId: string
  nightlyPrice: number
  bookedDates: string[] // ISO dates that are already booked
  onConfirmBooking: (data: BookingData) => void
  isLoading?: boolean
}

export interface BookingData {
  checkIn: Date
  checkOut: Date
  nights: number
  totalPrice: number
  serviceFeePct: number
  serviceFee: number
}

export function BookingCalendar({ propertyId, nightlyPrice, bookedDates, onConfirmBooking, isLoading }: BookingCalendarProps) {
  const [checkIn, setCheckIn] = useState<Date | null>(null)
  const [checkOut, setCheckOut] = useState<Date | null>(null)
  const [month, setMonth] = useState(new Date())

  const isDateBooked = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return bookedDates.includes(dateStr)
  }

  const isDateDisabled = (date: Date) => {
    // Can't book in the past
    if (date < new Date()) {
      const today = new Date()
      return date.getFullYear() === today.getFullYear() &&
             date.getMonth() === today.getMonth() &&
             date.getDate() < today.getDate()
    }
    return isDateBooked(date)
  }

  const isDateInRange = (date: Date) => {
    if (!checkIn) return false
    if (!checkOut) return date >= checkIn
    return date >= checkIn && date <= checkOut
  }

  const calculateBooking = (start: Date, end: Date) => {
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const serviceFeePercentage = 5
    const subtotal = nights * nightlyPrice
    const serviceFee = subtotal * (serviceFeePercentage / 100)
    const total = subtotal + serviceFee

    return {
      checkIn: start,
      checkOut: end,
      nights,
      totalPrice: total,
      serviceFeePct: serviceFeePercentage,
      serviceFee,
    }
  }

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return

    // If no check-in selected, set it
    if (!checkIn) {
      setCheckIn(date)
      setCheckOut(null)
      return
    }

    // If check-in is selected but date is earlier, replace check-in
    if (date < checkIn) {
      setCheckIn(date)
      setCheckOut(null)
      return
    }

    // If date is same as check-in, reset
    if (date.getTime() === checkIn.getTime()) {
      setCheckIn(null)
      setCheckOut(null)
      return
    }

    // Otherwise set check-out
    setCheckOut(date)
  }

  const handleConfirm = () => {
    if (!checkIn || !checkOut) return
    const booking = calculateBooking(checkIn, checkOut)
    onConfirmBooking(booking)
  }

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay()

  const daysInMonth = getDaysInMonth(month)
  const firstDay = getFirstDayOfMonth(month)
  const days = []

  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }

  // Days of month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(month.getFullYear(), month.getMonth(), i))
  }

  const booking = checkIn && checkOut ? calculateBooking(checkIn, checkOut) : null

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1))}
          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition"
        >
          ← Anterior
        </button>
        <h3 className="text-lg font-medium text-black dark:text-white">
          {monthNames[month.getMonth()]} {month.getFullYear()}
        </h3>
        <button
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1))}
          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition"
        >
          Siguiente →
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sab'].map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 py-2">
            {day}
          </div>
        ))}

        {/* Days */}
        {days.map((date, idx) => {
          if (!date) {
            return <div key={`empty-${idx}`} className="aspect-square" />
          }

          const disabled = isDateDisabled(date)
          const isStart = checkIn && date.getTime() === checkIn.getTime()
          const isEnd = checkOut && date.getTime() === checkOut.getTime()
          const inRange = isDateInRange(date)
          const booked = isDateBooked(date)

          return (
            <button
              key={date.toISOString()}
              onClick={() => handleDateClick(date)}
              disabled={disabled}
              className={`aspect-square rounded-lg text-sm font-medium transition flex items-center justify-center relative ${
                disabled
                  ? 'bg-gray-100 dark:bg-gray-900 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : isStart || isEnd
                    ? 'bg-black dark:bg-white text-white dark:text-black'
                    : inRange
                      ? 'bg-gray-200 dark:bg-gray-800 text-black dark:text-white'
                      : 'bg-white dark:bg-gray-950 text-black dark:text-white border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white'
              }`}
            >
              {date.getDate()}
              {booked && (
                <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-red-500 rounded-full" />
              )}
            </button>
          )
        })}
      </div>

      {/* Booking Summary */}
      {booking && (
        <div className="border-t border-gray-200 dark:border-gray-800 pt-6 space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Check-in</span>
              <span className="text-black dark:text-white font-medium">
                {booking.checkIn.toLocaleDateString('es-ES')}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Check-out</span>
              <span className="text-black dark:text-white font-medium">
                {booking.checkOut.toLocaleDateString('es-ES')}
              </span>
            </div>
            <div className="flex justify-between text-sm border-t border-gray-200 dark:border-gray-800 pt-3">
              <span className="text-gray-600 dark:text-gray-400">{booking.nights} noches × ${nightlyPrice}</span>
              <span className="text-black dark:text-white font-medium">${(booking.nights * nightlyPrice).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Fee de servicio ({booking.serviceFeePct}%)</span>
              <span className="text-black dark:text-white font-medium">${booking.serviceFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-medium border-t border-gray-200 dark:border-gray-800 pt-3 text-black dark:text-white">
              <span>Total</span>
              <span className="text-xl">${booking.totalPrice.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full bg-black dark:bg-white text-white dark:text-black py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition disabled:opacity-50"
          >
            {isLoading ? 'Procesando...' : 'Confirmar Reserva'}
          </button>
        </div>
      )}

      {checkIn && !checkOut && (
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Selecciona la fecha de salida
        </div>
      )}

      {!checkIn && (
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Selecciona la fecha de entrada
        </div>
      )}
    </div>
  )
}
