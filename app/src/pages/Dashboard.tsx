/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Calendar,
  Star,
  User,
  Image,
  MessageSquare,
  BarChart3,
  Briefcase,
  Building2,
  ChevronRight,
  Plus,
  ArrowUpRight,
  Eye,
  DollarSign,
  CreditCard,
  AlertTriangle,
  Clock,
  CheckCircle,
  Trash2,
  Camera,
  Loader2,
  MapPin,
  Menu,
  Phone,
  HelpCircle,
  Search,
  Navigation,
  BadgeCheck,
  Zap,
  TrendingUp,
  PhoneCall,
  Award,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { usePaystackPayment } from 'react-paystack';
import { serviceCategories, businessCategories } from '@/lib/categories';
import ProviderBookingsPanel from '@/components/ProviderBookingsPanel';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  // ─── Subscription / Trial Logic ───
  // Computed from the real profile fields. To temporarily disable enforcement
  // platform-wide (e.g. a promotional "free for everyone" period), set
  // VITE_ENFORCE_SUBSCRIPTION=false in .env — see ProtectedRoute.tsx for the
  // matching flag. Do not hardcode these to fixed values; see the audit
  // report section 3.1 for why that broke the payment flow previously.
  const ENFORCE_SUBSCRIPTION = import.meta.env.VITE_ENFORCE_SUBSCRIPTION !== 'false';
  const now = new Date();
  const trialEndsAt = userProfile?.trial_ends_at ? new Date(userProfile.trial_ends_at) : null;
  const subscriptionEndsAt = userProfile?.subscription_ends_at ? new Date(userProfile.subscription_ends_at) : null;
  const isOnTrial = userProfile?.subscription_status === 'trial';
  const isTrialExpired = ENFORCE_SUBSCRIPTION && isOnTrial && !!trialEndsAt && trialEndsAt <= now;
  const trialDaysLeft: number = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const isActivePaid =
    userProfile?.subscription_status === 'active' &&
    (!subscriptionEndsAt || subscriptionEndsAt > now);
  const isExpired = ENFORCE_SUBSCRIPTION
    ? (!isActivePaid && (isTrialExpired || (!isOnTrial && userProfile?.subscription_status !== 'active')))
    : false;
  const isActive = !ENFORCE_SUBSCRIPTION || isActivePaid || (isOnTrial && !isTrialExpired);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          navigate('/login');
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('auth_user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          // No profile found — redirect to register
          navigate('/register');
          return;
        }

        const profileName = data.user_type === 'business' ? data.business_name : data.full_name;

        setUserProfile({
          ...data,
          name: profileName || "User",
          service: data.category || "Service Provider",
          rating: 5.0, // Mock for now
          reviews: 0   // Mock for now
        });
      } catch (error) {
        console.error('Error in fetchProfile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  // Reverse Geocoding Effect for Dashboard
  useEffect(() => {
    const reverseGeocode = async () => {
      if (userProfile?.location && /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(userProfile.location)) {
        try {
          // Check if we already have the address in a different field or just try to resolve it
          const [lat, lon] = userProfile.location.split(',').map((s: string) => s.trim());
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
            { headers: { 'User-Agent': 'FindItApp/1.0' } }
          );
          const data = await response.json();
          if (data && data.display_name) {
            const address = data.display_name.split(',').slice(0, 3).join(',');

            // Update local state
            setUserProfile((prev: any) => prev ? { ...prev, location: address } : null);

            // Optional: We could update Supabase here too, but let's stick to display for now
            // unless we want to auto-fix the DB.
          }
        } catch (error) {
          console.error('Reverse geocoding failed in Dashboard:', error);
        }
      }
    };

    if (userProfile?.location) {
      reverseGeocode();
    }
  }, [userProfile?.location]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleViewProfile = () => {
    if (userProfile?.id) {
      navigate(`/profile/${userProfile.id}`);
    }
  };


  // Fallback if something fails
  const displayProfile = useMemo(() => {
    const p = userProfile || {};
    return {
      name: p.name || "User",
      service: p.service || "Service Provider",
      rating: p.rating || 0,
      reviews: p.reviews || 0
    };
  }, [userProfile]);

  // Paystack config for subscription payment
  const paystackConfig = useMemo(() => ({
    reference: `sub_${new Date().getTime()}`,
    email: userProfile?.email || 'user@findit.co.ke',
    amount: 25000, // 250 KES in kobo
    currency: 'KES',
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string,
  }), [userProfile?.email, userProfile?.id]);

  const initializePayment = usePaystackPayment(paystackConfig);

  // ─── Expired-Profile Handling ───
  // IMPORTANT: this previously deleted every business photo permanently the
  // moment a trial expired, with no grace period and no way to recover them.
  // That is a severe, surprising action to take automatically. It has been
  // changed to only warn in the console; wire this up to a proper grace-period
  // + email-warning flow before ever re-enabling real deletion here.
  useEffect(() => {
    if (isExpired && userProfile?.id) {
      console.warn(
        `Profile ${userProfile.id} is expired. Photos are NOT being auto-deleted ` +
        `(this behaviour was disabled — see the audit report for why). ` +
        `Implement a grace period and user notification before deleting any data.`
      );
    }
  }, [isExpired, userProfile?.id]);

  const [galleryPhotos, setGalleryPhotos] = useState<any[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);

  const fetchGallery = useCallback(async () => {
    if (!userProfile?.id) return;
    setGalleryLoading(true);
    try {
      const { data, error: galleryError } = await supabase
        .from('business_photos')
        .select('*')
        .eq('profile_id', userProfile.id);

      if (galleryError) throw galleryError;
      if (data) setGalleryPhotos(data);
    } catch (err) {
      console.error('Gallery fetch error:', err);
    }
    setGalleryLoading(false);
  }, [userProfile?.id]);

  useEffect(() => {
    if (activeTab === 'gallery') {
      fetchGallery();
    }
  }, [activeTab, fetchGallery]);

  const handleDeletePhoto = async (photoId: string, storagePath: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;
    try {
      // 1. Remove from storage
      const urlParts = storagePath.split('/business-photos/');
      const filePath = urlParts.length > 1 ? urlParts[1] : null;
      if (filePath) {
        const { error: storageError } = await supabase.storage.from('business-photos').remove([filePath]);
        if (storageError) console.error('Storage error:', storageError);
      }

      // 2. Remove from database
      const { error } = await supabase
        .from('business_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;
      setGalleryPhotos(galleryPhotos.filter(p => p.id !== photoId));
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete photo.');
    }
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile?.id) return;

    const maxPhotos = userProfile.user_type === 'business' ? 5 : 2;
    if (galleryPhotos.length >= maxPhotos) {
      toast.error(`Photo limit reached. You can only upload up to ${maxPhotos} photos.`);
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userProfile.id}/${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('business-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('business-photos')
        .getPublicUrl(filePath);

      // 3. Insert into business_photos table
      const { error: dbError } = await supabase
        .from('business_photos')
        .insert([{
          profile_id: userProfile.id,
          storage_path: publicUrl,
          caption: ''
        }]);

      if (dbError) throw dbError;

      toast.success('Photo uploaded successfully!');
      fetchGallery();
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload photo. Ensure the "business-photos" bucket exists.');
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile?.id) return;

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userProfile.id}/avatar.${fileExt}`; // Overwrite existing avatar
      const filePath = `${fileName}`;

      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Update profiles table
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userProfile.id);

      if (dbError) throw dbError;

      // 4. Update local state
      setUserProfile({
        ...userProfile,
        avatar_url: publicUrl
      });

      toast.success('Profile picture updated successfully!');
    } catch (err) {
      console.error('Avatar upload error:', err);
      toast.error('Failed to upload profile picture. Ensure "avatars" bucket permissions are set.');
    } finally {
      setIsUploadingAvatar(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handlePaySubscription = () => {
    initializePayment({
      onSuccess: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const newExpiry = new Date();
            newExpiry.setDate(newExpiry.getDate() + 30);

            await supabase
              .from('profiles')
              .update({
                subscription_status: 'active',
                is_verified: true,
                trial_ends_at: newExpiry.toISOString()
              })
              .eq('auth_user_id', user.id);

            // Record payment
            const profileId = userProfile?.id;
            if (profileId) {
              await supabase.from('payments').insert([{
                profile_id: profileId,
                paystack_reference: paystackConfig.reference,
                amount: 250,
                currency: 'KES',
                status: 'success',
              }]);
            }

            toast.success('🎉 You are now FINDIT Verified! Your badge is live.');
            window.location.reload();
          }
        } catch (error) {
          console.error('Payment recording error:', error);
        }
      },
      onClose: () => {
        toast.error('Payment cancelled.');
      },
    });
  };

  const [editFormData, setEditFormData] = useState({
    user_type: 'service',
    category: '',
    phone: '',
    description: '',
    workingDays: [] as string[],
    openingTime: '08:00',
    closingTime: '17:00'
  });
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

  useEffect(() => {
    if (userProfile) {
      setEditFormData({
        user_type: userProfile.user_type || 'service',
        category: userProfile.category || '',
        phone: userProfile.phone || '',
        description: userProfile.description || '',
        workingDays: userProfile.working_days || [],
        openingTime: userProfile.opening_time || '08:00',
        closingTime: userProfile.closing_time || '17:00'
      });
    }
  }, [userProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          user_type: editFormData.user_type,
          category: editFormData.category,
          phone: editFormData.phone,
          description: editFormData.description,
          working_days: editFormData.workingDays,
          opening_time: editFormData.openingTime || null,
          closing_time: editFormData.closingTime || null
        })
        .eq('id', userProfile.id);

      if (error) throw error;

      setUserProfile({
        ...userProfile,
        user_type: editFormData.user_type,
        category: editFormData.category,
        phone: editFormData.phone,
        description: editFormData.description,
        service: editFormData.category || "Service Provider",
        working_days: editFormData.workingDays,
        opening_time: editFormData.openingTime,
        closing_time: editFormData.closingTime
      });

      toast.success('Profile updated successfully!');
      setActiveTab('overview');
    } catch (err: any) {
      console.error('Update error:', err);
      toast.error('Failed to update profile: ' + (err.message || 'Unknown error. Check console.'));
    }
  };

  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);

  const handleUpdateLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    if (!userProfile?.id) return;

    setIsUpdatingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // 1. Reverse Geocode for readable address
          let locationName = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
              { headers: { 'User-Agent': 'FindItApp/1.0' } }
            );
            const data = await response.json();
            if (data && data.display_name) {
              locationName = data.display_name.split(',').slice(0, 3).join(',');
            }
          } catch (geoError) {
            console.warn('Reverse geocoding failed, using coordinates:', geoError);
          }

          // 2. Update Supabase
          const { error } = await supabase
            .from('profiles')
            .update({
              latitude,
              longitude,
              location: locationName
            })
            .eq('id', userProfile.id);

          if (error) throw error;

          // 3. Update Local State
          setUserProfile({
            ...userProfile,
            latitude,
            longitude,
            location: locationName
          });

          toast.success(`Location updated to: ${locationName}`);

        } catch (error: any) {
          console.error('Location update error:', error);
          toast.error(`Failed to save location: ${error.message || 'Unknown error'}`);
        } finally {
          setIsUpdatingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Unable to retrieve your location. Please ensure location services are enabled.');
        setIsUpdatingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F2EFE8] to-[#F4FFF8] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-blue" />
      </div>
    );
  }

  // ─── Side Drawer Component ───
  const SideDrawer = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-50 bg-white/80 backdrop-blur-md shadow-sm rounded-full h-12 w-12 border border-[#0284C7]/10">
          <Menu className="h-6 w-6 text-primary-blue" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px] bg-alabaster border-r border-[#0284C7]/10 p-0 flex flex-col h-full">
        <SheetHeader className="p-6 border-b border-[#0284C7]/10 bg-white">
          <SheetTitle className="font-serif text-2xl font-bold text-primary-blue text-left">FindIt</SheetTitle>
          <SheetDescription className="text-left text-mocha/60 font-sans text-xs uppercase tracking-widest">
            Provider Dashboard
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
          {/* Navigation Links */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-mocha/40 uppercase tracking-widest px-4 mb-2 font-serif">Menu</h4>
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'bookings', label: 'Job Requests', icon: Navigation },
              { id: 'profile', label: 'My Profile', icon: User },
              { id: 'gallery', label: 'Gallery', icon: Image },
              { id: 'messages', label: 'Messages', icon: MessageSquare },
              { id: 'stats', label: 'Analytics', icon: BarChart3 },
              { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "secondary" : "ghost"}
                className={`w-full justify-start h-12 rounded-xl text-base ${activeTab === item.id
                  ? "bg-primary-blue text-white hover:bg-primary-blue/90 font-bold shadow-lg shadow-primary-blue/10"
                  : "text-mocha/80 hover:bg-blue-50 hover:text-primary-blue font-medium"
                  }`}
                onClick={() => {
                  setActiveTab(item.id);
                  // Close sheet logic is handled by Radix automatically if we wrap this but let's just make it simple
                  // Actually Radix closing requires a specific Close component or state management
                  // For now, clicking outside closes it, or user can close explicitly.
                }}
              >
                <item.icon className={`mr-3 h-5 w-5 ${activeTab === item.id ? "text-champagne" : "text-mocha/40"}`} />
                {item.label}
              </Button>
            ))}
          </div>

          {/* Get App Section */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-mocha/40 uppercase tracking-widest px-4 mb-2 font-serif">Get App</h4>
            <Button
              variant="ghost"
              className="w-full justify-start h-12 rounded-xl text-base text-mocha/80 hover:bg-blue-50 hover:text-primary-blue font-medium"
              onClick={() => window.open('#', '_blank')}
            >
              <Smartphone className="mr-3 h-5 w-5 text-mocha/40" />
              Download for iOS
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start h-12 rounded-xl text-base text-mocha/80 hover:bg-blue-50 hover:text-primary-blue font-medium"
              onClick={() => window.open('#', '_blank')}
            >
              <Smartphone className="mr-3 h-5 w-5 text-mocha/40" />
              Download for Android
            </Button>
          </div>

          {/* Help & Support Section */}
          <div className="bg-gradient-to-br from-primary-blue to-black p-6 rounded-2xl text-white relative overflow-hidden shadow-xl shadow-primary-blue/20 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-10 translate-x-10"></div>

            <div className="relative z-10 space-y-4">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
                <HelpCircle className="w-5 h-5 text-champagne" />
              </div>

              <div>
                <h4 className="font-serif font-bold text-lg mb-1">Need Assistance?</h4>
                <p className="text-white/60 text-sm leading-relaxed">
                  Our exclusive support team is available to help you succeed.
                </p>
              </div>

              <div className="pt-2">
                <a
                  href="tel:+254117223644"
                  className="flex items-center justify-between w-full bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md p-3 rounded-xl transition-all group-hover:scale-[1.02]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-champagne text-primary-blue flex items-center justify-center">
                      <Phone className="w-4 h-4 fill-current" />
                    </div>
                    <div>
                      <span className="block text-[10px] text-white/40 uppercase tracking-wider font-bold">Call Support</span>
                      <span className="block text-sm font-bold tracking-wide">+254 117 223 644</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/40" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[#0284C7]/10 bg-white space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-[#CE1126]/5 h-12 rounded-xl"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </Button>
          <div className="text-center">
            <p className="text-[10px] text-mocha/40 uppercase tracking-widest font-serif">FindIt v1.0.0</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  // ─── Render Content based on Tab ───
  const renderContent = () => {
    switch (activeTab) {
      case 'bookings':
        return (
          <div className="animate-in fade-in">
            {userProfile?.id && <ProviderBookingsPanel providerId={userProfile.id} />}
          </div>
        );
      case 'stats':
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 animate-in fade-in">
            <div className="w-20 h-20 bg-primary-blue/5 rounded-full flex items-center justify-center">
              <BarChart3 className="w-10 h-10 text-primary-blue" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-[#075985]">Analytics Coming Soon</h2>
            <p className="text-gray-500 max-w-md">Detailed performance metrics and insights will be available in the next update.</p>
          </div>
        );
      case 'messages':
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 animate-in fade-in">
            <div className="w-20 h-20 bg-primary-blue/5 rounded-full flex items-center justify-center">
              <MessageSquare className="w-10 h-10 text-primary-blue" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-[#075985]">Messages Coming Soon</h2>
            <p className="text-gray-500 max-w-md">Direct client messaging and inquiry management is currently under development.</p>
          </div>
        );
      case 'settings':
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 animate-in fade-in">
            <div className="w-20 h-20 bg-primary-blue/5 rounded-full flex items-center justify-center">
              <Settings className="w-10 h-10 text-primary-blue" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-[#075985]">Account Settings</h2>
            <p className="text-gray-500 max-w-md">Manage your account preferences, billing, and notifications here.</p>
          </div>
        );
      case 'profile':
        return (
          <div className="animate-in fade-in space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-serif font-bold text-[#075985]">My Profile</h2>
              <Button onClick={handleViewProfile} className="bg-primary-blue text-white hover:bg-primary-blue/90">
                View Public Page <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-[#0284C7]/10 space-y-6">
              <div className="flex items-center gap-6 pb-6 border-b border-[#0284C7]/10">
                <div className="w-24 h-24 rounded-full bg-alabaster flex items-center justify-center text-3xl font-serif font-bold text-primary-blue border border-[#0284C7]/10 relative group overflow-hidden">
                  {userProfile?.avatar_url ? (
                    <img src={userProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    ((displayProfile.name || 'User').split(' ') || ['U']).map((n: string) => n ? n[0] : '').join('').substring(0, 2)
                  )}

                  {/* Overlay for upload */}
                  <label className="absolute inset-0 bg-blue-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    {isUploadingAvatar ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6 text-white" />
                    )}
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </label>
                </div>
                <div>
                  <h3 className="text-2xl font-serif font-bold text-[#075985]">{displayProfile.name}</h3>
                  <p className="text-mocha/60 font-sans">{displayProfile.service}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-mocha/40 font-serif">Quick Stats</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-4 bg-alabaster rounded-xl">
                      <span className="text-sm font-medium">Public Status</span>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${isActive ? 'bg-[#0284C7]/10 text-[#0284C7]' : 'bg-amber-100 text-amber-700'}`}>
                        {isActive ? 'Live' : 'Trial'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-alabaster rounded-xl">
                      <span className="text-sm font-medium">Direct Rating</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-champagne fill-champagne" />
                        <span className="text-xs font-bold">{displayProfile.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-end">
                  <Button onClick={() => setActiveTab('edit-services')} className="w-full bg-primary-blue text-white py-6 rounded-xl font-bold transition-all hover:-translate-y-1">
                    Edit Profile Details
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'edit-services':
        return (
          <div className="animate-in fade-in space-y-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setActiveTab('overview')} className="p-2 hover:bg-blue-50 rounded-full transition-colors">
                <LayoutDashboard className="w-6 h-6 text-mocha/40" />
              </button>
              <h2 className="text-3xl font-serif font-bold text-[#075985]">Edit Services</h2>
            </div>
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-[#0284C7]/10 max-w-2xl">
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="space-y-4">
                  <label className="text-base font-black text-primary-blue uppercase tracking-widest font-serif block border-b-2 border-primary-blue/10 pb-2 mb-4">Account Type Selection</label>
                  <div className="flex flex-col sm:flex-row gap-6">
                    <button
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, user_type: 'service' })}
                      className={`flex-1 flex flex-col items-center justify-center p-6 rounded-2xl font-black transition-all border-2 ${editFormData.user_type === 'service'
                          ? 'bg-primary-blue text-white border-primary-blue shadow-xl shadow-primary-blue/30 scale-[1.02]'
                          : 'bg-white text-[#075985] border-black/20 hover:bg-blue-50 hover:border-black/40'
                        }`}
                    >
                      <Briefcase className={`w-8 h-8 mb-3 ${editFormData.user_type === 'service' ? 'text-champagne' : 'text-primary-blue'}`} />
                      <span className="text-lg uppercase tracking-wide">Individual Service</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, user_type: 'business' })}
                      className={`flex-1 flex flex-col items-center justify-center p-6 rounded-2xl font-black transition-all border-2 ${editFormData.user_type === 'business'
                          ? 'bg-primary-blue text-white border-primary-blue shadow-xl shadow-primary-blue/30 scale-[1.02]'
                          : 'bg-white text-[#075985] border-black/20 hover:bg-blue-50 hover:border-black/40'
                        }`}
                    >
                      <Building2 className={`w-8 h-8 mb-3 ${editFormData.user_type === 'business' ? 'text-champagne' : 'text-primary-blue'}`} />
                      <span className="text-lg uppercase tracking-wide">Business Company</span>
                    </button>
                  </div>
                </div>
                <div className="space-y-2 relative">
                  <label className="text-sm font-bold text-mocha/60 uppercase tracking-widest font-serif">Category / Service Type</label>
                  <div
                    className="w-full h-14 px-4 bg-alabaster border-none rounded-xl flex items-center justify-between cursor-pointer focus-within:ring-2 focus-within:ring-primary-blue/10 transition-shadow group"
                    onClick={() => {
                      setShowCategoryDropdown(!showCategoryDropdown);
                      setCategorySearchQuery('');
                    }}
                  >
                    <span className={`font-sans font-medium text-lg ${editFormData.category ? 'text-[#075985]' : 'text-primary-blue/60'}`}>
                      {editFormData.category || 'Select Category...'}
                    </span>
                    <ChevronRight className={`w-5 h-5 text-mocha/40 transition-transform ${showCategoryDropdown ? 'rotate-90' : ''}`} />
                  </div>

                  {showCategoryDropdown && (
                    <div className="absolute top-[80px] left-0 right-0 z-50 bg-[#FFFDF7] rounded-xl shadow-2xl border border-[#0284C7]/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      <div className="p-3 border-b border-[#0284C7]/10 sticky top-0 bg-white">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mocha/40" />
                          <input
                            type="text"
                            placeholder="Search categories..."
                            value={categorySearchQuery}
                            onChange={(e) => setCategorySearchQuery(e.target.value)}
                            className="w-full h-10 pl-9 pr-4 bg-alabaster rounded-lg text-sm font-sans outline-none focus:ring-2 focus:ring-primary-blue/10"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-black/10">
                        {(editFormData.user_type === 'service' ? serviceCategories : businessCategories)
                          .filter(c => c.toLowerCase().includes(categorySearchQuery.toLowerCase()))
                          .map((cat, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setEditFormData({ ...editFormData, category: cat });
                                setShowCategoryDropdown(false);
                                setCategorySearchQuery('');
                              }}
                              className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium font-sans hover:bg-blue-50 transition-colors text-[#2D4A1E]"
                            >
                              {cat}
                            </button>
                          ))}
                        {(editFormData.user_type === 'service' ? serviceCategories : businessCategories)
                          .filter(c => c.toLowerCase().includes(categorySearchQuery.toLowerCase())).length === 0 && (
                            <p className="text-center text-sm font-medium text-mocha/60 py-8">No matching categories found</p>
                          )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-mocha/60 uppercase tracking-widest font-serif">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full h-14 px-4 bg-alabaster border-none rounded-xl focus:ring-2 focus:ring-primary-blue/10 font-sans outline-none font-medium"
                    placeholder="e.g. 0712345678"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-mocha/60 uppercase tracking-widest font-serif">Description</label>
                  <textarea
                    rows={6}
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="w-full p-4 bg-alabaster border-none rounded-xl focus:ring-2 focus:ring-primary-blue/10 font-sans outline-none font-medium resize-none"
                    placeholder="Tell clients what makes your service stand out..."
                  />
                </div>
                <div className="space-y-4 pt-4 border-t border-[#0284C7]/10">
                  <h4 className="text-sm font-bold text-mocha/60 uppercase tracking-widest font-serif mb-2">Availability</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-mocha/60 uppercase tracking-widest font-sans pl-1">Opens at</label>
                      <input
                        type="time"
                        value={editFormData.openingTime}
                        onChange={(e) => setEditFormData({ ...editFormData, openingTime: e.target.value })}
                        className="w-full h-14 px-4 bg-alabaster border-none rounded-xl focus:ring-2 focus:ring-primary-blue/10 font-sans outline-none font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-mocha/60 uppercase tracking-widest font-sans pl-1">Closes at</label>
                      <input
                        type="time"
                        value={editFormData.closingTime}
                        onChange={(e) => setEditFormData({ ...editFormData, closingTime: e.target.value })}
                        className="w-full h-14 px-4 bg-alabaster border-none rounded-xl focus:ring-2 focus:ring-primary-blue/10 font-sans outline-none font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="text-xs font-bold text-mocha/60 uppercase tracking-[0.15em] ml-1 font-sans">Working Days</label>
                    <div className="flex flex-wrap gap-2">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                        const isSelected = editFormData.workingDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setEditFormData({ ...editFormData, workingDays: editFormData.workingDays.filter(d => d !== day) });
                              } else {
                                setEditFormData({ ...editFormData, workingDays: [...editFormData.workingDays, day] });
                              }
                            }}
                            className={`px-4 py-2 rounded-full text-sm font-medium font-sans transition-all duration-300 ${isSelected
                              ? 'bg-primary-blue text-white shadow-md'
                              : 'bg-alabaster text-mocha/60 hover:bg-blue-50'
                              }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <Button type="button" variant="outline" onClick={() => setActiveTab('overview')} className="flex-1 h-14 border-[#0284C7]/15 rounded-xl font-bold">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 h-14 bg-primary-blue text-white rounded-xl font-bold hover:bg-primary-blue/90 shadow-xl shadow-primary-blue/10">
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        );
      case 'gallery': {
        const maxPhotos = userProfile?.user_type === 'business' ? 5 : 2;
        return (
          <div className="animate-in fade-in space-y-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setActiveTab('overview')} className="p-2 hover:bg-blue-50 rounded-full transition-colors">
                <LayoutDashboard className="w-6 h-6 text-mocha/40" />
              </button>
              <div className="flex-1">
                <h2 className="text-3xl font-serif font-bold text-[#075985]">Business Gallery</h2>
                <p className="text-mocha/60 text-sm font-sans mt-1">Showcase your work to potential clients. ({galleryPhotos.length} / {maxPhotos} uploaded)</p>
              </div>
              <div className="relative">
                <input
                  type="file"
                  id="photo-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleUploadPhoto}
                  disabled={isUploading || galleryPhotos.length >= maxPhotos}
                />
                <Button
                  onClick={() => document.getElementById('photo-upload')?.click()}
                  disabled={isUploading || galleryPhotos.length >= maxPhotos}
                  className="bg-primary-blue text-white rounded-xl h-12 px-6 font-bold shadow-lg shadow-primary-blue/10 disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  {isUploading ? 'Uploading...' : 'Upload Photo'}
                </Button>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-[#0284C7]/10">
              {galleryLoading ? (
                <div className="py-20 flex justify-center w-full">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-blue" />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {galleryPhotos.map((photo) => (
                    <div key={photo.id} className="relative aspect-square rounded-2xl overflow-hidden group shadow-sm hover:shadow-xl transition-all duration-500 border border-[#0284C7]/10">
                      <img src={photo.storage_path} alt={photo.caption || 'Business photo'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                        <button
                          onClick={() => handleDeletePhoto(photo.id, photo.storage_path)}
                          className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-[#CE1126]/50 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add Photo Trigger Card */}
                  {galleryPhotos.length < maxPhotos && (
                    <div
                      onClick={() => !isUploading && document.getElementById('photo-upload')?.click()}
                      className="aspect-square bg-alabaster rounded-2xl border-2 border-dashed border-mocha/10 flex flex-col items-center justify-center cursor-pointer hover:bg-mocha/5 transition-all group hover:-translate-y-1"
                    >
                      <div className="w-12 h-12 bg-[#FFFDF7] rounded-full flex items-center justify-center shadow-lg text-primary-blue group-hover:scale-110 group-hover:bg-primary-blue group-hover:text-white transition-all duration-300">
                        {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Plus className="w-6 h-6" />}
                      </div>
                      <span className="text-xs font-bold text-mocha/40 uppercase tracking-widest font-serif mt-4">
                        {isUploading ? 'Uploading...' : 'Add Photo'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {!galleryLoading && galleryPhotos.length === 0 && (
                <div className="text-center py-20 bg-alabaster rounded-[1.5rem] border border-dashed border-[#0284C7]/10">
                  <div className="w-16 h-16 bg-[#FFFDF7] rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Image className="w-8 h-8 text-mocha/20" />
                  </div>
                  <h3 className="text-lg font-serif font-bold text-primary-blue">No photos yet</h3>
                  <p className="text-sm text-mocha/60 font-sans max-w-xs mx-auto">Upload photos of your work to attract more clients and build trust.</p>
                </div>
              )}
            </div>
          </div>
        );
      }
      case 'billing':
        return (
          <div className="animate-in fade-in space-y-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setActiveTab('overview')} className="p-2 hover:bg-blue-50 rounded-full transition-colors">
                <LayoutDashboard className="w-6 h-6 text-mocha/40" />
              </button>
              <h2 className="text-3xl font-serif font-bold text-[#075985]">Billing & Plans</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-[#0284C7]/10">
                <h3 className="text-xl font-serif font-bold mb-6">Current Plan</h3>
                <div className="p-6 bg-primary-blue text-white rounded-2xl mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-white/40 text-xs font-bold uppercase tracking-[0.15em] font-serif mb-1">Status</p>
                      <h4 className="text-2xl font-serif font-bold">LIFETIME FREE PLAN</h4>
                    </div>
                    {isActive && <CheckCircle className="w-6 h-6 text-champagne" />}
                  </div>
                  <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                    <span className="text-white/40 text-sm font-medium">Plan Type</span>
                    <span className="font-bold">Permanent Active</span>
                  </div>
                </div>
                {!isActive && (
                  <Button onClick={handlePaySubscription} className="w-full bg-kenyan-red hover:bg-kenyan-red/90 text-white py-6 rounded-xl font-bold shadow-xl shadow-kenyan-red/20 transition-all hover:-translate-y-1">
                    Upgrade to PRO — KES 250
                  </Button>
                )}
              </div>

              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-[#0284C7]/10">
                <h3 className="text-xl font-serif font-bold mb-6">Payment History</h3>
                <div className="space-y-4">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-alabaster rounded-full flex items-center justify-center mx-auto mb-4">
                      <CreditCard className="w-8 h-8 text-mocha/20" />
                    </div>
                    <p className="text-mocha/40 text-sm font-medium">No recent payments found.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'overview':
      default:
        return (
          <>
            <SideDrawer />
            {/* ─── Subscription / Verified Status Banner ─── */}
            {isActivePaid ? (
              /* ── VERIFIED: User has paid ── */
              <div className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-[#0284C7]/20 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <BadgeCheck className="w-5 h-5 text-[#0284C7]" />
                    <p className="font-bold text-blue-900 text-sm">Your profile is live and visible in search results ✓</p>
                  </div>
                  <p className="text-blue-800/70 text-sm ml-8">
                    Plan: <span className="font-bold">FINDIT Verified — Active</span>
                  </p>
                </div>
              </div>
            ) : (
              /* ── NOT VERIFIED: Show promo card ── */
              <div className="mb-8 rounded-2xl bg-white border border-[#0284C7]/15 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                {/* Top bar */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-[#0284C7]/10 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[#0284C7]" />
                  <div>
                    <p className="font-bold text-blue-900 text-sm">Your profile is live and visible in search results ✓</p>
                    <p className="text-blue-800/70 text-xs">Plan: <span className="font-bold">Lifetime Active Status</span></p>
                  </div>
                </div>

                {/* FINDIT VERIFIED promo */}
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <BadgeCheck className="w-4 h-4 text-[#0284C7]" />
                        <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#0284C7] font-serif">FINDIT VERIFIED</p>
                      </div>
                      <h3 className="text-2xl font-serif font-bold text-[#075985] mb-4">Get FINDIT Verified for <span className="text-[#0284C7]">KES 250</span>/month</h3>

                      {/* 5 benefit cards */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {[
                          { icon: TrendingUp, title: 'Top-of-List Search Priority', desc: 'Outrank casual competitors instantly in your specific estate or area.' },
                          { icon: BadgeCheck, title: 'The Official Blue Badge', desc: 'An Instagram-style blue checkmark for immediate professional trust.' },
                          { icon: PhoneCall, title: 'Up to 5× More Direct Calls', desc: 'Drastically higher touch-to-call leads and customer interaction.' },
                          { icon: Award, title: 'Exclusive Premium Positioning', desc: 'Stand out starkly from unvetted listings in your local neighborhood.' },
                          { icon: ShieldCheck, title: 'Boosted Client Booking Confidence', desc: 'Homeowners and clients prefer inviting verified pros.' },
                        ].map(({ icon: Icon, title, desc }) => (
                          <div key={title} className="bg-[#F6F9FF] rounded-xl p-3 border border-[#0284C7]/10">
                            <div className="flex items-start gap-1.5 mb-1">
                              <CheckCircle className="w-3.5 h-3.5 text-[#0284C7] mt-0.5 shrink-0" />
                              <p className="text-xs font-bold text-[#075985] leading-tight">{title}</p>
                            </div>
                            <p className="text-[10px] text-mocha/60 leading-relaxed">{desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={handlePaySubscription}
                      className="shrink-0 bg-[#0284C7] hover:bg-[#075985] text-white font-bold rounded-xl px-6 py-5 shadow-xl shadow-[#0284C7]/20 hover:shadow-2xl hover:scale-[1.02] transition-all whitespace-nowrap flex items-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      Get Verified Today
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Top Bar */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700 gap-6">
              <div>
                <h1 className="text-3xl lg:text-4xl font-serif font-bold text-[#075985] tracking-[-0.02em]">
                  {(() => {
                    const hour = new Date().getHours();
                    if (hour < 5) return 'Good Evening'; // Late night
                    if (hour < 12) return 'Good Morning';
                    if (hour < 18) return 'Good Afternoon';
                    return 'Good Evening';
                  })()}, {((displayProfile.name || 'User').split(' ') || ['User'])[0]}
                </h1>
                <p className="text-[#2D4A1E] mt-2 font-medium font-sans">Here's what's happening with your business today.</p>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <Button variant="outline" className="hidden md:flex border-[#0284C7]/15 text-primary-blue hover:bg-white items-center gap-2 rounded-xl h-12 px-6 font-medium">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </Button>
                <Button className="flex-1 md:flex-none bg-primary-blue hover:bg-primary-blue/90 text-white rounded-xl h-12 px-6 shadow-xl shadow-primary-blue/20 font-bold tracking-wide transition-all hover:-translate-y-0.5">
                  <Plus className="w-4 h-4 md:mr-2" />
                  <span className="inline">New Service</span>
                </Button>
              </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
              {[
                { label: 'Total Views', value: '0', change: '0%', icon: Eye, color: 'text-primary-blue', bg: 'bg-[#FFFDF7]' },
                { label: 'Leads Generated', value: '0', change: '0%', icon: Users, color: 'text-primary-blue', bg: 'bg-[#FFFDF7]' },
                { label: 'Rating', value: displayProfile.rating.toString(), change: '0', icon: Star, color: 'text-champagne', bg: 'bg-primary-blue' },
                { label: 'Revenue (Est.)', value: 'KES 0', change: '0%', icon: DollarSign, color: 'text-primary-blue', bg: 'bg-[#FFFDF7]' },
              ].map((stat, i) => (
                <div key={i} className={`p-6 rounded-[2rem] shadow-sm border border-[#0284C7]/10 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group ${stat.icon === Star ? 'bg-primary-blue text-white' : 'bg-white text-[#075985]'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl ${stat.icon === Star ? 'bg-white/10 text-champagne' : 'bg-alabaster text-primary-blue'} group-hover:scale-110 transition-transform duration-300`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <span className={`flex items-center text-xs font-bold px-2.5 py-1 rounded-full ${stat.icon === Star ? 'bg-white/10 text-white' : 'bg-blue-50 text-[#0284C7]'}`}>
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                      {stat.change}
                    </span>
                  </div>
                  <h3 className={`text-3xl font-serif font-bold mb-1 ${stat.icon === Star ? 'text-white' : 'text-[#075985]'}`}>{stat.value}</h3>
                  <p className={`text-sm font-bold uppercase tracking-[0.15em] font-serif ${stat.icon === Star ? 'text-white/60' : 'text-mocha/60'}`}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
              {/* Recent Activity / Leads */}
              <div className="lg:col-span-2 space-y-8">

                {/* Chart Placeholder */}
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-[#0284C7]/10">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-serif font-bold text-[#075985]">Performance Overview</h3>
                    <select className="bg-alabaster border-none text-sm font-medium rounded-lg px-4 py-2 text-[#2D4A1E] focus:ring-0 cursor-pointer outline-none hover:bg-blue-50 transition-colors font-sans">
                      <option>This Week</option>
                      <option>This Month</option>
                      <option>This Year</option>
                    </select>
                  </div>
                  <div className="h-64 flex items-end justify-between gap-3 px-4">
                    {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                      <div key={i} className="w-full bg-alabaster rounded-t-xl relative group overflow-hidden h-full">
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-primary-blue/80 group-hover:bg-kenyan-red transition-colors duration-500 rounded-t-xl mx-auto w-3/4"
                          style={{ height: `${h}%` }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-6 text-xs font-bold text-mocha/40 uppercase tracking-[0.15em] px-4 font-serif">
                    <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                  </div>
                </div>


              </div>

              {/* Side Column - Profile Completion & Quick Actions */}
              <div className="space-y-8">
                {/* Profile Card */}
                <div className="bg-primary-blue text-white p-8 rounded-[2rem] shadow-xl shadow-primary-blue/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-colors duration-700" />

                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-full border-4 border-white/10 p-1 mb-4 relative">
                      <div className="w-full h-full rounded-full bg-white/5 flex items-center justify-center overflow-hidden backdrop-blur-sm relative group">
                        {userProfile?.avatar_url ? (
                          <img src={userProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl font-serif font-bold text-white/50">
                            {((displayProfile.name || '').split(' ') || []).map((n: string) => n ? n[0] : '').join('').substring(0, 2)}
                          </span>
                        )}

                        {/* Overlay for upload */}
                        <label className="absolute inset-0 bg-blue-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          {isUploadingAvatar ? (
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          ) : (
                            <Camera className="w-6 h-6 text-white" />
                          )}
                          <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                        </label>
                      </div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 bg-kenyan-red rounded-full flex items-center justify-center border-4 border-primary-blue shadow-lg">
                        <Camera className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xl font-serif font-bold mb-1 tracking-tight">{displayProfile.name}</h3>
                    <p className="text-white/60 text-sm mb-8 font-medium">{displayProfile.service}</p>

                    <div className="w-full bg-white/10 rounded-full h-1.5 mb-3 overflow-hidden">
                      <div className="bg-champagne h-full rounded-full w-1/2 shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                    </div>
                    <div className="flex justify-between w-full text-xs font-bold text-white/40 mb-8 uppercase tracking-widest font-serif">
                      <span>Profile Completion</span>
                      <span className="text-champagne">50%</span>
                    </div>

                    <Button onClick={handleViewProfile} className="w-full bg-white text-primary-blue hover:bg-[#FFF0D6] font-bold border-none rounded-xl py-6 shadow-lg shadow-black/20 font-sans tracking-wide">
                      View Profile
                    </Button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-[#0284C7]/10">
                  <h3 className="text-xl font-serif font-bold text-[#075985] mb-6">Quick Actions</h3>
                  <div className="space-y-3">
                    <button onClick={() => setActiveTab('edit-services')} className="w-full flex items-center gap-4 p-4 rounded-xl bg-alabaster hover:bg-blue-50 transition-colors text-left group">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-primary-blue group-hover:scale-110 transition-transform">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-[#075985] text-sm font-sans">Edit Services</span>
                      <ChevronRight className="w-4 h-4 text-mocha/40 ml-auto group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button onClick={() => setActiveTab('gallery')} className="w-full flex items-center gap-4 p-4 rounded-xl bg-alabaster hover:bg-blue-50 transition-colors text-left group">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-primary-blue group-hover:scale-110 transition-transform">
                        <Image className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-[#075985] text-sm font-sans">Update Gallery</span>
                      <ChevronRight className="w-4 h-4 text-mocha/40 ml-auto group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button
                      onClick={handleUpdateLocation}
                      disabled={isUpdatingLocation}
                      className="w-full flex items-center gap-4 p-4 rounded-xl bg-alabaster hover:bg-blue-50 transition-colors text-left group disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-primary-blue group-hover:scale-110 transition-transform">
                        {isUpdatingLocation ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
                      </div>
                      <span className="font-bold text-[#075985] text-sm font-sans">
                        {isUpdatingLocation ? 'Updating...' : 'Update Location'}
                      </span>
                      {!isUpdatingLocation && <ChevronRight className="w-4 h-4 text-mocha/40 ml-auto group-hover:translate-x-1 transition-transform" />}
                    </button>
                    <button onClick={() => setActiveTab('billing')} className="w-full flex items-center gap-4 p-4 rounded-xl bg-alabaster hover:bg-blue-50 transition-colors text-left group">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-primary-blue group-hover:scale-110 transition-transform">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-[#075985] text-sm font-sans">Billing & Plans</span>
                      <ChevronRight className="w-4 h-4 text-mocha/40 ml-auto group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        );
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F2EFE8] to-[#F4FFF8] flex font-sans selection:bg-[#0284C7]/20 leading-[1.7]">

      {/* Sidebar - Premium Dark Theme */}
      <aside className="fixed left-0 top-0 h-screen w-20 lg:w-72 bg-primary-blue text-white flex flex-col transition-all duration-300 z-50 shadow-2xl shadow-primary-blue/20 hidden md:flex">
        {/* Logo */}
        <div className="h-24 flex items-center justify-center lg:justify-start lg:px-8 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="FindIt Logo" className="w-10 h-10 object-contain rounded-xl shadow-lg shadow-black/20 border border-white/5 backdrop-blur-sm bg-white" />
            <span className="hidden lg:block text-2xl font-serif font-bold tracking-tight text-white">
              FIND<span className="text-[#CE1126]">IT</span>
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-8 px-3 lg:px-6 space-y-2 overflow-y-auto custom-scrollbar">
          <div className="mb-6 lg:mb-8 lg:px-4">
            <p className="hidden lg:block text-xs font-bold text-white/40 uppercase tracking-[0.15em] mb-4 font-serif">Main Menu</p>
            <div className="space-y-1">
              {[
                { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
                { id: 'bookings', icon: Navigation, label: 'Job Requests' },
                { id: 'profile', icon: User, label: 'My Profile' },
                { id: 'stats', icon: BarChart3, label: 'Analytics' },
                { id: 'messages', icon: MessageSquare, label: 'Messages', badge: 3 },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-4 px-3 lg:px-4 py-4 rounded-xl transition-all duration-300 group ${activeTab === item.id
                    ? 'bg-white text-primary-blue shadow-lg shadow-black/20 translate-x-1'
                    : 'text-white/60 hover:bg-white/5 hover:text-white hover:pl-5'
                    }`}
                >
                  <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-[#CE1126]' : 'group-hover:text-white transition-colors'}`} />
                  <span className="hidden lg:block font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="hidden lg:flex ml-auto w-5 h-5 bg-kenyan-red text-white text-[10px] font-bold items-center justify-center rounded-full shadow-lg shadow-kenyan-red/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:px-4">
            <p className="hidden lg:block text-xs font-bold text-white/40 uppercase tracking-[0.15em] mb-4 font-serif">Settings</p>
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-4 px-3 lg:px-4 py-4 rounded-xl transition-all duration-300 group ${activeTab === 'settings'
                  ? 'bg-white text-primary-blue shadow-lg shadow-black/20 translate-x-1'
                  : 'text-white/60 hover:bg-white/5 hover:text-white hover:pl-5'}`}
              >
                <Settings className={`w-5 h-5 ${activeTab === 'settings' ? 'text-[#CE1126]' : 'group-hover:rotate-90 transition-transform'}`} />
                <span className="hidden lg:block font-medium">Settings</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-4 px-3 lg:px-4 py-4 rounded-xl text-white/60 hover:bg-white/5 hover:text-[#CE1126] transition-all duration-300 group hover:pl-5"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden lg:block font-medium">Log Out</span>
              </button>
            </div>
          </div>

          <div className="lg:px-4 pt-4">
            <p className="hidden lg:block text-xs font-bold text-white/40 uppercase tracking-[0.15em] mb-4 font-serif">Get App</p>
            <div className="space-y-1">
              <button
                onClick={() => window.open('#', '_blank')}
                className="w-full flex items-center gap-4 px-3 lg:px-4 py-4 rounded-xl text-white/60 hover:bg-white/5 hover:text-champagne transition-all duration-300 group hover:pl-5"
              >
                <Smartphone className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="hidden lg:block font-medium">iOS App</span>
              </button>
              <button
                onClick={() => window.open('#', '_blank')}
                className="w-full flex items-center gap-4 px-3 lg:px-4 py-4 rounded-xl text-white/60 hover:bg-white/5 hover:text-champagne transition-all duration-300 group hover:pl-5"
              >
                <Smartphone className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="hidden lg:block font-medium">Android App</span>
              </button>
            </div>
          </div>
        </nav>

        {/* User Mini Profile */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm cursor-pointer hover:bg-white/10 transition-colors group">
            <div className="w-10 h-10 rounded-full bg-champagne flex items-center justify-center text-primary-blue font-bold shadow-lg shadow-black/20 group-hover:scale-105 transition-transform">
              {((displayProfile.name || '').split(' ') || []).map((n: string) => n ? n[0] : '').join('').substring(0, 2)}
            </div>
            <div className="hidden lg:block overflow-hidden">
              <p className="text-sm font-bold text-white truncate font-serif">{displayProfile.name}</p>
              <p className="text-xs text-white/60 truncate font-sans">{isActive ? 'Pro Account' : isOnTrial ? 'Free Trial' : 'Inactive'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-20 lg:ml-72 p-4 md:p-8 lg:p-12 overflow-x-hidden mb-20 md:mb-0 bg-alabaster">
        {renderContent()}
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-primary-blue/95 backdrop-blur-md border-t border-white/10 flex justify-around p-2 z-30 shadow-[0_-5px_20px_rgb(0,0,0,0.2)] pb-safe">
        {[
          { id: 'overview', icon: LayoutDashboard, label: 'Home' },
          { id: 'bookings', icon: Navigation, label: 'Jobs' },
          { id: 'profile', icon: User, label: 'Profile' },
          { id: 'stats', icon: BarChart3, label: 'Stats' },
          { id: 'settings', icon: Settings, label: 'Settings' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16 ${activeTab === item.id ? 'text-champagne bg-white/10' : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-bold">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Dashboard;
