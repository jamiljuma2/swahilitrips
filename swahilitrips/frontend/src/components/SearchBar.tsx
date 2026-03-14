'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';

const TRIP_TYPES = [
  { value: '', label: 'All trips' },
  { value: 'boat_ride', label: 'Boat ride' },
  { value: 'island_tour', label: 'Island tour' },
  { value: 'fishing_trip', label: 'Fishing trip' },
  { value: 'dhow_sunset_cruise', label: 'Dhow sunset cruise' },
  { value: 'snorkeling', label: 'Snorkeling' },
  { value: 'inter_island_transport', label: 'Inter-island transport' },
];

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (location) params.set('location', location);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    router.push(`/explore?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="glass-card p-4 md:p-6 flex flex-col md:flex-row gap-4 flex-wrap">
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="rounded-xl border border-gray-200 px-4 py-3 bg-white/80 focus:ring-2 focus:ring-ocean text-gray-800"
      >
        {TRIP_TYPES.map(({ value, label }) => (
          <option key={value || 'all'} value={value}>{label}</option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Location (e.g. Lamu)"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="rounded-xl border border-gray-200 px-4 py-3 bg-white/80 focus:ring-2 focus:ring-ocean flex-1 min-w-[160px] text-gray-800"
      />
      <input
        type="number"
        placeholder="Min price"
        value={minPrice}
        onChange={(e) => setMinPrice(e.target.value)}
        min={0}
        className="rounded-xl border border-gray-200 px-4 py-3 bg-white/80 w-28 focus:ring-2 focus:ring-ocean text-gray-800"
      />
      <input
        type="number"
        placeholder="Max price"
        value={maxPrice}
        onChange={(e) => setMaxPrice(e.target.value)}
        min={0}
        className="rounded-xl border border-gray-200 px-4 py-3 bg-white/80 w-28 focus:ring-2 focus:ring-ocean text-gray-800"
      />
      <button type="submit" className="btn-primary flex items-center justify-center gap-2">
        <Search className="w-5 h-5" /> Search
      </button>
    </form>
  );
}
