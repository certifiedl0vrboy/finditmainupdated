import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Search, Navigation, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BottomNav from '@/components/BottomNav';
import { supabase } from '@/lib/supabase';
import type { Booking, BookingStatus } from '@/hooks/useBookingRealtime';

const STATUS_LABEL: Record<BookingStatus, string> = {
  requested: 'Waiting for provider to accept',
  accepted: 'Accepted — not yet on the way',
  on_the_way: 'On the way — live tracking active',
  arrived: 'Provider has arrived',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const SavedPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setLoadingBookings(false);
        return;
      }

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!cancelled) {
        if (!error && data) setBookings(data as Booking[]);
        setLoadingBookings(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const activeBookings = bookings.filter(b => !['completed', 'cancelled'].includes(b.status));

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F2EFE8] to-[#F4FFF8] font-sans pb-24">
      {/* Header */}
      <div className="bg-primary-blue text-white px-6 py-8 pt-14">
        <h1 className="text-2xl font-serif font-bold tracking-[-0.02em]">Saved</h1>
        <p className="text-white/60 text-sm mt-1 font-sans">Your favourite providers and active requests</p>
      </div>

      {/* My active requests */}
      {loadingBookings ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 text-primary-blue animate-spin" />
        </div>
      ) : activeBookings.length > 0 ? (
        <div className="px-4 pt-6">
          <h2 className="text-sm font-bold text-mocha/50 uppercase tracking-widest mb-3 px-2">
            Active requests
          </h2>
          <div className="space-y-3">
            {activeBookings.map(booking => (
              <button
                key={booking.id}
                onClick={() => navigate(`/track/${booking.id}`)}
                className="w-full text-left bg-white rounded-2xl border border-black/5 shadow-warm p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-full bg-primary-blue/10 flex items-center justify-center flex-shrink-0">
                  <Navigation className="w-4 h-4 text-primary-blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#075985]">{STATUS_LABEL[booking.status]}</p>
                  <p className="text-xs text-mocha/50 flex items-center gap-1 mt-0.5 truncate">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    {booking.customer_address || 'Your location'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Empty state for saved providers */}
      <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-primary-blue/5 flex items-center justify-center mb-6">
          <Heart className="w-9 h-9 text-primary-blue/30" />
        </div>
        <h2 className="text-xl font-serif font-bold text-primary-blue mb-3 tracking-[-0.01em]">
          No saved providers yet
        </h2>
        <p className="text-mocha/60 text-sm leading-relaxed max-w-xs font-sans">
          When you find a provider you like, tap the heart icon to save them here for quick access.
        </p>
        <Button
          onClick={() => navigate('/search')}
          className="mt-8 bg-primary-blue text-white hover:bg-primary-blue/90 rounded-xl px-8 py-6 font-bold shadow-lg shadow-primary-blue/20 font-sans flex items-center gap-2"
        >
          <Search className="w-5 h-5" />
          Browse Providers
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default SavedPage;
