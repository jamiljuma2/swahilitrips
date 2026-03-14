'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import SearchBar from '@/components/SearchBar';
import TripCard from '@/components/TripCard';
import { api } from '@/lib/api';
import type { Trip } from '@/lib/api';

function ExploreContent() {
  const searchParams = useSearchParams();
  const category = searchParams.get('category') || '';
  const location = searchParams.get('location') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (location) params.set('location', location);
  if (minPrice) params.set('minPrice', minPrice);
  if (maxPrice) params.set('maxPrice', maxPrice);
  const queryString = params.toString();

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ['trips', queryString],
    queryFn: () => api.get<Trip[]>(`/api/trips?${queryString}`),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean/10 via-white to-palm/10 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 tracking-tight">Explore Trips</h1>
        <SearchBar />
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card h-80 animate-pulse shadow-md rounded-xl" />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div className="glass-card p-12 text-center mt-10 shadow-md rounded-xl">
            <p className="text-gray-600">No trips match your filters. Try different criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8 animate-pulse h-64" />}>
      <ExploreContent />
    </Suspense>
  );
}
