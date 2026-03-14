'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Clock, Star } from 'lucide-react';
import type { Trip } from '@/lib/api';

const TRIP_LABELS: Record<string, string> = {
  boat_ride: 'Boat ride',
  island_tour: 'Island tour',
  fishing_trip: 'Fishing trip',
  dhow_sunset_cruise: 'Dhow sunset cruise',
  snorkeling: 'Snorkeling',
  inter_island_transport: 'Inter-island transport',
};

export default function TripCard({ trip }: { trip: Trip }) {
  const img = trip.photos?.[0] || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80';
  const label = TRIP_LABELS[trip.trip_type] || trip.trip_type;

  return (
    <Link href={`/trips/${trip.id}`} className="group block">
      <article className="glass-card overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
        <div className="relative h-48 bg-ocean/20">
          <Image
            src={img}
            alt={trip.boat_name || 'Trip'}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, 400px"
          />
          <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-palm/90 text-white text-sm font-medium">
            {label}
          </div>
          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
            {trip.boat_location && (
              <span className="flex items-center gap-1 text-white text-sm drop-shadow">
                <MapPin className="w-4 h-4" /> {trip.boat_location}
              </span>
            )}
            {typeof trip.avg_rating === 'number' && (
              <span className="flex items-center gap-1 bg-white/90 rounded-full px-2 py-0.5 text-sm">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> {trip.avg_rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-lg text-gray-900 group-hover:text-ocean transition-colors">
            {trip.boat_name || 'Trip'}
          </h3>
          <p className="text-gray-600 text-sm flex items-center gap-1 mt-1">
            <Clock className="w-4 h-4" /> {trip.duration_hours}h • {trip.owner_name}
          </p>
          <p className="mt-3 text-ocean font-bold text-xl">
            KES {Number(trip.price).toLocaleString()}
            <span className="text-gray-500 font-normal text-sm"> / person</span>
          </p>
        </div>
      </article>
    </Link>
  );
}
