/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, MapPin, Phone, ArrowLeft, Filter, Navigation, Building2, Wrench, Loader2, X, Star, Clock, BadgeCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ImageSlideshow from '@/components/ImageSlideshow';
import { backgroundImages } from '@/lib/backgroundImages';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { getUniqueFullDays } from '@/lib/utils';
import { serviceCategories, businessCategories } from '@/lib/categories';

// Helper for distance calculation
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}



const SearchPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');

  const [activeTab, setActiveTab] = useState('services');
  const [serviceSearch, setServiceSearch] = useState(categoryParam || '');
  const [businessSearch, setBusinessSearch] = useState('');
  const [showServiceCategories, setShowServiceCategories] = useState(false);
  const [showBusinessCategories, setShowBusinessCategories] = useState(false);
  const [selectedServiceCategory, setSelectedServiceCategory] = useState('');
  const [selectedBusinessCategory, setSelectedBusinessCategory] = useState('');
  const [userLocation, setUserLocation] = useState<string>(() => {
    const stored = localStorage.getItem('userLocation');
    if (stored) return stored;
    if (!('geolocation' in navigator)) return 'Kenya';
    return 'Detecting location...';
  });
  const [userCoords, setUserCoords] = useState<{ lat: number, lng: number } | null>(() => {
    try {
      const stored = localStorage.getItem('userCoords');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLocating, setIsLocating] = useState(() => {
    return !localStorage.getItem('userLocation') && 'geolocation' in navigator;
  });

  const handleLocateMe = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Always store coords if we have them
        localStorage.setItem('userCoords', JSON.stringify({ lat: latitude, lng: longitude }));
        setUserCoords({ lat: latitude, lng: longitude });

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();

          if (data && data.display_name) {
            const address = data.display_name.split(',').slice(0, 3).join(',');
            setUserLocation(address);
            localStorage.setItem('userLocation', address);
          } else {
            setUserLocation('Unknown Location');
          }
        } catch {
          setUserLocation('Unknown Location');
        }
        setIsLocating(false);
      },
      () => {
        toast.error('Location access denied. Using Kenya as default location.');
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Auto-detect and enforce location on page load
  useEffect(() => {
    const enforceLocation = async () => {
      if (!('geolocation' in navigator)) {
        toast.error('Geolocation is not supported by your browser.');
        navigate('/landing');
        return;
      }

      // Proactively check permission state
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state === 'denied') {
          localStorage.removeItem('userLocation');
          localStorage.removeItem('userCoords');
          toast.error('Please enable location access in your browser settings.');
          navigate('/landing');
          return;
        }

        // Listen for permission revokes while on the page
        permission.addEventListener('change', () => {
          if (permission.state === 'denied') {
            localStorage.removeItem('userLocation');
            localStorage.removeItem('userCoords');
            toast.error('Location access was revoked.');
            setUserLocation('Kenya');
          }
        });
      } catch {
        // Fallback for browsers without permissions API support
      }

      // Check if location was stored from landing page
      const storedLocation = localStorage.getItem('userLocation');
      if (storedLocation) {
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Always store coords if we have them
          localStorage.setItem('userCoords', JSON.stringify({ lat: latitude, lng: longitude }));
          setUserCoords({ lat: latitude, lng: longitude });

          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
            );
            const data = await response.json();

            if (data && data.display_name) {
              const address = data.display_name.split(',').slice(0, 3).join(',');
              setUserLocation(address);
              localStorage.setItem('userLocation', address);
            } else {
              setUserLocation('Kenya');
            }
          } catch {
            setUserLocation('Kenya');
          }
          setIsLocating(false);
        },
        (error) => {
          setIsLocating(false);
          if (error.code === error.PERMISSION_DENIED) {
            toast.error('Location access is required. Please enable it in your browser.');
            setUserLocation('Kenya');
          } else {
            setUserLocation('Kenya');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    };

    enforceLocation();
  }, [navigate]);

  const [providers, setProviders] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Fetch real providers from Supabase
  useEffect(() => {
    const fetchProviders = async () => {
      setLoadingData(true);
      try {
        let query = supabase
          .from('profiles')
          .select('id, full_name, business_name, category, phone, location, user_type, avatar_url, description, rating, reviews_count, business_hours, working_days, opening_time, closing_time, subscription_status, trial_ends_at');

        const { data, error } = await query.order('created_at', { ascending: false });
        console.log('Fetched providers:', data, 'Error:', error);

        if (error) {
          console.error('Error fetching providers:', error);
        } else {
          const processedData = (data || []).map(p => {
            let coords = null;
            if (p.location && /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(p.location)) {
              const [lat, lng] = p.location.split(',').map((s: string) => parseFloat(s.trim()));
              if (!isNaN(lat) && !isNaN(lng)) {
                coords = { lat, lng };
              }
            }
            return { ...p, coords };
          });
          setProviders(processedData);
        }
      } catch (err) {
        console.error('Fetch error:', err);
      }
      setLoadingData(false);
    };
    fetchProviders();
  }, []);


  // Reverse Geocoding for Providers List
  //
  // Previously this fired one parallel HTTP request per provider on every
  // single page load, via Promise.all with no rate limiting. Nominatim's
  // usage policy caps free usage at 1 request/second and explicitly forbids
  // bulk/parallel requests; violating it risks the shared IP getting rate-
  // limited or blocked, which would break location display for every user
  // behind that IP. This version:
  //   1. Caches resolved addresses in sessionStorage, keyed by coordinates,
  //      so the same provider is never re-geocoded twice in one browser
  //      session (or across page loads within it).
  //   2. Processes providers sequentially with a ~1.1s gap between requests
  //      instead of firing them all at once.
  // The real long-term fix is to reverse-geocode once at registration time
  // and store the address permanently on the profile — see the audit report
  // section 5.3.1 — but this keeps the current behaviour working safely
  // until that migration is done.
  useEffect(() => {
    let cancelled = false;

    const geocodeCacheKey = (lat: string, lon: string) => `findit_geocode_${lat}_${lon}`;

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const reverseGeocodeProviders = async () => {
      const results: typeof providers = [];
      let anyChanged = false;

      for (const provider of providers) {
        if (cancelled) return;

        if (provider.location && /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(provider.location)) {
          const [lat, lon] = provider.location.split(',').map((s: string) => s.trim());
          const cacheKey = geocodeCacheKey(lat, lon);

          let address: string | null = null;
          try {
            address = sessionStorage.getItem(cacheKey);
          } catch {
            // sessionStorage unavailable (e.g. private browsing) — fall through to network
          }

          if (!address) {
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
                { headers: { 'User-Agent': 'FindItApp/1.0' } }
              );
              const data = await response.json();
              if (data && data.display_name) {
                address = data.display_name.split(',').slice(0, 3).join(',');
                try { sessionStorage.setItem(cacheKey, address as string); } catch { /* ignore quota errors */ }
              }
              // Respect Nominatim's 1 request/second usage policy before the next lookup
              await sleep(1100);
            } catch (error) {
              console.error('Reverse geocoding failed for provider:', provider.id, error);
            }
          }

          if (address && address !== provider.location) {
            anyChanged = true;
            results.push({ ...provider, location: address });
            continue;
          }
        }
        results.push(provider);
      }

      if (anyChanged && !cancelled) {
        setProviders(results);
      }
    };

    if (providers.length > 0) {
      reverseGeocodeProviders();
    }

    return () => { cancelled = true; };
  }, [providers.length]); // Depend on length to trigger once loaded; guarded above against infinite loops via the `anyChanged` check.

  // Sort providers by distance if user coords are available
  const sortedProviders = useMemo(() => {
    let providersWithDistance = providers;

    if (userCoords) {
      providersWithDistance = providers.map(p => {
        let distance = null;
        if (p.coords) {
          distance = getDistanceFromLatLonInKm(userCoords.lat, userCoords.lng, p.coords.lat, p.coords.lng);
        }
        return { ...p, distance };
      });

      // Sort by distance ascending (nearest first), nulls (no location) at the end
      providersWithDistance.sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    }

    return providersWithDistance;
  }, [providers, userCoords]);

  // Split providers by user_type
  const serviceProviders = useMemo(() => sortedProviders.filter(p => p.user_type === 'service'), [sortedProviders]);
  const businesses = useMemo(() => sortedProviders.filter(p => p.user_type === 'business'), [sortedProviders]);

  // Derive filtered services from search state
  const filteredServices = useMemo(() => {
    if (serviceSearch || selectedServiceCategory) {
      const query = (serviceSearch || selectedServiceCategory).toLowerCase();
      return serviceProviders.filter(p =>
        (p.category || '').toLowerCase().includes(query) ||
        (p.full_name || '').toLowerCase().includes(serviceSearch.toLowerCase())
      );
    }
    return serviceProviders;
  }, [serviceSearch, selectedServiceCategory, serviceProviders]);

  // Derive filtered businesses from search state
  const filteredBusinesses = useMemo(() => {
    if (businessSearch || selectedBusinessCategory) {
      const query = (businessSearch || selectedBusinessCategory).toLowerCase();
      return businesses.filter(b =>
        (b.category || '').toLowerCase().includes(query) ||
        (b.business_name || '').toLowerCase().includes(businessSearch.toLowerCase())
      );
    }
    return businesses;
  }, [businessSearch, selectedBusinessCategory, businesses]);

  const handleServiceCategorySelect = (category: string) => {
    setSelectedServiceCategory(category);
    setServiceSearch(category);
    setShowServiceCategories(false);
  };

  const handleBusinessCategorySelect = (category: string) => {
    setSelectedBusinessCategory(category);
    setBusinessSearch(category);
    setShowBusinessCategories(false);
  };

  const clearServiceFilter = () => {
    setSelectedServiceCategory('');
    setServiceSearch('');
  };

  const clearBusinessFilter = () => {
    setSelectedBusinessCategory('');
    setBusinessSearch('');
  };

  const filteredServiceCategories = serviceCategories.filter(cat =>
    cat.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  const filteredBusinessCategories = businessCategories.filter(cat =>
    cat.toLowerCase().includes(businessSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F2EFE8] to-[#F4FFF8] font-sans text-[#2D4A1E] relative selection:bg-[#0284C7]/20 leading-[1.7]">
      <ImageSlideshow images={backgroundImages} interval={6000} />

      {/* Overlay to ensure text readability on background */}
      <div className="fixed inset-0 bg-alabaster/95 z-0 pointer-events-none" />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header - Glassmorphism */}
        <header className="sticky top-0 z-50 bg-primary-blue/95 border-b border-white/10 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-6">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/landing')}
                  className="text-white hover:bg-white/10 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>

                <div className="flex items-center gap-3">
                  <img src="/logo.jpg" alt="FindIt Logo" className="w-10 h-10 object-contain rounded-xl shadow-lg shadow-black/20" />
                  <h1 className="text-xl font-serif font-semibold text-white tracking-tight">
                    FIND<span className="text-champagne">IT</span>
                  </h1>
                </div>
              </div>

              {/* User location pill — tap to refresh detected location */}
              <button
                type="button"
                onClick={handleLocateMe}
                disabled={isLocating}
                title="Refresh my location"
                className="flex items-center gap-2 bg-white/10 border border-white/5 shadow-sm rounded-full px-4 py-2 backdrop-blur-md hover:bg-white/20 transition-colors disabled:cursor-not-allowed"
              >
                {isLocating ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4 text-white" />
                )}
                <span className="text-sm font-medium text-white hidden md:inline font-sans">{userLocation}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Search & Hero Section */}
        <div className="pt-12 pb-8 px-4">
          <div className="max-w-4xl mx-auto text-center mb-10">
            <h2 className="text-5xl md:text-6xl font-['Imperial_Script',_cursive] font-normal text-[#075985] mb-4 leading-[1.1]">
              Discover Excellence
            </h2>
            <p className="text-primary-blue/70 font-bold tracking-[0.15em] uppercase text-xs font-serif">
              Connect with Kenya's Finest Professionals
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">


            {/* Filter Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-white/50 p-1 border border-[#0284C7]/10 rounded-full shadow-sm mx-auto w-fit mb-8">
                <TabsTrigger
                  value="services"
                  className="rounded-full px-4 sm:px-6 py-2.5 data-[state=active]:bg-primary-blue data-[state=active]:text-white transition-all duration-300 font-medium font-sans text-mocha"
                >
                  <Wrench className="w-4 h-4 mr-2" />
                  Services
                </TabsTrigger>
                <TabsTrigger
                  value="businesses"
                  className="rounded-full px-4 sm:px-6 py-2.5 data-[state=active]:bg-primary-blue data-[state=active]:text-white transition-all duration-300 font-medium font-sans text-mocha"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Businesses
                </TabsTrigger>
              </TabsList>

              {/* Services Content */}
              <TabsContent value="services" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="relative max-w-2xl mx-auto group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-blue/10 to-primary-blue/5 rounded-2xl blur-xl opacity-70 transition-opacity group-hover:opacity-100" />
                  <div className="relative bg-primary-blue/5 hover:bg-primary-blue/10 transition-colors rounded-2xl shadow-inner border border-primary-blue/20 p-2 flex items-center gap-2">
                    <Search className="w-6 h-6 text-primary-blue ml-4 shrink-0 stroke-[2.5]" />
                    <Input
                      placeholder="Search for a service (e.g., Plumber...)"
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                      onFocus={() => setShowServiceCategories(true)}
                      className="border-none shadow-none focus-visible:ring-0 bg-transparent text-lg sm:text-xl font-black h-14 text-primary-blue placeholder:text-primary-blue/60 font-sans"
                    />
                    {selectedServiceCategory && (
                      <button onClick={clearServiceFilter} className="p-3 hover:bg-primary-blue/10 rounded-full text-primary-blue transition-colors">
                        <X className="w-6 h-6 stroke-[2.5]" />
                      </button>
                    )}
                  </div>

                  {/* Category Dropdown */}
                  {showServiceCategories && (
                    <div className="absolute top-full left-0 right-0 mt-4 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                      <div className="p-2 flex justify-between items-center border-b border-[#0284C7]/10 mb-2">
                        <span className="text-xs font-bold text-primary-blue uppercase tracking-[0.15em] pl-2 font-serif">Categories</span>
                        <Button variant="ghost" size="sm" onClick={() => setShowServiceCategories(false)} className="h-6 text-xs text-mocha hover:text-primary-blue font-sans">Close</Button>
                      </div>
                      <div className="max-h-60 overflow-y-auto grid grid-cols-2 gap-1 p-1">
                        {filteredServiceCategories.map((cat, i) => (
                          <button
                            key={i}
                            onClick={() => handleServiceCategorySelect(cat)}
                            className="text-left px-4 py-2.5 rounded-xl hover:bg-blue-50 text-sm text-[#2D4A1E] hover:text-primary-blue transition-colors font-sans"
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {selectedServiceCategory && (
                  <div className="flex justify-center">
                    <Badge className="bg-primary-blue text-white px-4 py-1.5 text-sm font-medium rounded-full shadow-lg shadow-primary-blue/20 font-sans">
                      {selectedServiceCategory}
                    </Badge>
                  </div>
                )}
              </TabsContent>

              {/* Businesses Content */}
              <TabsContent value="businesses" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="relative max-w-2xl mx-auto group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-blue/10 to-primary-blue/5 rounded-2xl blur-xl opacity-70 transition-opacity group-hover:opacity-100" />
                  <div className="relative bg-primary-blue/5 hover:bg-primary-blue/10 transition-colors rounded-2xl shadow-inner border border-primary-blue/20 p-2 flex items-center gap-2">
                    <Search className="w-6 h-6 text-primary-blue ml-4 shrink-0 stroke-[2.5]" />
                    <Input
                      placeholder="Search for a business (e.g., Cafe...)"
                      value={businessSearch}
                      onChange={(e) => setBusinessSearch(e.target.value)}
                      onFocus={() => setShowBusinessCategories(true)}
                      className="border-none shadow-none focus-visible:ring-0 bg-transparent text-lg sm:text-xl font-black h-14 text-primary-blue placeholder:text-primary-blue/60 font-sans"
                    />
                    {selectedBusinessCategory && (
                      <button onClick={clearBusinessFilter} className="p-3 hover:bg-primary-blue/10 rounded-full text-primary-blue transition-colors">
                        <X className="w-6 h-6 stroke-[2.5]" />
                      </button>
                    )}
                  </div>

                  {/* Category Dropdown */}
                  {showBusinessCategories && (
                    <div className="absolute top-full left-0 right-0 mt-4 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                      <div className="p-2 flex justify-between items-center border-b border-[#0284C7]/10 mb-2">
                        <span className="text-xs font-bold text-primary-blue uppercase tracking-[0.15em] pl-2 font-serif">Categories</span>
                        <Button variant="ghost" size="sm" onClick={() => setShowBusinessCategories(false)} className="h-6 text-xs text-mocha hover:text-primary-blue font-sans">Close</Button>
                      </div>
                      <div className="max-h-60 overflow-y-auto grid grid-cols-2 gap-1 p-1">
                        {filteredBusinessCategories.map((cat, i) => (
                          <button
                            key={i}
                            onClick={() => handleBusinessCategorySelect(cat)}
                            className="text-left px-4 py-2.5 rounded-xl hover:bg-blue-50 text-sm text-[#2D4A1E] hover:text-primary-blue transition-colors font-sans"
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {selectedBusinessCategory && (
                  <div className="flex justify-center">
                    <Badge className="bg-primary-blue text-white px-4 py-1.5 text-sm font-medium rounded-full shadow-lg shadow-primary-blue/20 font-sans">
                      {selectedBusinessCategory}
                    </Badge>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Results Grid */}
        <div className="max-w-7xl mx-auto px-6 pb-20 w-full">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#0284C7]/10">
            <h3 className="text-xl font-serif font-bold text-[#075985]">
              {activeTab === 'services' ? `${filteredServices.length} Professionals` : `${filteredBusinesses.length} Businesses`} Found
            </h3>
            <Button variant="outline" className="rounded-full border-[#0284C7]/15 text-[#2D4A1E] hover:bg-blue-50 hover:text-primary-blue font-sans font-bold">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingData ? (
              <div className="col-span-full flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary-blue" />
              </div>
            ) : activeTab === 'services' ? (
              filteredServices.map((provider) => (
                <div
                  key={provider.id}
                  onClick={() => navigate(`/profile/${provider.id}`)}
                  className="group bg-[#FFFDF7] rounded-[2rem] p-6 shadow-sm border border-[#0284C7]/10 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer relative"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-alabaster flex items-center justify-center text-xl font-bold text-primary-blue shrink-0 border border-[#0284C7]/10 group-hover:bg-primary-blue group-hover:text-white transition-colors duration-300 overflow-hidden">
                      {provider.avatar_url ? (
                        <img
                          src={provider.avatar_url}
                          alt={provider.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (provider.full_name || 'U').split(' ').map((n: string) => n[0]).join('').substring(0, 2)
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-serif font-bold text-[#075985] leading-tight group-hover:text-primary-blue transition-colors">{provider.full_name || 'Service Provider'}</h4>
                        {provider.subscription_status === 'active' && (
                          <BadgeCheck className="w-5 h-5 text-[#0284C7] shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-mocha/70 font-sans">{provider.category || 'General'}</p>
                        <div className="flex items-center gap-1 bg-primary-blue/5 px-2 py-0.5 rounded-full">
                          <Star className="w-3 h-3 text-champagne fill-champagne" />
                          <span className="text-[10px] font-bold text-primary-blue">{provider.rating || '5.0'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6 font-sans">
                    <div className="flex items-center gap-2 text-sm text-[#2D4A1E]/70">
                      <MapPin className="w-4 h-4 shrink-0 text-mocha/40" />
                      <span className="line-clamp-1">
                        {provider.location || 'Nairobi, Kenya'}
                        {provider.distance !== null && provider.distance !== undefined && (
                          <span className="font-semibold text-primary-blue ml-1">
                            • {provider.distance < 1 ? '< 1 km' : Math.round(provider.distance) + ' km'} away
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#2D4A1E]/70">
                      <Star className="w-4 h-4 text-mocha/30" />
                      <span>{provider.reviews_count || 0} reviews</span>
                    </div>
                    {(provider.working_days?.length > 0 || provider.opening_time || provider.closing_time || provider.business_hours) && (
                      <div className="flex items-start gap-2 text-sm text-[#2D4A1E]/70">
                        <Clock className="w-4 h-4 text-mocha/40 mt-0.5 shrink-0" />
                        <div className="flex flex-col leading-tight">
                          {provider.working_days?.length > 0 && (
                            <span className="text-xs font-semibold text-mocha/80 mb-0.5">
                              {getUniqueFullDays(provider.working_days).join(', ')}
                            </span>
                          )}
                          {(provider.opening_time || provider.closing_time) ? (
                            <span className="text-xs">
                              {provider.opening_time ? new Date(`1970-01-01T${provider.opening_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Open'}
                              {' - '}
                              {provider.closing_time ? new Date(`1970-01-01T${provider.closing_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Close'}
                            </span>
                          ) : provider.business_hours ? (
                            <span className="text-xs">{provider.business_hours}</span>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>

                  <a
                    href={`tel:${provider.phone}`}
                    className="w-full relative z-10 block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button className="w-full rounded-xl bg-alabaster text-[#2D4A1E] hover:bg-primary-blue hover:text-white font-bold py-6 transition-all duration-300 shadow-none hover:shadow-lg font-sans">
                      <Phone className="w-4 h-4 mr-2" />
                      Contact
                    </Button>
                  </a>
                </div>
              ))
            ) : (
              filteredBusinesses.map((business) => (
                <div
                  key={business.id}
                  onClick={() => navigate(`/profile/${business.id}`)}
                  className="group bg-[#FFFDF7] rounded-[2rem] p-6 shadow-sm border border-[#0284C7]/10 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer relative"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-alabaster flex items-center justify-center text-xl font-bold text-primary-blue shrink-0 border border-[#0284C7]/10 group-hover:bg-primary-blue group-hover:text-white transition-colors duration-300 overflow-hidden">
                      {business.avatar_url ? (
                        <img
                          src={business.avatar_url}
                          alt={business.business_name || business.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building2 className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-serif font-bold text-[#075985] leading-tight group-hover:text-primary-blue transition-colors">{business.business_name || business.full_name || 'Business'}</h4>
                        {business.subscription_status === 'active' && (
                          <BadgeCheck className="w-5 h-5 text-[#0284C7] shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-mocha/70 font-sans">{business.category || 'General'}</p>
                        <div className="flex items-center gap-1 bg-primary-blue/5 px-2 py-0.5 rounded-full">
                          <Star className="w-3 h-3 text-champagne fill-champagne" />
                          <span className="text-[10px] font-bold text-primary-blue">{business.rating || '5.0'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6 font-sans">
                    <div className="flex items-center gap-2 text-sm text-[#2D4A1E]/70">
                      <MapPin className="w-4 h-4 shrink-0 text-mocha/40" />
                      <span className="line-clamp-1">
                        {business.location || 'Nairobi, Kenya'}
                        {business.distance !== null && business.distance !== undefined && (
                          <span className="font-semibold text-primary-blue ml-1">
                            • {business.distance < 1 ? '< 1 km' : Math.round(business.distance) + ' km'} away
                          </span>
                        )}
                      </span>
                    </div>
                    {(business.working_days?.length > 0 || business.opening_time || business.closing_time || business.business_hours) && (
                      <div className="flex items-start gap-2 text-sm text-[#2D4A1E]/70">
                        <Clock className="w-4 h-4 text-mocha/40 mt-0.5 shrink-0" />
                        <div className="flex flex-col leading-tight">
                          {business.working_days?.length > 0 && (
                            <span className="text-xs font-semibold text-mocha/80 mb-0.5">
                              {getUniqueFullDays(business.working_days).join(', ')}
                            </span>
                          )}
                          {(business.opening_time || business.closing_time) ? (
                            <span className="text-xs">
                              {business.opening_time ? new Date(`1970-01-01T${business.opening_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Open'}
                              {' - '}
                              {business.closing_time ? new Date(`1970-01-01T${business.closing_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Close'}
                            </span>
                          ) : business.business_hours ? (
                            <span className="text-xs">{business.business_hours}</span>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>

                  <a
                    href={`tel:${business.phone}`}
                    className="w-full relative z-10 block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button className="w-full rounded-xl bg-alabaster text-[#2D4A1E] hover:bg-primary-blue hover:text-white font-bold py-6 transition-all duration-300 shadow-none hover:shadow-lg hover:shadow-primary-blue/20 font-sans">
                      <Phone className="w-4 h-4 mr-2" />
                      Call Now
                    </Button>
                  </a>
                </div>
              ))
            )}

            {((activeTab === 'services' && filteredServices.length === 0) || (activeTab === 'businesses' && filteredBusinesses.length === 0)) && (
              <div className="col-span-full text-center py-20">
                <div className="w-20 h-20 rounded-full bg-alabaster flex items-center justify-center mx-auto mb-6">
                  <Search className="w-8 h-8 text-mocha/40" />
                </div>
                <h3 className="text-xl font-serif font-bold text-[#075985] mb-2">No results found</h3>
                <p className="text-mocha/60 font-sans">Try adjusting your search or location settings.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
