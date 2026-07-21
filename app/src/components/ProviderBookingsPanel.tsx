import { useEffect, useState } from 'react';
import { Navigation, MapPin, CheckCircle2, X, Loader2, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useLiveLocationBroadcast } from '@/hooks/useLiveLocationBroadcast';
import type { Booking, BookingStatus } from '@/hooks/useBookingRealtime';
import { LocalNotifications } from '@capacitor/local-notifications';

interface ProviderBookingsPanelProps {
  providerId: string;
}

const STATUS_STYLES: Record<BookingStatus, { label: string; badge: string }> = {
  requested: { label: 'New request', badge: 'bg-[#F5A623]/15 text-[#B9790A]' },
  accepted: { label: 'Accepted — not yet started', badge: 'bg-[#0284C7]/10 text-[#075985]' },
  on_the_way: { label: 'Sharing live location', badge: 'bg-[#006B35]/10 text-[#006B35]' },
  arrived: { label: 'Arrived', badge: 'bg-[#006B35]/10 text-[#006B35]' },
  completed: { label: 'Completed', badge: 'bg-mocha/10 text-mocha/60' },
  cancelled: { label: 'Cancelled', badge: 'bg-[#CE1126]/10 text-[#CE1126]' },
};

/** One booking row, with its own live-location broadcaster active only while status === 'on_the_way'. */
function BookingCard({ booking, onChange }: { booking: Booking; onChange: () => void }) {
  const [updating, setUpdating] = useState(false);
  const isOnTheWay = booking.status === 'on_the_way';
  const { sharing, error: locationError } = useLiveLocationBroadcast({
    bookingId: booking.id,
    active: isOnTheWay,
  });

  const updateStatus = async (status: BookingStatus) => {
    setUpdating(true);
    const { error } = await supabase.from('bookings').update({ status }).eq('id', booking.id);
    setUpdating(false);
    if (error) {
      toast.error('Could not update this job. Please try again.');
    } else {
      onChange();
    }
  };

  const style = STATUS_STYLES[booking.status];
  const isActive = !['completed', 'cancelled'].includes(booking.status);

  const handleGetDirections = () => {
    if (booking.customer_lat && booking.customer_lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${booking.customer_lat},${booking.customer_lng}`;
      window.open(url, '_blank');
    } else {
      toast.error('Client location is not available.');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-warm p-5">
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${style.badge}`}>{style.label}</span>
        <span className="text-xs text-mocha/40">
          {new Date(booking.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm text-[#2D4A1E] mb-4">
        <MapPin className="w-4 h-4 text-[#0284C7] flex-shrink-0" />
        <span>{booking.customer_address || `${booking.customer_lat.toFixed(4)}, ${booking.customer_lng.toFixed(4)}`}</span>
      </div>

      {isOnTheWay && (
        <div className="flex items-center gap-2 text-xs mb-4 px-3 py-2 rounded-lg bg-[#006B35]/5 text-[#006B35]">
          {sharing ? (
            <>
              <span className="w-2 h-2 rounded-full bg-[#006B35] animate-pulse" />
              Sharing your live location with the customer
            </>
          ) : locationError ? (
            <>
              <X className="w-3.5 h-3.5" />
              {locationError}
            </>
          ) : (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Starting location sharing…
            </>
          )}
        </div>
      )}

      {isActive && (
        <div className="flex flex-wrap gap-2">
          {booking.status === 'requested' && (
            <>
              <Button
                size="sm"
                disabled={updating}
                onClick={() => updateStatus('accepted')}
                className="bg-[#006B35] hover:bg-[#004D24] text-white rounded-full"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={updating}
                onClick={() => updateStatus('cancelled')}
                className="border-[#CE1126]/30 text-[#CE1126] hover:bg-[#CE1126]/5 rounded-full"
              >
                <X className="w-4 h-4 mr-1.5" /> Decline
              </Button>
            </>
          )}
          {booking.status === 'accepted' && (
            <Button
              size="sm"
              disabled={updating}
              onClick={() => updateStatus('on_the_way')}
              className="bg-[#0284C7] hover:bg-[#075985] text-white rounded-full"
            >
              <PlayCircle className="w-4 h-4 mr-1.5" /> Start sharing my location
            </Button>
          )}
          {(booking.status === 'accepted' || booking.status === 'on_the_way') && (
            <Button
              size="sm"
              variant="outline"
              disabled={updating}
              onClick={handleGetDirections}
              className="border-[#0284C7]/30 text-[#075985] hover:bg-[#0284C7]/5 rounded-full"
            >
              <Navigation className="w-4 h-4 mr-1.5" /> Get Directions
            </Button>
          )}
          {booking.status === 'on_the_way' && (
            <Button
              size="sm"
              disabled={updating}
              onClick={() => updateStatus('arrived')}
              className="bg-[#006B35] hover:bg-[#004D24] text-white rounded-full"
            >
              <MapPin className="w-4 h-4 mr-1.5" /> Mark as arrived
            </Button>
          )}
          {booking.status === 'arrived' && (
            <Button
              size="sm"
              disabled={updating}
              onClick={() => updateStatus('completed')}
              className="bg-mocha hover:bg-mocha/90 text-white rounded-full"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" /> Mark job completed
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

const ProviderBookingsPanel = ({ providerId }: ProviderBookingsPanelProps) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load bookings:', error);
    } else {
      setBookings((data || []) as Booking[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!providerId) return;
    setLoading(true);
    fetchBookings();

    const requestPermissions = async () => {
      try {
        await LocalNotifications.requestPermissions();
      } catch (err) {
        console.warn('LocalNotifications permission request failed:', err);
      }
      if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        try {
          Notification.requestPermission();
        } catch (e) {}
      }
    };
    requestPermissions();

    const channel = supabase
      .channel(`provider-bookings-${providerId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings', filter: `provider_id=eq.${providerId}` },
        (payload) => {
          fetchBookings();
          if (payload.eventType === 'INSERT') {
            try {
              const newBooking = payload.new as Booking;
              const customerName = newBooking.customer_name || 'A new client';
              const locationInfo = newBooking.customer_address ? ` at ${newBooking.customer_address}` : '';
              
              LocalNotifications.schedule({
                notifications: [
                  {
                    title: 'New Job Request!',
                    body: `${customerName} has requested your services${locationInfo}.`,
                    id: new Date().getTime(),
                    schedule: { at: new Date(Date.now() + 1000) },
                    actionTypeId: '',
                    extra: null,
                  },
                ],
              });
            } catch (err) {
              console.warn('Failed to schedule local notification:', err);
            }
            
            // Fallback to web notification if available
            if ('Notification' in window && Notification.permission === 'granted') {
              const newBooking = payload.new as Booking;
              const customerName = newBooking.customer_name || 'A new client';
              const locationInfo = newBooking.customer_address ? ` at ${newBooking.customer_address}` : '';
              new Notification('New Job Request!', { body: `${customerName} has requested your services${locationInfo}.` });
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-[#0284C7] animate-spin" />
      </div>
    );
  }

  const activeBookings = bookings.filter(b => !['completed', 'cancelled'].includes(b.status));
  const pastBookings = bookings.filter(b => ['completed', 'cancelled'].includes(b.status));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-serif font-bold text-[#075985] mb-1">Job Requests</h2>
        <p className="text-mocha/60 text-sm font-sans">
          Accept a request, then tap &quot;Start sharing my location&quot; when you set off — the customer
          will see your live position and ETA on a map.
        </p>
      </div>

      {activeBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-black/5 p-10 text-center">
          <Navigation className="w-8 h-8 text-mocha/20 mx-auto mb-3" />
          <p className="text-mocha/60 text-sm">No active job requests right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeBookings.map(booking => (
            <BookingCard key={booking.id} booking={booking} onChange={fetchBookings} />
          ))}
        </div>
      )}

      {pastBookings.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-mocha/50 uppercase tracking-widest mb-3">History</h3>
          <div className="space-y-3 opacity-70">
            {pastBookings.slice(0, 10).map(booking => (
              <BookingCard key={booking.id} booking={booking} onChange={fetchBookings} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderBookingsPanel;
