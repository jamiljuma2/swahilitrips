'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, CalendarCheck, DollarSign, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import type { User } from '@/lib/api';

type Analytics = {
  total_bookings: number;
  total_revenue: number;
  total_commission: number;
  total_users: number;
};

export default function AdminDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    api.get<User>('/api/users/me').then(setUser).catch(() => setUser(null));
  }, []);

  const { data: analytics } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => api.get<Analytics>('/api/admin/analytics'),
    enabled: !!user && user.role === 'admin',
  });

  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get<User[]>('/api/admin/users'),
    enabled: !!user && user.role === 'admin',
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: () => api.get<any[]>('/api/admin/bookings'),
    enabled: !!user && user.role === 'admin',
  });

  if (user === null) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-600 mb-4">You must be logged in to view this page.</p>
        <a href="/auth/login" className="btn-primary">Log in</a>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-600">This area is for administrators only.</p>
        <a href="/" className="text-ocean font-medium mt-2 inline-block">Go home</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean/10 via-white to-palm/10 py-12 px-2 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Admin Dashboard</h1>
        <p className="text-lg text-gray-600 mb-8">Hello, <span className="font-semibold text-ocean">{user.name}</span>.</p>

        {analytics && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="glass-card p-6 shadow-lg hover:shadow-xl transition-all duration-200 bg-white/80 rounded-xl">
              <CalendarCheck className="w-8 h-8 text-ocean mb-2" />
              <p className="text-3xl font-bold text-gray-900">{analytics.total_bookings}</p>
              <p className="text-sm text-gray-600">Total bookings</p>
            </div>
            <div className="glass-card p-6 shadow-lg hover:shadow-xl transition-all duration-200 bg-white/80 rounded-xl">
              <DollarSign className="w-8 h-8 text-palm mb-2" />
              <p className="text-3xl font-bold text-gray-900">KES {analytics.total_revenue.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Revenue</p>
            </div>
            <div className="glass-card p-6 shadow-lg hover:shadow-xl transition-all duration-200 bg-white/80 rounded-xl">
              <TrendingUp className="w-8 h-8 text-coral mb-2" />
              <p className="text-3xl font-bold text-gray-900">KES {analytics.total_commission.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Platform commission</p>
            </div>
            <div className="glass-card p-6 shadow-lg hover:shadow-xl transition-all duration-200 bg-white/80 rounded-xl">
              <Users className="w-8 h-8 text-ocean mb-2" />
              <p className="text-3xl font-bold text-gray-900">{analytics.total_users}</p>
              <p className="text-sm text-gray-600">Users</p>
            </div>
          </section>
        )}

        <section className="mb-10">
          <h2 className="font-bold text-xl text-ocean mb-4">Users</h2>
          <div className="glass-card overflow-hidden shadow-md rounded-xl">
            <table className="w-full text-left">
              <thead className="bg-ocean/10">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Approved</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-gray-100 hover:bg-ocean/5 transition">
                    <td className="px-4 py-3">{u.name}</td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3 capitalize">{u.role}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${u.approved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{u.approved ? 'Yes' : 'No'}</span>
                    </td>
                    <td className="px-4 py-3">
                      {u.role === 'boat_owner' && !u.approved && (
                        <button
                          className="text-palm font-medium hover:underline hover:text-palm-dark transition"
                          onClick={async () => {
                            await api.put(`/api/admin/users/${u.id}/approve`, {});
                            window.location.reload();
                          }}
                        >
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="font-bold text-xl text-ocean mb-4">Recent bookings</h2>
          <div className="glass-card overflow-hidden shadow-md rounded-xl">
            <table className="w-full text-left">
              <thead className="bg-ocean/10">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tourist</th>
                  <th className="px-4 py-3 font-semibold">Trip</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.slice(0, 20).map((b) => (
                  <tr key={b.id} className="border-t border-gray-100 hover:bg-palm/5 transition">
                    <td className="px-4 py-3">{b.tourist_name}</td>
                    <td className="px-4 py-3">{b.boat_name} — {b.trip_type}</td>
                    <td className="px-4 py-3">{new Date(b.booking_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">KES {Number(b.total_price).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${b.payment_status === 'paid' ? 'bg-green-100 text-green-800' : b.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : b.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{b.payment_status === 'paid' ? 'Paid' : b.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
