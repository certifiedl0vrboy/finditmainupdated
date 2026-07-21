/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Check, ArrowRight, Menu, X } from 'lucide-react';
import ImageSlideshow from '../components/ImageSlideshow';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TermsOfServiceDialog from '../components/TermsOfServiceDialog';
import { toast } from 'sonner';

// ─── Category Data ──────────────────────────────────────────────
const categories = [
  {
    name: 'Cleaners',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
  },
  {
    name: 'Handymen',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.048.58.024 1.193-.14 1.743" />
      </svg>
    ),
  },
  {
    name: 'Landscapers',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
      </svg>
    ),
  },
  {
    name: 'Movers',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
  },
  {
    name: 'Plumbers',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
  },
];

// ─── Project Cards Data ─────────────────────────────────────────
const projectCards = [
  { title: 'Boutique Jewellery', image: '/images/backgrounds/boutique_jewellery.jpg' },
  { title: 'Perfume Store', image: '/images/backgrounds/perfume_store.jpg' },
  { title: 'Hardware Store', image: '/images/backgrounds/hardware_store.jpg' },
  { title: 'Electronics Shop', image: '/images/backgrounds/electronics_shop.jpg' },
  { title: 'Phone Seller', image: '/images/backgrounds/phone_seller.jpg' },
  { title: 'Modern Chemist', image: '/images/backgrounds/chemist_pharmacy.jpg' },
  { title: 'Butcher Shop', image: '/images/backgrounds/butcher_shop.jpg' },
];

const heroImages = projectCards.map(card => card.image);

// ─── Why Customers Love Items ───────────────────────────────────
const loveItems = [
  {
    title: 'Get a pro faster',
    description: 'Instantly connect with verified service providers in your area. No more endless searching.',
  },
  {
    title: 'Trusted & Verified',
    description: 'Every professional on Find It is vetted with ID verification and customer reviews.',
  },
  {
    title: 'Fair Pricing',
    description: 'Compare quotes from multiple providers to get the best deal, every time.',
  },
];

// ─── How It Works Data ──────────────────────────────────────────
const howItWorksSteps = [
  {
    id: 1,
    title: 'Search',
    description: 'Browse through hundreds of verified professionals in your area. Filter by rating, price, and expertise to find the perfect match for your specific needs.',
    image: '/images/backgrounds/step_search.jpg'
  },
  {
    id: 2,
    title: 'Compare',
    description: 'View detailed profiles, read real customer reviews from your neighbors, and compare quotes to ensure you make the best choice.',
    image: '/images/backgrounds/step_compare.jpg'
  },
  {
    id: 3,
    title: 'Hire & Relax',
    description: 'Connect directly, book your service, and get the job done. Enjoy secure payments and our satisfaction guarantee.',
    image: '/images/backgrounds/step_hire.jpg'
  }
];

