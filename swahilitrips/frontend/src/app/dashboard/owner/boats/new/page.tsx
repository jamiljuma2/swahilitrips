'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';

const schema = z.object({
  boat_name: z.string().min(1, 'Boat name required'),
  capacity: z.number().min(1).max(200),
  description: z.string().optional(),
  location: z.string().optional(),
  price_per_person: z.number().min(0).optional(),
  photos: z.any().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewBoatPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { capacity: 10, price_per_person: 0 },
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const formData = new FormData();
      formData.append('boat_name', data.boat_name);
      formData.append('capacity', String(data.capacity));
      if (data.description) formData.append('description', data.description);
      if (data.location) formData.append('location', data.location);
      if (data.price_per_person !== undefined) formData.append('price_per_person', String(data.price_per_person));
      formData.append('is_active', 'true');
      selectedFiles.forEach((file, idx) => {
        formData.append('photos', file);
      });
      const boat = await api.post<{ id: string }>('/api/boats', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      router.push(`/dashboard/owner/boats/${boat.id}`);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean/10 via-white to-palm/10 flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full mx-auto">
        <Link href="/dashboard/owner" className="inline-flex items-center gap-2 text-ocean font-medium mb-8 hover:underline text-lg">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8 tracking-tight">Add a Boat</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-8 space-y-6 shadow-lg rounded-xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Boat name</label>
            <input {...register('boat_name')} className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-ocean transition" />
            {errors.boat_name && <p className="text-red-500 text-sm mt-1">{errors.boat_name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
            <input type="number" {...register('capacity', { valueAsNumber: true })} className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-ocean transition" />
            {errors.capacity && <p className="text-red-500 text-sm mt-1">{errors.capacity.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <textarea {...register('description')} rows={3} className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-ocean transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location (e.g. Lamu)</label>
            <input {...register('location')} className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-ocean transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price per person (optional)</label>
            <input type="number" step="0.01" {...register('price_per_person', { valueAsNumber: true })} className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-ocean transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Boat Images</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={e => {
                setSelectedFiles(Array.from(e.target.files || []));
              }}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-ocean transition"
            />
            {selectedFiles.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedFiles.map((file, idx) => (
                  <span key={idx} className="bg-gray-100 px-2 py-1 rounded text-xs">{file.name}</span>
                ))}
              </div>
            )}
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Creating…' : 'Create boat'}
          </button>
        </form>
      </div>
    </div>
  );
}
