'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { Anchor, MapPin, Sun } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import SearchBar from '@/components/SearchBar';
import TripCard from '@/components/TripCard';
import { api } from '@/lib/api';
import type { Trip } from '@/lib/api';

export default function HomePage() {
  const { data: trips = [] } = useQuery({
    queryKey: ['trips-featured'],
    queryFn: () => api.get<Trip[]>('/api/trips'),
  });
  const featured = trips.slice(0, 6);

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean/10 via-white to-palm/10">
      <section className="relative bg-hero-gradient text-white py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1920')] bg-cover bg-center opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-4 drop-shadow-lg tracking-tight">
            Discover Lamu & Manda
          </h1>
          <p className="text-2xl md:text-3xl text-white/95 mb-8 max-w-2xl mx-auto">
            Book boat rides, island tours, fishing trips, dhow sunset cruises & snorkeling.<br />
            <span className="text-palm font-semibold">15% platform fee</span>.
          </p>
          <div className="max-w-3xl mx-auto">
            <Suspense fallback={<div className="h-20 rounded-2xl bg-white/20 animate-pulse" />}>
              <SearchBar />
            </Suspense>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-center gap-3 mb-8">
          <Anchor className="w-8 h-8 text-ocean" />
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Featured Trips</h2>
        </div>
        {featured.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featured.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 text-center shadow-md rounded-xl">
            <p className="text-gray-600 mb-4">No trips listed yet. Be the first to explore!</p>
            <Link href="/explore" className="btn-primary inline-block">
              Explore all trips
            </Link>
          </div>
        )}
        <div className="mt-12 text-center">
          <Link href="/explore" className="text-ocean font-semibold hover:underline text-lg">
            View all trips →
          </Link>
        </div>
      </section>

      <section className="bg-ocean/5 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-12 tracking-tight">Why SwahiliTrips?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="glass-card p-8 text-center shadow-md rounded-xl hover:shadow-lg transition-all duration-200 bg-white/80">
              <MapPin className="w-14 h-14 text-ocean mx-auto mb-3" />
              <h3 className="font-bold text-xl text-ocean">Lamu & Manda</h3>
              <p className="text-gray-600 mt-1">Coastal experiences on the islands you love.</p>
            </div>
            <div className="glass-card p-8 text-center shadow-md rounded-xl hover:shadow-lg transition-all duration-200 bg-white/80">
              <Anchor className="w-14 h-14 text-palm mx-auto mb-3" />
              <h3 className="font-bold text-xl text-palm">Boat Owners</h3>
              <p className="text-gray-600 mt-1">List your boats and trips. We handle bookings & payments.</p>
            </div>
            <div className="glass-card p-8 text-center shadow-md rounded-xl hover:shadow-lg transition-all duration-200 bg-white/80">
              <Sun className="w-14 h-14 text-coral mx-auto mb-3" />
              <h3 className="font-bold text-xl text-coral">M-Pesa</h3>
              <p className="text-gray-600 mt-1">Pay easily with M-Pesa. <span className="font-semibold text-palm">15% platform commission</span>.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
