'use client';

import { useMemo } from 'react';

const DEFAULT_LAT = -2.269;
const DEFAULT_LNG = 40.900;

export default function MapView({
  lat = DEFAULT_LAT,
  lng = DEFAULT_LNG,
  markers = [],
  className = '',
}: {
  lat?: number;
  lng?: number;
  markers?: { lat: number; lng: number; label?: string }[];
  className?: string;
}) {
  const src = useMemo(() => {
    const base = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.05},${lat - 0.03},${lng + 0.05},${lat + 0.03}&layer=mapnik&marker=${lat},${lng}`;
    return base;
  }, [lat, lng]);

  return (
    <div className={`rounded-2xl overflow-hidden border border-white/50 shadow-lg ${className}`}>
      <iframe
        title="Map"
        src={src}
        width="100%"
        height="300"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
