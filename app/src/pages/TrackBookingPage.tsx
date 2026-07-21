import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useBookingRealtime } from '@/hooks/useBookingRealtime';
import LiveTrackingMap from '@/components/LiveTrackingMap';
import { toast } from 'sonner';

interface ProviderSummary {
  id: string;
  name: string;
  phone: string;
  avatar_url: string | null;
  category: string | null;
}

const STATUS_COPY: Record<string, { label: string; description: string }> = {
  requested: {
    label: 'Waiting for provider to accept',
    description: "You'll see live tracking here as soon as they accept your request.",
  },
  accepted: {
    label: 'Provider accepted your request',
    description: 'They will start sharing their live location once they set off.',
  },
  on_the_way: {
    label: 'Provider is on the way',
    description: 'Live location updates automatically — no need to refresh.',
  },
  arrived: {
    label: 'Provider has arrived',
    description: 'They should be with you now.',
  },
  completed: {
    label: 'Job completed',
    description: 'Thanks for using FindIt!',
  },
  cancelled: {
    label: 'Booking cancelled',
    description: 'This request is no longer active.',
  },
};

const TrackBookingPage = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { booking, loading, error } = useBookingRealtime(bookingId ?? null);
  const [provider, setProvider] = useState<ProviderSummary | null>(null);

  useEffect(() => {
    if (!booking?.provider_id) return;
    supabase
      .from('profiles')
      .select('id, full_name, business_name, phone, avatar_url, category, user_type')
      .eq('id', booking.provider_id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProvider({
            id: data.id,
            name: data.user_type === 'business' ? data.business_name : data.full_name,
            phone: data.phone,
            avatar_url: data.avatar_url,
            category: data.category,
          });
        }
      });
  }, [booking?.provider_id]);

  const handleCancel = async () => {
    if (!booking) return;
    const { error: cancelError } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', booking.id);
    if (cancelError) {
      toast.error('Could not cancel the request. Please try again.');
    } else {
      toast.success('Request cancelled.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FFF8EE] to-[#F0FFF6] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0284C7] animate-spin" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FFF8EE] to-[#F0FFF6] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <XCircle className="w-10 h-10 text-[#CE1126]" />
        <p className="text-[#075985] font-sans">{error || 'Booking not found.'}</p>
        <Button onClick={() => navigate('/search')} className="bg-[#0284C7] hover:bg-[#075985] text-white rounded-full">
          Back to search
        </Button>
      </div>
    );
  }

  const statusInfo = STATUS_COPY[booking.status] ?? STATUS_COPY.requested;
  const isFinished = booking.status === 'completed' || booking.status === 'cancelled';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF8EE] to-[#F0FFF6] font-sans pb-10">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#075985] mb-4 hover:opacity-70 transition-opacity"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Status banner */}
        <div className="bg-white rounded-2xl border border-black/5 shadow-warm p-5 mb-4">
          <div className="flex items-center gap-3">
            {booking.status === 'on_the_way' ? (
              <div className="w-11 h-11 rounded-full bg-[#0284C7]/10 flex items-center justify-center flex-shrink-0">
                <Loader2 className="w-5 h-5 text-[#0284C7] animate-spin" />
              </div>
            ) : isFinished ? (
              <div className="w-11 h-11 rounded-full bg-[#006B35]/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-[#006B35]" />
              </div>
            ) : (
              <div className="w-11 h-11 rounded-full bg-[#F5A623]/15 flex items-center justify-center flex-shrink-0">
                <Loader2 className="w-5 h-5 text-[#B9790A] animate-pulse" />
              </div>
            )}
            <div>
              <h1 className="font-serif font-bold text-lg text-[#075985] leading-tight">{statusInfo.label}</h1>
              <p className="text-sm text-mocha/60 mt-0.5">{statusInfo.description}</p>
            </div>
          </div>

          {provider && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-black/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0284C7]/10 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {provider.avatar_url ? (
                    <img src={provider.avatar_url} alt={provider.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[#0284C7] font-bold">{provider.name?.[0] ?? '?'}</span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-[#075985] text-sm">{provider.name}</p>
                  <p className="text-xs text-mocha/50">{provider.category}</p>
                </div>
              </div>
              <a
                href={`tel:${provider.phone}`}
                className="w-10 h-10 rounded-full bg-[#006B35] text-white flex items-center justify-center hover:bg-[#004D24] transition-colors"
                title={`Call ${provider.name}`}
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>

        {/* Live map */}
        {!isFinished && (
          <LiveTrackingMap
            customerLocation={{ lat: booking.customer_lat, lng: booking.customer_lng }}
            providerLocation={
              booking.provider_lat != null && booking.provider_lng != null
                ? { lat: booking.provider_lat, lng: booking.provider_lng }
                : null
            }
            providerName={provider?.name}
            height={420}
          />
        )}

        {!isFinished && booking.status !== 'cancelled' && (
          <Button
            onClick={handleCancel}
            variant="outline"
            className="w-full mt-4 border-[#CE1126]/30 text-[#CE1126] hover:bg-[#CE1126]/5 rounded-xl"
          >
            Cancel request
          </Button>
        )}
      </div>
    </div>
  );
};

export default TrackBookingPage;
