'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Star } from 'lucide-react';
import { api } from '@/lib/api';

const schema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ReviewForm({
  tripId,
  onSubmitted,
}: {
  tripId: string;
  onSubmitted?: () => void;
}) {
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { rating: 5 },
  });
  const rating = watch('rating');

  const onSubmit = async (data: FormData) => {
    try {
      await api.post('/api/reviews', { trip_id: tripId, rating: data.rating, comment: data.comment });
      setSubmitted(true);
      onSubmitted?.();
    } catch (e) {
      alert((e as Error).message || 'Failed to submit review');
    }
  };

  if (submitted) return <p className="text-green-600 font-semibold text-lg">Thanks for your review!</p>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-6 space-y-6 shadow-md rounded-xl bg-white/80">
      <h4 className="font-bold text-xl text-ocean mb-2">Write a review</h4>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setValue('rating', i)}
              className="p-1 focus:outline-none"
            >
              <Star
                className={`w-8 h-8 ${i <= rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`}
              />
            </button>
          ))}
        </div>
        <input type="hidden" {...register('rating', { valueAsNumber: true })} />
        {errors.rating && <p className="text-red-500 text-sm mt-1">{errors.rating.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Comment (optional)</label>
        <textarea
          {...register('comment')}
          rows={3}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-ocean transition"
        />
      </div>
      <button type="submit" disabled={isSubmitting} className="btn-secondary">
        {isSubmitting ? 'Submitting…' : 'Submit review'}
      </button>
    </form>
  );
}
