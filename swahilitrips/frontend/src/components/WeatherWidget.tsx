'use client';

import { useQuery } from '@tanstack/react-query';
import { Cloud, Wind, Droplets } from 'lucide-react';
import { api } from '@/lib/api';

export default function WeatherWidget({ lat, lon }: { lat: number; lon: number }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['weather', lat, lon],
    queryFn: () => api.get<{ temp?: number; description?: string; wind_speed?: number; humidity?: number }>(`/api/weather?lat=${lat}&lon=${lon}`),
    enabled: !!lat && !!lon,
  });

  if (isLoading) return <div className="glass-card p-4 animate-pulse h-24 rounded-2xl" />;
  if (error || !data) return null;

  return (
    <div className="glass-card p-4 rounded-2xl">
      <h4 className="font-semibold text-ocean mb-2 flex items-center gap-2">
        <Cloud className="w-5 h-5" /> Weather
      </h4>
      <div className="flex flex-wrap gap-4 text-sm">
        {data.temp != null && (
          <span className="font-medium">{Math.round(data.temp)}°C</span>
        )}
        {data.description && (
          <span className="capitalize text-gray-600">{data.description}</span>
        )}
        {data.wind_speed != null && (
          <span className="flex items-center gap-1">
            <Wind className="w-4 h-4" /> {data.wind_speed} m/s
          </span>
        )}
        {data.humidity != null && (
          <span className="flex items-center gap-1">
            <Droplets className="w-4 h-4" /> {data.humidity}%
          </span>
        )}
      </div>
    </div>
  );
}
