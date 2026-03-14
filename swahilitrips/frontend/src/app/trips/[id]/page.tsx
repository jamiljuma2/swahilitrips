'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Clock, Star, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import type { Trip } from '@/lib/api';
import MapView from '@/components/MapView';
import WeatherWidget from '@/components/WeatherWidget';
import BoatTracker from '@/components/BoatTracker';
import BookingForm from '@/components/BookingForm';
import ReviewCard from '@/components/ReviewCard';
import ReviewForm from '@/components/ReviewForm';

const TRIP_LABELS: Record<string, string> = {
  boat_ride: 'Boat ride',
  island_tour: 'Island tour',
  fishing_trip: 'Fishing trip',
  dhow_sunset_cruise: 'Dhow sunset cruise',
  snorkeling: 'Snorkeling',
  inter_island_transport: 'Inter-island transport',
};

export default function TripDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: trip, isLoading } = useQuery({
    queryKey: ['trip', id],
    queryFn: () => api.get<Trip & { reviews?: Trip['reviews']; owner_phone?: string }>(`/api/trips/${id}`),
  });

  if (isLoading || !trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ocean/10 via-white to-palm/10">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse h-96 glass-card rounded-2xl" />
        </div>
      </div>
    );
  }

  const img = trip.photos?.[0] || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80';
  const label = TRIP_LABELS[trip.trip_type] || trip.trip_type;
  const lat = -2.269;
  const lon = 40.9;

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean/10 via-white to-palm/10 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <Link href="/explore" className="inline-flex items-center gap-2 text-ocean font-medium mb-8 hover:underline text-lg">
          <ArrowLeft className="w-5 h-5" /> Back to explore
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <div className="glass-card overflow-hidden shadow-lg rounded-xl">
              <div className="relative h-72 md:h-96">
                <Image src={img} alt={trip.boat_name || 'Trip'} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 66vw" priority />
                <div className="absolute top-4 left-4 px-3 py-1 rounded-lg bg-palm text-white font-medium text-lg">
                  {label}
                </div>
              </div>
              <div className="p-8">
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">{trip.boat_name}</h1>
                <p className="text-gray-600 mt-2 flex items-center gap-6 text-lg">
                  <span className="flex items-center gap-1">
                    <Clock className="w-5 h-5" /> {trip.duration_hours} hours
                  </span>
                  {trip.boat_location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-5 h-5" /> {trip.boat_location}
                    </span>
                  )}
                  {typeof trip.avg_rating === 'number' && (
                    <span className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> {trip.avg_rating.toFixed(1)} ({trip.review_count || 0})
                    </span>
                  )}
                </p>
                <p className="mt-4 text-gray-700 text-lg">{trip.description}</p>
                <p className="mt-2 text-sm text-gray-500">By {trip.owner_name}</p>
              </div>
            </div>

            <MapView lat={lat} lng={lon} />
            <WeatherWidget lat={lat} lon={lon} />
            <BoatTracker boatId={trip.boat_id} />

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 tracking-tight">Reviews</h2>
              {trip.reviews?.length ? (
                <div className="space-y-4">
                  {trip.reviews.map((r) => (
                    <ReviewCard key={r.id} review={r} />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No reviews yet.</p>
              )}
              <div className="mt-6">
                <ReviewForm tripId={trip.id} />
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="glass-card p-8 mb-8 shadow-md rounded-xl">
                <p className="text-4xl font-extrabold text-ocean mb-2">
                  KES {Number(trip.price).toLocaleString()}
                  <span className="text-lg font-normal text-gray-500"> / person</span>
                </p>
              </div>
              <BookingForm
                tripId={trip.id}
                pricePerPerson={Number(trip.price)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
