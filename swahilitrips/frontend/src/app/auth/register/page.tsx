'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Anchor } from 'lucide-react';
import { api } from '@/lib/api';

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email(),
  password: z.string().min(6, 'At least 6 characters'),
  role: z.enum(['tourist', 'boat_owner']),
  phone: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'tourist' },
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const res = await api.post<{ token: string; user: { role: string; approved?: boolean } }>(
        '/api/auth/register',
        data,
        false
      );
      localStorage.setItem('token', res.token);
      if (res.user.role === 'boat_owner' && !res.user.approved) {
        router.push('/dashboard/owner?pending=1');
        return;
      }
      if (res.user.role === 'tourist') router.push('/dashboard/tourist');
      else router.push('/dashboard/owner');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean/10 via-white to-palm/10 flex items-center justify-center px-4 py-12">
      <div className="glass-card w-full max-w-md p-8 shadow-lg rounded-xl">
        <Link href="/" className="flex items-center gap-2 text-ocean font-bold text-2xl mb-8">
          <Anchor className="w-8 h-8" /> SwahiliTrips
        </Link>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6 tracking-tight">Sign up</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              {...register('name')}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-ocean transition"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              {...register('email')}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-ocean transition"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
            <input
              type="tel"
              {...register('phone')}
              placeholder="+254700000000"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-ocean transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              {...register('password')}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-ocean transition"
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">I am a</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" value="tourist" {...register('role')} className="text-ocean" />
                Tourist
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" value="boat_owner" {...register('role')} className="text-ocean" />
                Boat owner
              </label>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Creating account…' : 'Sign up'}
          </button>
        </form>
        <p className="mt-6 text-center text-gray-600">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-ocean font-semibold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
