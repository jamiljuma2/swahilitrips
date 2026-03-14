'use client';

import { Star } from 'lucide-react';
import type { Review } from '@/lib/api';

export default function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="glass-card p-6 shadow-md rounded-xl transition-all duration-200 hover:shadow-lg bg-white/80">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex text-amber-500">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className={`w-5 h-5 ${i <= review.rating ? 'fill-amber-500' : 'text-gray-200'}`}
            />
          ))}
        </div>
        <span className="text-base font-semibold text-ocean">{review.user_name || 'Guest'}</span>
        <span className="text-xs text-gray-500">
          {new Date(review.created_at).toLocaleDateString()}
        </span>
      </div>
      {review.comment && <p className="text-gray-700 text-base mt-2">{review.comment}</p>}
    </div>
  );
}
