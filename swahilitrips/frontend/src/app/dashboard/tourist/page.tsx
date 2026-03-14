'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import type { User } from '@/lib/api';
import type { Booking } from '@/lib/api';

export default function TouristDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    api.get<User>('/api/users/me').then(setUser).catch(() => setUser(null));
  }, []);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings-mine'],
    queryFn: () => api.get<Booking[]>('/api/bookings/mine'),
    enabled: !!user,
  });

  if (user === null) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-600 mb-4">You must be logged in as a tourist to view this page.</p>
        <Link href="/auth/login" className="btn-primary">Log in</Link>
      </div>
    );
  }

  if (user?.role !== 'tourist') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-600">This dashboard is for tourists.</p>
        <Link href="/" className="text-ocean font-medium mt-2 inline-block">Go home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean/10 via-white to-palm/10 py-12 px-2 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">My Trips</h1>
        <p className="text-lg text-gray-600 mb-8">Hello, <span className="font-semibold text-ocean">{user.name}</span>. Here are your bookings.</p>

        <section className="glass-card p-6 mb-10 shadow-md rounded-xl bg-white/80">
          <h2 className="font-bold text-xl text-ocean mb-4">Profile</h2>
          <p><strong>Email:</strong> {user.email}</p>
          {user.phone && <p><strong>Phone:</strong> {user.phone}</p>}
          <Link href="/explore" className="btn-primary mt-4 inline-block">Explore more trips</Link>
        </section>

        <section>
          <h2 className="font-bold text-xl text-ocean mb-4">My Bookings</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="glass-card h-24 animate-pulse shadow-md rounded-xl" />)}
            </div>
          ) : bookings.length === 0 ? (
            <div className="glass-card p-8 text-center shadow-md rounded-xl">
              <p className="text-gray-600 mb-4">You haven’t made any bookings yet.</p>
              <Link href="/explore" className="btn-primary inline-flex items-center gap-2">
                Explore trips <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((b) => (
                <div key={b.id} className="glass-card p-4 flex flex-wrap items-center justify-between gap-4 shadow-md rounded-xl hover:shadow-lg transition-all duration-200 bg-white/80">
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">{b.boat_name} — {b.trip_type?.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4" /> {new Date(b.booking_date).toLocaleDateString()} • {b.passenger_count} passenger{b.passenger_count !== 1 ? 's' : ''}
                    </p>
                    {b.owner_name && (
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-4 h-4" /> {b.owner_name}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-ocean">KES {Number(b.total_price).toLocaleString()}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                      b.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                      b.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      b.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
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
