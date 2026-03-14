'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import MapView from './MapView';

export default function BoatTracker({ boatId }: { boatId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['tracking', boatId],
    queryFn: () =>
      api.get<{ latitude: number; longitude: number }>(`/api/tracking/${boatId}`),
    refetchInterval: 10000,
    enabled: !!boatId,
  });

  if (isLoading || !data) return null;

  const lat = Number(data.latitude);
  const lng = Number(data.longitude);

  return (
    <div className="space-y-2">
      <h4 className="font-semibold text-ocean">Live boat position</h4>
      <MapView lat={lat} lng={lng} markers={[{ lat, lng, label: 'Boat' }]} />
    </div>
  );
}
