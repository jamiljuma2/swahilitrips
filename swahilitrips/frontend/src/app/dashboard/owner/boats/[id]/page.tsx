'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import type { Boat } from '@/lib/api';

const TRIP_TYPES = [
  'boat_ride',
  'island_tour',
  'fishing_trip',
  'dhow_sunset_cruise',
  'snorkeling',
  'inter_island_transport',
];

export default function ManageBoatPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: boat, isLoading } = useQuery({
    queryKey: ['boat', id],
    queryFn: async () => {
      const boats = await api.get<Boat[]>('/api/boats/mine');
      const b = boats.find((x) => x.id === id);
      if (!b) throw new Error('Boat not found');
      return b;
    },
  });

  if (isLoading || !boat) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ocean/10 via-white to-palm/10 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full mx-auto">
          <div className="animate-pulse h-48 glass-card rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean/10 via-white to-palm/10 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full mx-auto">
        <Link href="/dashboard/owner" className="inline-flex items-center gap-2 text-ocean font-medium mb-8 hover:underline text-lg">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>
        <div className="glass-card p-8 mb-8 shadow-lg rounded-xl">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">{boat.boat_name}</h1>
          <p className="text-gray-600 mt-1 text-lg">Capacity: {boat.capacity} • {boat.location || 'No location'}</p>
          {boat.description && <p className="mt-4 text-gray-700 text-lg">{boat.description}</p>}
        </div>
        <p className="text-gray-600 mb-6 text-lg">
          To add trips (boat ride, island tour, etc.) for this boat, use the API or add a <span className="font-semibold text-ocean">Add trip</span> form here. For now, you can manage boats from the dashboard.
        </p>
        <Link href="/dashboard/owner" className="btn-secondary inline-flex items-center gap-2">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
