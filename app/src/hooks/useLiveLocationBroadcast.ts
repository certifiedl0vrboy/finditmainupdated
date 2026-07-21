import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface UseLiveLocationBroadcastOptions {
  /** The booking whose provider_lat/provider_lng should be kept updated. */
  bookingId: string | null;
  /** Only broadcasts while this is true — e.g. tie to status === 'on_the_way'. */
  active: boolean;
  /** Minimum milliseconds between database writes (GPS updates fire more often than this). */
  minIntervalMs?: number;
}

interface LiveLocationBroadcastState {
  sharing: boolean;
  error: string | null;
  lastPosition: { lat: number; lng: number } | null;
}

/**
 * Watches the device's GPS position and periodically writes it to the
 * booking row in Supabase so the customer's LiveTrackingMap can pick it up
 * via Realtime. Automatically stops watching when `active` becomes false or
 * the component unmounts — location is never shared outside an active job.
 */
export function useLiveLocationBroadcast({
  bookingId,
  active,
  minIntervalMs = 5000,
}: UseLiveLocationBroadcastOptions): LiveLocationBroadcastState {
  const [state, setState] = useState<LiveLocationBroadcastState>({
    sharing: false,
    error: null,
    lastPosition: null,
  });
  const lastWriteRef = useRef(0);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active || !bookingId) {
      const timeout = setTimeout(() => setState(s => (s.sharing ? { ...s, sharing: false } : s)), 0);
      return () => clearTimeout(timeout);
    }

    if (!('geolocation' in navigator)) {
      const timeout = setTimeout(() => setState({ sharing: false, error: 'Geolocation is not supported on this device.', lastPosition: null }), 0);
      return () => clearTimeout(timeout);
    }

    const startTimeout = setTimeout(() => setState(s => ({ ...s, sharing: true, error: null })), 0);

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setState(s => ({ ...s, lastPosition: { lat: latitude, lng: longitude } }));

        const now = Date.now();
        if (now - lastWriteRef.current < minIntervalMs) return;
        lastWriteRef.current = now;

        const { error } = await supabase
          .from('bookings')
          .update({
            provider_lat: latitude,
            provider_lng: longitude,
            provider_location_updated_at: new Date().toISOString(),
          })
          .eq('id', bookingId);

        if (error) {
          console.error('Failed to broadcast location:', error);
          setState(s => ({ ...s, error: 'Could not update your location. Check your connection.' }));
        }
      },
      (geoError) => {
        console.error('Geolocation watch error:', geoError);
        setState(s => ({
          ...s,
          sharing: false,
          error: 'Location access was denied or is unavailable. Enable location permissions to share your live position.',
        }));
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    watchIdRef.current = watchId;

    return () => {
      clearTimeout(startTimeout);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setState(s => ({ ...s, sharing: false }));
    };
  }, [active, bookingId, minIntervalMs]);

  return state;
}
