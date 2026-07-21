import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type BookingStatus = 'requested' | 'accepted' | 'on_the_way' | 'arrived' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  customer_id: string;
  provider_id: string;
  customer_lat: number;
  customer_lng: number;
  customer_address: string | null;
  provider_lat: number | null;
  provider_lng: number | null;
  provider_location_updated_at: string | null;
  status: BookingStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface UseBookingRealtimeResult {
  booking: Booking | null;
  loading: boolean;
  error: string | null;
}

/**
 * Loads a booking once, then subscribes to Supabase Realtime for live
 * updates (status changes, provider location updates) without polling.
 */
export function useBookingRealtime(bookingId: string | null): UseBookingRealtimeResult {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(() => !!bookingId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) {
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (cancelled) return;
      if (fetchError) {
        setError('Could not load this booking. It may have been removed.');
      } else {
        setBooking(data as Booking);
      }
      setLoading(false);
    })();

    const channel = supabase
      .channel(`booking-${bookingId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `id=eq.${bookingId}` },
        (payload) => {
          if (!cancelled) setBooking(payload.new as Booking);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [bookingId]);

  return { booking, loading, error };
}