// ─── Component ─────────────────────────────────────────────────
const LandingPage = () => {
  const navigate = useNavigate();
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [userLocation, setUserLocation] = useState<string>('');

  const executeWithLocation = (callback?: () => void) => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Store coords for backend distance calcs
        localStorage.setItem('userCoords', JSON.stringify({ lat: latitude, lng: longitude }));

        try {
          // Reverse geocode
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();

          if (data && data.display_name) {
            const address = data.display_name.split(',').slice(0, 3).join(',');
            setUserLocation(address);
            localStorage.setItem('userLocation', address);
          } else {
            setUserLocation('Location Found');
          }
        } catch {
          setUserLocation('Location Found');
        }
        setIsLocating(false);
        if (callback) callback();
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          toast.error('Location permission is required. Please allow it and try again.');
        } else {
          toast.error('Location access failed. Please check your browser settings.');
        }
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleLocateMe = () => executeWithLocation();

  const handleFindService = (path: string = '/search') => {
    executeWithLocation(() => navigate(path));
  };

  // Rotating text state
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0);
  const services = [
    <>Find a fundi <span className="block text-champagne">near you</span></>,
    <>Connect with <span className="block text-champagne">businesses near you</span></>,
    <>One click <span className="block text-champagne">find</span></>,
    <>Your customer <span className="block text-champagne">is near you</span></>,
    <>Connections <span className="block text-champagne">made easy</span></>
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentServiceIndex((prev) => (prev + 1) % services.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCategoryClick = (name: string) => {
    handleFindService(`/search?category=${encodeURIComponent(name)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F2EFE8] via-[#F0FFF6] to-[#F2EFE8] font-sans selection:bg-[#0284C7]/20 text-[#2D4A1E] leading-[1.7]">
      {/* ─── NAVBAR ─────────────────────────────────────────── */}
      <nav className="w-full border-b border-white/10 sticky top-0 bg-primary-blue/95 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <button onClick={() => navigate('/landing')} className="flex items-center gap-2">
              <img src="/logo.jpg" alt="FindIt Logo" className="w-10 h-10 object-contain rounded-xl shadow-lg shadow-black/20" />
              <span className="text-2xl font-semibold tracking-tight text-white font-serif">
                FIND<span className="text-champagne">IT</span>
              </span>
            </button>

            <Dialog>
              <DialogTrigger asChild>
                <button className="hidden md:block text-sm font-medium text-white/80 hover:text-champagne transition-colors">
                  How it works
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-white border-[#0284C7]/10 font-sans z-[110]">
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl text-primary-blue mb-2">How Findit Works</DialogTitle>
                </DialogHeader>
                <div className="text-mocha/80 leading-relaxed text-sm lg:text-base">
                  <p>
                    Findit is a Kenyan service discovery platform that helps individuals and businesses find reliable services in their location.
                  </p>
                  <p className="mt-4">
                    Users can search by category and area to discover verified providers, while businesses can register their profiles to showcase their services and reach more customers nationwide.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-10 text-sm font-medium text-white/80 font-sans">
            <button onClick={() => handleFindService()} className="hover:text-champagne transition-colors">
              Find Services
            </button>

            <button onClick={() => navigate('/register')} className="hover:text-champagne transition-colors">
              List Your Business
            </button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hover:text-champagne transition-colors focus:outline-none">
                  Get App
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white border border-[#0284C7]/10 p-2 shadow-lg rounded-xl z-[110]">
                <DropdownMenuItem className="cursor-pointer rounded-lg hover:bg-blue-50 focus:bg-blue-50 text-primary-blue font-medium p-3 mb-1" onClick={() => window.open('#', '_blank')}>
                  Download for iOS
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-lg hover:bg-blue-50 focus:bg-blue-50 text-primary-blue font-medium p-3" onClick={() => window.open('#', '_blank')}>
                  Download for Android
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-4 font-sans">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-bold text-white hover:text-champagne transition-colors px-4 py-2"
            >
              Log in
            </button>
            <button
              onClick={() => navigate('/register')}
              className="text-sm font-bold text-primary-blue bg-white hover:bg-white/90 transition-colors px-6 py-3 rounded-full shadow-lg shadow-black/20"
            >
              Sign up
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-bold text-white hover:text-champagne transition-colors"
            >
              Log in
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

      </nav>

      {/* ─── MOBILE MENU DRAWER ───────────────────────────── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[90] md:hidden"
            />

            {/* Side Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-[85%] max-w-sm bg-alabaster shadow-2xl z-[100] md:hidden flex flex-col border-l border-primary-blue/5"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-6 border-b border-primary-blue/5">
                <span className="text-xl font-serif font-semibold text-primary-blue tracking-tight">
                  Menu
                </span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 -mr-2 text-primary-blue/60 hover:text-primary-blue hover:bg-primary-blue/5 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto py-8 px-6 flex flex-col gap-8">
                {/* Main Navigation */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); handleFindService(); }}
                    className="flex justify-between items-center text-xl font-serif text-primary-blue font-bold p-4 bg-blue-50 hover:bg-primary-blue/10 rounded-xl transition-colors"
                  >
                    <span>Find Services</span>
                    <ArrowRight className="w-5 h-5 opacity-50" />
                  </button>
                  <button
                    onClick={() => { navigate('/landing'); setIsMobileMenuOpen(false); }}
                    className="text-2xl font-serif font-medium text-primary-blue hover:text-mocha transition-colors text-left"
                  >
                    Home
                  </button>
                  <button
                    onClick={() => { navigate('/register'); setIsMobileMenuOpen(false); }}
                    className="text-2xl font-serif font-medium text-primary-blue hover:text-mocha transition-colors text-left"
                  >
                    List Your Business
                  </button>
                  <div className="pt-4 pb-2">
                    <span className="text-sm font-bold text-mocha/50 uppercase tracking-widest mb-3 block">Get App</span>
                    <div className="flex flex-col gap-3 pl-2">
                      <button onClick={() => window.open('#', '_blank')} className="text-xl font-serif font-medium text-primary-blue text-left">
                        Download for iOS
                      </button>
                      <button onClick={() => window.open('#', '_blank')} className="text-xl font-serif font-medium text-primary-blue text-left">
                        Download for Android
                      </button>
                    </div>
                  </div>
                </div>

                <div className="w-12 h-px bg-primary-blue/10" />

                {/* Secondary Actions */}
                <div className="flex flex-col gap-5">
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="flex items-center justify-between text-base font-medium text-mocha hover:text-primary-blue transition-colors group">
                        <span>How it Works</span>
                        <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-white border-[#0284C7]/10 font-sans z-[110]">
                      <DialogHeader>
                        <DialogTitle className="font-serif text-2xl text-primary-blue mb-2">How Findit Works</DialogTitle>
                      </DialogHeader>
                      <div className="text-mocha/80 leading-relaxed text-sm lg:text-base">
                        <p>
                          Findit is a Kenyan service discovery platform that helps individuals and businesses find reliable services in their location.
                        </p>
                        <p className="mt-4">
                          Users can search by category and area to discover verified providers, while businesses can register their profiles to showcase their services.
                        </p>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <button
                    onClick={() => { window.location.href = 'tel:0117223644'; }}
                    className="flex items-center justify-between text-base font-medium text-mocha hover:text-primary-blue transition-colors group"
                  >
                    <div className="flex flex-col items-start gap-1">
                      <span>Help & Support</span>
                      <span className="text-sm text-mocha/60 font-sans tracking-wide">0117 223 644</span>
                    </div>
                    <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-primary-blue/5 bg-white/50 space-y-3">
                <button
                  onClick={() => { navigate('/register'); setIsMobileMenuOpen(false); }}
                  className="w-full py-3.5 bg-primary-blue text-white font-medium rounded-xl hover:bg-primary-blue/90 transition-all shadow-lg shadow-primary-blue/10 active:scale-[0.98]"
                >
                  Sign up free
                </button>
                <button
                  onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }}
                  className="w-full py-3.5 bg-white border border-[#0284C7]/10 text-primary-blue font-medium rounded-xl hover:bg-[#F2EFE8] transition-all active:scale-[0.98]"
                >
                  Log in
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── HERO SECTION ───────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
        {/* Background Slideshow */}
        <div className="absolute inset-0 z-0">
          <ImageSlideshow images={heroImages} interval={5000} />
          {/* No overlays so images remain clear */}
        </div>

        <div className="max-w-7xl mx-auto px-4 w-full relative z-10 text-center">
          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-['Imperial_Script',_cursive] font-normal text-white leading-[1.1] mb-8 overflow-hidden min-h-[3.5em] md:min-h-[2.5em] drop-shadow-2xl">
            <span key={currentServiceIndex} className="block animate-fade-in-up">
              {services[currentServiceIndex]}
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto font-medium leading-relaxed font-sans drop-shadow-lg">
            Boost your business visibility and connect with trusted professionals across Kenya for any project, big or small.
          </p>

          {/* Search Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto mb-20 font-sans">
            <button
              onClick={() => handleFindService()}
              className="w-full sm:w-auto px-10 py-5 bg-white hover:bg-[#FFF0D6] text-primary-blue font-bold rounded-full transition-all duration-300 hover:scale-105 shadow-2xl flex items-center justify-center gap-3 text-lg"
            >
              <Search className="w-6 h-6" />
              <span>Find Service</span>
            </button>

            <button
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto px-10 py-5 bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] text-white border border-white/30 backdrop-blur-md font-bold rounded-full transition-all duration-300 hover:scale-105 shadow-2xl flex items-center justify-center gap-3 text-lg"
            >
              <span>Register Business</span>
            </button>
          </div>

          {/* Location Badge */}
          <div className="inline-flex items-center gap-3 backdrop-blur-xl bg-white/20 border border-white/30 py-2.5 px-8 rounded-full shadow-2xl">
            <button
              onClick={handleLocateMe}
              title="Detect my location"
              className="text-white hover:scale-110 active:scale-95 transition-transform"
            >
              {isLocating ? (
                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin inline-block" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
              )}
            </button>
            <span className="text-sm font-bold text-white tracking-wide">
              {userLocation || 'Nairobi, Kenya'}
            </span>
          </div>
        </div>
      </section>

      {/* ─── CATEGORY PILLS ─────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-8 md:gap-16 overflow-x-auto hide-scrollbar py-6">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => handleCategoryClick(cat.name)}
                onMouseEnter={() => setHoveredCategory(cat.name)}
                onMouseLeave={() => setHoveredCategory(null)}
                className="flex flex-col items-center gap-3 group cursor-pointer shrink-0 transition-all duration-300"
              >
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center border border-[#0284C7]/10 bg-white shadow-sm transition-all duration-300 ${hoveredCategory === cat.name ? 'scale-110 shadow-lg border-champagne/30' : ''
                    }`}
                >
                  <div className={`transition-colors duration-300 ${hoveredCategory === cat.name ? 'text-primary-blue' : 'text-mocha/60'}`}>
                    {cat.icon}
                  </div>
                </div>
                <span className={`text-base font-medium font-sans transition-colors duration-300 ${hoveredCategory === cat.name ? 'text-[#2D4A1E]' : 'text-mocha/70'}`}>
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PROJECTS IN YOUR AREA ──────────────────────────── */}
      <section className="py-24 px-4 bg-white/50 relative overflow-hidden">
        {/* Decorative Blur */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-blue/5 rounded-full blur-[100px] -z-10" />

        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
            <div>
              <h3 className="text-xs font-serif font-bold uppercase tracking-[0.15em] text-primary-blue mb-3">
                Featured Work
              </h3>
              <h2 className="text-4xl md:text-5xl font-serif font-semibold tracking-[-0.02em] text-[#075985] mb-4">
                Projects in your area
              </h2>
              <p className="text-mocha/70 text-xl font-medium max-w-xl font-sans leading-[1.7]">
                Explore popular services near you, curated for quality and reliability.
              </p>
            </div>
            <button
              onClick={() => navigate('/search')}
              className="text-primary-blue font-bold flex items-center gap-2 hover:gap-4 transition-all duration-300 group font-sans"
            >
              <span>View all projects</span>
              <ArrowRight className="w-5 h-5 group-hover:text-primary-blue/70" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
            {projectCards.map((card, index) => (
              <button
                key={card.title}
                onClick={() => navigate(`/search?q=${encodeURIComponent(card.title)}`)}
                className={`group relative rounded-[2rem] overflow-hidden aspect-[4/5] cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-700 ${index % 3 === 1 ? 'md:translate-y-16' : ''
                  } ${index % 3 === 2 ? 'md:translate-y-32' : ''
                  }`}
              >
                {/* Image */}
                <img
                  src={card.image}
                  alt={card.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                />

                {/* Glassmorphism 2.0 Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="relative z-10 overflow-hidden rounded-xl border border-white/10 bg-black/20 backdrop-blur-xl p-6 shadow-2xl transition-all duration-500 group-hover:bg-black/40 group-hover:backdrop-blur-2xl group-hover:border-white/20">
                    <h3 className="text-white text-2xl font-serif font-semibold tracking-tight drop-shadow-md mb-2">
                      {card.title}
                    </h3>
                    <div className="flex items-center gap-2 text-white/80 text-sm font-medium font-sans">
                      <span>View professionals</span>
                      <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500" />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS (SCROLLYTELLING) ────────────────── */}
      <section className="py-24 px-4 bg-alabaster relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

          {/* Left Column - Scrolling Text */}
          <div className="relative z-10 px-4 md:px-0">
            <h3 className="text-xs font-serif font-bold uppercase tracking-[0.15em] text-primary-blue mb-3">
              How it Works
            </h3>
            <h2 className="text-4xl md:text-5xl font-serif font-semibold tracking-[-0.02em] text-[#075985] mb-16">
              Simple steps to get <br /> the job done.
            </h2>

            <div className="space-y-40 pb-40"> {/* Large spacing for scroll */}
              {howItWorksSteps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ margin: "-20% 0px -20% 0px", amount: 0.5 }}
                  transition={{ duration: 0.8 }}
                  onViewportEnter={() => setActiveStep(index)}
                  className="max-w-md"
                >
                  <div className="w-12 h-12 rounded-full bg-champagne text-primary-blue flex items-center justify-center font-serif font-bold text-xl mb-6 shadow-lg shadow-champagne/30">
                    {step.id}
                  </div>
                  <h3 className="text-3xl font-serif font-bold text-[#075985] mb-4">
                    {step.title}
                  </h3>
                  <p className="text-mocha/80 text-lg leading-[1.7] font-sans">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Column - Sticky Images */}
          <div className="hidden lg:block relative h-[600px] sticky top-32">
            <div className="relative w-full h-full rounded-[3rem] overflow-hidden shadow-2xl border border-white/20 bg-primary-blue/5">
              {howItWorksSteps.map((step, index) => (
                <motion.div
                  key={step.id}
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: activeStep === index ? 1 : 0,
                    scale: activeStep === index ? 1.05 : 1
                  }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  <img
                    src={step.image}
                    alt={step.title}
                    className="w-full h-full object-cover opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent mix-blend-multiply" />

                  {/* Scrollytelling visual accent */}
                  <div className="absolute bottom-10 left-10 text-white z-20">
                    <p className="font-serif text-2xl font-bold">{step.title}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── WHY CUSTOMERS LOVE FIND IT ─────────────────────── */}
      <section className="py-32 px-4 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-champagne/10 rounded-full blur-[120px] -z-10 -translate-y-1/2" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          {/* Left — Text (Spans 5 cols) */}
          <div className="lg:col-span-5 relative z-10">
            <h3 className="text-xs font-serif font-bold uppercase tracking-[0.15em] text-primary-blue mb-3">
              The Find It Difference
            </h3>
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-serif font-semibold tracking-[-0.02em] text-[#075985] leading-[1.0] mb-12">
              Why Kenyans love{' '}
              <span className="text-primary-blue relative inline-block">
                Find It.
                <svg className="absolute w-[110%] h-4 -bottom-1 left-0 text-champagne/40 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                </svg>
              </span>
            </h2>

            <div className="space-y-8">
              {loveItems.map((item, index) => (
                <div
                  key={item.title}
                  className={`relative p-6 rounded-2xl border border-white/50 bg-white/40 backdrop-blur-md shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group ${index === 1 ? 'lg:ml-8' : ''
                    } ${index === 2 ? 'lg:ml-16' : ''}`}
                >
                  <div className="flex gap-5 items-start">
                    <div className="w-12 h-12 rounded-full bg-primary-blue text-white flex items-center justify-center shrink-0 shadow-lg shadow-primary-blue/20 group-hover:scale-110 transition-transform duration-300">
                      <Check className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-serif font-bold tracking-tight text-[#075985] mb-2">{item.title}</h3>
                      <p className="text-mocha/80 leading-[1.7] font-sans">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/search')}
              className="mt-16 inline-flex items-center gap-3 bg-primary-blue hover:bg-primary-blue/90 text-white font-bold px-12 py-6 rounded-full transition-all duration-300 hover:scale-[1.02] active:scale-95 text-lg shadow-2xl shadow-primary-blue/30 hover:shadow-primary-blue/40 font-sans"
            >
              <span>Get started</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>

          {/* Right — Phone Mockup (Spans 7 cols with overlap) */}
          <div className="lg:col-span-7 flex items-center justify-center lg:justify-end relative">
            <div className="relative w-full max-w-lg lg:max-w-none">
              {/* Broken Grid Elements floating behind/around */}
              <div className="absolute top-10 -left-10 w-40 h-40 bg-primary-blue rounded-[2rem] opacity-10 animate-pulse -z-10" />
              <div className="absolute bottom-20 -right-10 w-60 h-60 bg-champagne rounded-full opacity-10 blur-2xl -z-10" />

              {/* Main Image Container with Glassmorphism 2.0 */}
              <div className="relative rounded-[3rem] p-4 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                <img
                  src="/images/phone-mockup.webp"
                  alt="Find It mobile app"
                  className="relative w-full h-auto rounded-[2.5rem] shadow-2xl"
                />

                {/* Floating Glass Cards */}
                <div className="absolute -bottom-10 -left-10 p-6 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl max-w-xs animate-bounce-subtle hidden md:block">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <Check className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg font-sans">Verified Pro</p>
                      <p className="text-white/60 text-sm font-sans">ID Checked & Vetted</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -top-10 -right-10 p-6 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl max-w-xs animate-bounce-subtle animation-delay-500 hidden md:block">
                  <div className="flex items-center gap-4">
                    <div className="text-primary-blue text-center">
                      <p className="text-3xl font-bold mb-0 leading-none font-serif">4.9</p>
                      <div className="flex text-champagne text-xs">★★★★★</div>
                    </div>
                    <div>
                      <p className="text-[#075985] font-bold text-base font-sans">Top Rated</p>
                      <p className="text-mocha/60 text-sm font-sans">500+ Reviews</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────── */}
      <footer className="bg-primary-blue border-t border-white/10 py-10 px-4 font-sans text-sm text-white/80">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img src="/logo.jpg" alt="FindIt Logo" className="w-7 h-7 object-contain rounded-md shadow-sm" />
            <span className="text-lg font-semibold text-white font-serif">
              FIND<span className="text-champagne">IT</span>
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <button onClick={() => handleFindService()} className="hover:text-white transition-colors">
              Find Services
            </button>
            <button onClick={() => navigate('/register')} className="hover:text-white transition-colors">
              List Your Business
            </button>
            <button className="hover:text-white transition-colors">
              Privacy Policy
            </button>
            <button onClick={() => setIsTermsOpen(true)} className="hover:text-white transition-colors">
              Terms of Service
            </button>
          </div>
        </div>

        {/* Copyright */}
        <p className="text-white/40 mt-8 md:mt-0 text-center md:text-left">
          © 2025 FINDIT. All rights reserved.
        </p>

        {/* Kenyan flag accent */}
        <div className="mt-8 h-1 flex max-w-6xl mx-auto rounded-full overflow-hidden">
          <div className="flex-1 bg-black" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-blue-600" />
        </div>
      </footer>

      {/* dialog rendering */}
      <TermsOfServiceDialog
        open={isTermsOpen}
        onOpenChange={setIsTermsOpen}
        onAccept={() => setIsTermsOpen(false)}
      />
    </div>
  );
};

export default LandingPage;
