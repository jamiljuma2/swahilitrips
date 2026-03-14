'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import PaymentModal from './PaymentModal';

const schema = z.object({
  booking_date: z.string().min(1, 'Pick a date'),
  passenger_count: z.number().min(1).max(50),
});

type FormData = z.infer<typeof schema>;

export default function BookingForm({
  tripId,
  pricePerPerson,
  onBooked,
}: {
  tripId: string;
  pricePerPerson: number;
  onBooked?: () => void;
}) {
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-8 space-y-6 shadow-md rounded-xl bg-white/80">
        <h3 className="font-bold text-2xl text-ocean mb-2">Book this trip</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            min={minDate}
            {...register('booking_date')}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-ocean transition"
          />
          {errors.booking_date && (
            <p className="text-red-500 text-sm mt-1">{errors.booking_date.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Passengers</label>
          <input
            type="number"
            min={1}
            max={50}
            {...register('passenger_count', { valueAsNumber: true })}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-ocean transition"
          />
          {errors.passenger_count && (
            <p className="text-red-500 text-sm mt-1">{errors.passenger_count.message}</p>
          )}
        </div>
        <p className="text-base text-gray-500">
          KES {pricePerPerson.toLocaleString()} × passengers + <span className="font-semibold text-palm">15% platform fee</span>
        </p>
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? 'Booking…' : 'Book & Pay with M-Pesa'}
        </button>
      </form>

      {showPayment && bookingId && (
        <PaymentModal
          bookingId={bookingId}
          onClose={() => {
            setShowPayment(false);
            onBooked?.();
          }}
        />
      )}
    </>
  );
// Duplicate JSX removed
