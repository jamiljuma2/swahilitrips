'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Anchor, Calendar, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import type { User } from '@/lib/api';
import type { Boat } from '@/lib/api';
import type { Booking } from '@/lib/api';

function OwnerDashboardContent() {
  const searchParams = useSearchParams();
  const pending = searchParams.get('pending');
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    api.get<User>('/api/users/me').then(setUser).catch(() => setUser(null));
  }, []);

  const { data: boats = [] } = useQuery({
    queryKey: ['boats-mine'],
    queryFn: () => api.get<Boat[]>('/api/boats/mine'),
    enabled: !!user && user.role === 'boat_owner',
  });

  const { data: incoming = [] } = useQuery({
    queryKey: ['bookings-incoming'],
    queryFn: () => api.get<Booking[]>('/api/bookings/incoming'),
    enabled: !!user && user.role === 'boat_owner',
  });

  if (user === null) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-600 mb-4">You must be logged in to view this page.</p>
        <Link href="/auth/login" className="btn-primary">Log in</Link>
      </div>
    );
  }

  if (user?.role !== 'boat_owner') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-600">This dashboard is for boat owners.</p>
        <Link href="/" className="text-ocean font-medium mt-2 inline-block">Go home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean/10 via-white to-palm/10 py-12 px-2 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {pending && !user.approved && (
          <div className="glass-card p-4 mb-6 bg-amber-50 border-amber-200 shadow-md rounded-xl">
            <p className="text-amber-800 font-medium">Your account is pending approval. An admin will approve you soon.</p>
          </div>
        )}

        <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Boat Owner Dashboard</h1>
        <p className="text-lg text-gray-600 mb-8">Hello, <span className="font-semibold text-ocean">{user.name}</span>.</p>

        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-xl text-ocean flex items-center gap-2">
              <Anchor className="w-5 h-5" /> My Boats
            </h2>
            <Link href="/dashboard/owner/boats/new" className="btn-primary flex items-center gap-2">
              <Plus className="w-5 h-5" /> Add boat
            </Link>
          </div>
          {boats.length === 0 ? (
            <div className="glass-card p-8 text-center shadow-md rounded-xl">
              <p className="text-gray-600 mb-4">You haven’t added any boats yet.</p>
              <Link href="/dashboard/owner/boats/new" className="btn-primary inline-flex items-center gap-2">
                Add your first boat
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {boats.map((boat) => (
                <div key={boat.id} className="glass-card p-4 flex flex-wrap items-center justify-between gap-4 shadow-md rounded-xl hover:shadow-lg transition-all duration-200 bg-white/80">
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">{boat.boat_name}</p>
                    <p className="text-sm text-gray-600">Capacity: {boat.capacity} • {boat.location || 'No location'}</p>
                  </div>
                  <Link href={`/dashboard/owner/boats/${boat.id}`} className="text-ocean font-medium hover:underline hover:text-palm transition">
                    Manage →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-bold text-xl text-ocean flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5" /> Incoming Bookings
          </h2>
          {incoming.length === 0 ? (
            <div className="glass-card p-6 text-center shadow-md rounded-xl">
              <p className="text-gray-600">No incoming bookings yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {incoming.map((b) => (
                <div key={b.id} className="glass-card p-4 flex flex-wrap items-center justify-between gap-4 shadow-md rounded-xl hover:shadow-lg transition-all duration-200 bg-white/80">
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">{b.boat_name} — {b.trip_type?.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-gray-600">
                      {b.tourist_name} • {new Date(b.booking_date).toLocaleDateString()} • {b.passenger_count} pax
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-ocean">KES {Number(b.total_price).toLocaleString()}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      b.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {b.payment_status === 'paid' ? 'Paid' : b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function OwnerDashboardPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 py-8 animate-pulse h-64" />}>
      <OwnerDashboardContent />
    </Suspense>
  );
}
