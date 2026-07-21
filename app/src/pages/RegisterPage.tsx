import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Lock, Eye, EyeOff, Check, ChevronDown, Building2, Wrench, Upload, MapPin, Loader2, X, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import ImageSlideshow from '@/components/ImageSlideshow';
import { backgroundImages } from '@/lib/backgroundImages';
import { serviceCategories, businessCategories } from '@/lib/categories';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [registrationType, setRegistrationType] = useState<'service' | 'business'>('service');
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    category: '',
    businessName: '',
    location: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    description: '',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    openingTime: '08:00',
    closingTime: '18:00',
    agreeTerms: false,
  });
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Pre-fill form if user is already authenticated via OAuth but has no profile
  useState(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setFormData(prev => ({
          ...prev,
          email: user.email || '',
          fullName: user.user_metadata?.full_name || '',
        }));
      }
    };
    checkUser();
  });

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        setHasScrolledToBottom(true);
      }
    }
  };

  const [showPassword, setShowPassword] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({
          ...prev,
          latitude,
          longitude,
          location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        }));
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { 'User-Agent': 'FindItApp/1.0' } }
          );
          const data = await response.json();
          if (data && data.display_name) {
            const address = data.display_name.split(',').slice(0, 3).join(',');
            setFormData(prev => ({ ...prev, location: address }));
          }
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Unable to retrieve your location. Please ensure location services are enabled.');
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategorySelect = (category: string) => {
    setFormData(prev => ({ ...prev, category }));
    setShowCategories(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isProfile: boolean = false) => {
    const files = e.target.files;
    if (files) {
      if (isProfile) {
        setProfilePic(files[0]);
      } else {
        const maxPhotos = registrationType === 'business' ? 5 : 2;
        setPhotos(prev => [...prev, ...Array.from(files)].slice(0, maxPhotos));
      }
    }
  };

  const handleGoogleSignup = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error('Google signup error:', err);
      toast.error('Could not authenticate with Google.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();

    // Step 1 validation
    if (step === 1) {
      if (!formData.fullName && !formData.businessName) {
        toast.error('Please enter your name.');
        return;
      }
      if (!formData.email || !formData.email.includes('@')) {
        toast.error('Please enter a valid email address.');
        return;
      }
      if (!formData.phone) {
        toast.error('Please enter your phone number.');
        return;
      }
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match.');
        return;
      }
      setStep(step + 1);
      return;
    }

    // Step 2 validation
    if (step === 2) {
      if (!formData.category) {
        toast.error('Please select a category.');
        return;
      }
      setStep(step + 1);
      return;
    }

    // Step 3 validation
    if (step === 3) {
      if (!formData.agreeTerms) {
        toast.error('Please accept the Terms of Service to continue.');
        return;
      }
      setStep(step + 1);
      return;
    }

    // Step 4 — final submission
    setIsSubmitting(true);
    try {
      let cleanPhone = formData.phone.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('254')) {
        cleanPhone = '0' + cleanPhone.substring(3);
      }

      const phoneRegex = /^(?:254|\+254|0)?([17][0-9]{8})$/;
      if (!phoneRegex.test(cleanPhone)) {
        toast.error('Please enter a valid Safaricom or Airtel phone number.');
        setIsSubmitting(false);
        return;
      }
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters.');
        setIsSubmitting(false);
        return;
      }

      // 1. Create or Update Auth User
      const { data: { user: existingUser } } = await supabase.auth.getUser();
      let userId: string;

      if (existingUser) {
        // User already authenticated via OAuth, just update metadata
        userId = existingUser.id;
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            full_name: formData.fullName,
            business_name: formData.businessName,
            phone: formData.phone,
            category: formData.category,
            user_type: registrationType,
            location: formData.location || 'Nairobi, Kenya',
            latitude: formData.latitude,
            longitude: formData.longitude,
            working_days: formData.workingDays,
            opening_time: formData.openingTime,
            closing_time: formData.closingTime,
          }
        });
        if (updateError) throw updateError;
      } else {
        // Create new Auth User
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              business_name: formData.businessName,
              phone: formData.phone,
              category: formData.category,
              user_type: registrationType,
              location: formData.location || 'Nairobi, Kenya',
              latitude: formData.latitude,
              longitude: formData.longitude,
              working_days: formData.workingDays,
              opening_time: formData.openingTime,
              closing_time: formData.closingTime,
            },
          },
        });

        if (authError) throw new Error(authError.message);
        if (!authData.user) throw new Error('Sign-up failed — no user returned.');
        userId = authData.user.id;
      }

      // 2. Wait for DB trigger to create the profile row, then fetch its UUID
      let profileId: string | null = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id')
          .eq('auth_user_id', userId)
          .single();
        if (profileData?.id) {
          profileId = profileData.id;
          break;
        }
        // Wait 800ms between retries
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      if (!profileId) {
        // Fallback: try using auth userId directly (some setups use same UUID)
        profileId = userId;
      }

      // 3. Upload profile picture and update profile row with correct ID
      if (profilePic) {
        const fileExt = profilePic.name.split('.').pop();
        const filePath = `${userId}/avatar.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, profilePic, { upsert: true });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
          // FIX: use profileId (profiles.id), not userId (auth.uid)
          await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profileId);
        } else {
          console.error('Profile pic upload failed:', uploadError);
        }
      }

      // 4. Upload gallery/work sample photos — single clean loop, no duplicate
      if (photos.length > 0) {
        const uploadedPhotos: { profile_id: string; storage_path: string; caption: string }[] = [];

        for (const photo of photos) {
          const fileExt = photo.name.split('.').pop();
          const filePath = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('business-photos')
            .upload(filePath, photo);

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('business-photos')
              .getPublicUrl(filePath);
            uploadedPhotos.push({ profile_id: profileId, storage_path: publicUrl, caption: '' });
          } else {
            console.error('Photo upload error:', uploadError);
          }
        }

        if (uploadedPhotos.length > 0) {
          const { error: insertError } = await supabase.from('business_photos').insert(uploadedPhotos);
          if (insertError) console.error('Photo insert error:', insertError);
        }
      }

      // 5. Set profile as permanently active
      const { error: trialError } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          trial_ends_at: '2099-12-31T23:59:59.999Z',
          location: formData.location || 'Nairobi, Kenya',
          latitude: formData.latitude,
          longitude: formData.longitude,
          working_days: formData.workingDays,
          opening_time: formData.openingTime,
          closing_time: formData.closingTime,
        })
        .eq('id', profileId);

      if (trialError) console.error('Error setting profile status:', trialError);

      toast.success('Welcome to FINDIT! 🎉 Your account is now active.');
      navigate('/dashboard');
    } catch (error: unknown) {
      console.error('Registration error:', error);
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentCategories = registrationType === 'service' ? serviceCategories : businessCategories;
  const filteredCategories = currentCategories.filter(cat =>
    cat.toLowerCase().includes(formData.category.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F2EFE8] via-[#F0FFF5] to-[#FFF3DC] flex relative overflow-hidden font-sans selection:bg-[#0284C7]/20 leading-[1.7]">
      {/* Left Side - Form Section */}
      <div className="w-full lg:w-1/2 flex flex-col relative z-20 bg-[#F2EFE8]/96 backdrop-blur-sm h-screen overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="p-6 md:p-8 flex items-center justify-between sticky top-0 bg-[#F2EFE8]/95 backdrop-blur-md z-30">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/landing')}
            className="text-[#2D4A1E] hover:bg-blue-50 hover:text-primary-blue transition-colors rounded-full"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-2 font-sans">
            <span className="text-sm font-bold text-mocha/40 uppercase tracking-widest">Step {step} of 4</span>
            <div className="w-24 h-1.5 bg-blue-50 rounded-full overflow-hidden">
              <div className="h-full bg-primary-blue rounded-full transition-all duration-500 ease-out" style={{ width: `${(step / 4) * 100}%` }} />
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center px-4 sm:px-8 md:px-16 lg:px-24 py-12">
          <div className="max-w-md w-full mx-auto">
            <div className="mb-10 text-center lg:text-left animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h2 className="text-4xl font-serif font-bold text-[#075985] mb-3 tracking-[-0.02em]">Create Account</h2>
              <p className="text-[#2D4A1E] text-lg font-medium font-sans">Join Kenya's premier network of professionals.</p>
            </div>

            {/* Registration Type Toggle */}
            {step === 1 && (
              <div className="grid grid-cols-2 gap-4 mb-10 animate-in fade-in zoom-in-95 duration-500 font-sans">
                <button
                  type="button"
                  onClick={() => setRegistrationType('service')}
                  className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-3 group ${registrationType === 'service'
                    ? 'bg-primary-blue border-primary-blue text-white shadow-xl shadow-primary-blue/20'
                    : 'bg-white border-[#0284C7]/15 text-mocha/60 hover:border-primary-blue/20 hover:shadow-md'}`}
                >
                  <Wrench className={`w-8 h-8 ${registrationType === 'service' ? 'text-champagne' : 'text-mocha/40 group-hover:text-primary-blue'}`} />
                  <span className="font-bold tracking-wide">Professional</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRegistrationType('business')}
                  className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-3 group ${registrationType === 'business'
                    ? 'bg-primary-blue border-primary-blue text-white shadow-xl shadow-primary-blue/20'
                    : 'bg-white border-[#0284C7]/15 text-mocha/60 hover:border-primary-blue/20 hover:shadow-md'}`}
                >
                  <Building2 className={`w-8 h-8 ${registrationType === 'business' ? 'text-champagne' : 'text-mocha/40 group-hover:text-primary-blue'}`} />
                  <span className="font-bold tracking-wide">Business</span>
                </button>
              </div>
            )}

            <form onSubmit={handleRegistration} className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              {/* Step 1: Basic Info */}
              {step === 1 && (
                <div className="space-y-6">
                  {/* Google Sign Up */}
                  <Button
                    type="button"
                    onClick={handleGoogleSignup}
                    className="w-full py-7 bg-white text-mocha/80 border border-[#0284C7]/15 hover:bg-blue-50 font-bold text-lg rounded-xl shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-300 font-sans tracking-wide flex items-center justify-center gap-3"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.67 15.63 16.89 16.79 15.72 17.57V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
                      <path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.72 17.57C14.73 18.23 13.48 18.63 12 18.63C9.13999 18.63 6.70999 16.71 5.83999 14.12H2.16998V16.97C3.98998 20.59 7.69999 23 12 23Z" fill="#34A853"/>
                      <path d="M5.83999 14.12C5.60999 13.46 5.48 12.75 5.48 12C5.48 11.25 5.60999 10.54 5.83999 9.87999V7.02997H2.16998C1.42998 8.52997 1 10.21 1 12C1 13.79 1.42998 15.47 2.16998 16.97L5.83999 14.12Z" fill="#FBBC05"/>
                      <path d="M12 5.38C13.62 5.38 15.06 5.94 16.21 7.02L19.36 3.87C17.45 2.09 14.97 1 12 1C7.69999 1 3.98998 3.41 2.16998 7.02997L5.83999 9.87999C6.70999 7.29 9.13999 5.38 12 5.38Z" fill="#EA4335"/>
                    </svg>
                    Sign up with Google
                  </Button>
                  
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#0284C7]/15"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-6 bg-[#F2EFE8] text-[#7C4B2A]/60 font-bold uppercase tracking-[0.15em] text-xs font-serif">Or register with email</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-primary-blue uppercase tracking-[0.15em] ml-1 font-serif">
                      {registrationType === 'service' ? 'Full Name' : 'Business Name'}
                    </label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mocha/40 group-focus-within:text-primary-blue transition-colors" />
                      <Input
                        type="text"
                        placeholder={registrationType === 'service' ? 'e.g. John Kamau' : 'e.g. Nairobi Enterprises'}
                        value={registrationType === 'service' ? formData.fullName : formData.businessName}
                        onChange={(e) => handleInputChange(registrationType === 'service' ? 'fullName' : 'businessName', e.target.value)}
                        className="pl-12 pr-4 py-6 bg-white border-[#0284C7]/15 text-[#2D4A1E] placeholder:text-mocha/40 rounded-xl focus:border-primary-blue focus:ring-primary-blue/5 transition-all font-medium shadow-sm font-sans"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-primary-blue uppercase tracking-[0.15em] ml-1 font-serif">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mocha/40 group-focus-within:text-primary-blue transition-colors" />
                      <Input
                        type="email"
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="pl-12 pr-4 py-6 bg-white border-[#0284C7]/15 text-[#2D4A1E] placeholder:text-mocha/40 rounded-xl focus:border-primary-blue focus:ring-primary-blue/5 transition-all font-medium shadow-sm font-sans"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-primary-blue uppercase tracking-[0.15em] ml-1 font-serif">Phone Number</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mocha/40 group-focus-within:text-primary-blue transition-colors" />
                      <Input
                        type="tel"
                        placeholder="07XX XXX XXX or 01XX..."
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="pl-12 pr-4 py-6 bg-white border-[#0284C7]/15 text-[#2D4A1E] placeholder:text-mocha/40 rounded-xl focus:border-primary-blue focus:ring-primary-blue/5 transition-all font-medium shadow-sm font-sans"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-primary-blue uppercase tracking-[0.15em] ml-1 font-serif">Set Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mocha/40 group-focus-within:text-primary-blue transition-colors" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          className="pl-12 pr-10 py-6 bg-white border-[#0284C7]/15 text-[#2D4A1E] placeholder:text-mocha/40 rounded-xl focus:border-primary-blue focus:ring-primary-blue/5 transition-all font-medium shadow-sm font-sans tracking-widest"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-mocha/60 hover:text-primary-blue transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-primary-blue uppercase tracking-[0.15em] ml-1 font-serif">Confirm Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mocha/40 group-focus-within:text-primary-blue transition-colors" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          className="pl-12 pr-4 py-6 bg-white border-[#0284C7]/15 text-[#2D4A1E] placeholder:text-mocha/40 rounded-xl focus:border-primary-blue focus:ring-primary-blue/5 transition-all font-medium shadow-sm font-sans tracking-widest"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Category & Photos */}
              {step === 2 && (
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-primary-blue uppercase tracking-[0.15em] ml-1 font-serif">Select Category</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowCategories(!showCategories)}
                        className="w-full flex items-center justify-between px-6 py-5 bg-white border border-[#0284C7]/15 rounded-xl text-left text-[#2D4A1E] hover:border-primary-blue transition-all shadow-sm font-sans"
                      >
                        <span className={`font-medium ${formData.category ? 'text-[#2D4A1E]' : 'text-mocha/40'}`}>
                          {formData.category || 'Search and select a category...'}
                        </span>
                        <ChevronDown className={`w-5 h-5 text-mocha/40 transition-transform ${showCategories ? 'rotate-180' : ''}`} />
                      </button>
                      {showCategories && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-[#0284C7]/15 p-4 max-h-64 overflow-y-auto z-50 custom-scrollbar animate-in fade-in zoom-in-95">
                          <Input
                            type="text"
                            placeholder="Search categories..."
                            value={formData.category}
                            onChange={(e) => handleInputChange('category', e.target.value)}
                            className="bg-alabaster border-[#0284C7]/15 text-[#2D4A1E] placeholder:text-mocha/40 font-sans mb-3"
                            autoFocus
                          />
                          <div className="grid grid-cols-2 gap-2">
                            {filteredCategories.map((category, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => handleCategorySelect(category)}
                                className="text-left px-3 py-2.5 rounded-lg hover:bg-blue-50 text-mocha/80 hover:text-primary-blue text-sm transition-colors font-medium font-sans"
                              >
                                {category}
                              </button>
                            ))}
                          </div>
                          {filteredCategories.length === 0 && (
                            <p className="text-center text-mocha/40 py-4 font-medium font-sans">No categories found.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Operating Hours */}
                  <div className="space-y-4 pt-2">
                    <label className="text-xs font-bold text-primary-blue uppercase tracking-[0.15em] ml-1 font-serif">Operating Hours</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-mocha/60 uppercase tracking-widest font-sans pl-1">Opens at</label>
                        <Input
                          type="time"
                          value={formData.openingTime}
                          onChange={(e) => handleInputChange('openingTime', e.target.value)}
                          className="w-full bg-alabaster border-[#0284C7]/15 text-[#2D4A1E] font-sans h-12 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-mocha/60 uppercase tracking-widest font-sans pl-1">Closes at</label>
                        <Input
                          type="time"
                          value={formData.closingTime}
                          onChange={(e) => handleInputChange('closingTime', e.target.value)}
                          className="w-full bg-alabaster border-[#0284C7]/15 text-[#2D4A1E] font-sans h-12 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Working Days */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-primary-blue uppercase tracking-[0.15em] ml-1 font-serif">Working Days</label>
                    <div className="flex flex-wrap gap-2">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                        const isSelected = formData.workingDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                handleInputChange('workingDays', formData.workingDays.filter(d => d !== day));
                              } else {
                                handleInputChange('workingDays', [...formData.workingDays, day]);
                              }
                            }}
                            className={`px-4 py-2 rounded-full border text-sm font-medium font-sans transition-all duration-300 ${isSelected
                              ? 'bg-primary-blue text-white border-primary-blue shadow-md'
                              : 'bg-white text-mocha/60 border-[#0284C7]/15 hover:border-primary-blue/30 hover:bg-blue-50'}`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-primary-blue uppercase tracking-[0.15em] ml-1 font-serif">Business Location</label>
                    <div className="relative">
                      <div className="flex gap-4 items-start">
                        <div className="flex-1">
                          <Input
                            type="text"
                            placeholder="Detected Location (e.g. Moi Avenue, Nairobi)"
                            value={formData.location}
                            readOnly
                            className="bg-alabaster border-[#0284C7]/15 text-[#2D4A1E] placeholder:text-mocha/40 font-sans"
                          />
                          {formData.latitude && (
                            <p className="text-xs text-[#0284C7] mt-1 font-medium flex items-center gap-1 font-sans">
                              <Check className="w-3 h-3" />
                              Precise location captured ({formData.latitude.toFixed(4)}, {formData.longitude?.toFixed(4)})
                            </p>
                          )}
                        </div>
                        <Button
                          type="button"
                          onClick={handleDetectLocation}
                          disabled={isDetectingLocation}
                          className={`h-12 px-6 rounded-xl font-bold transition-all ${formData.latitude
                            ? 'bg-[#0284C7]/10 text-[#0284C7] hover:bg-[#0284C7]/20 border border-[#0284C7]/25'
                            : 'bg-primary-blue text-white hover:bg-primary-blue/90 shadow-lg shadow-primary-blue/20'}`}
                        >
                          {isDetectingLocation ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <MapPin className="w-5 h-5" />
                          )}
                          <span className="ml-2 hidden md:inline">{formData.latitude ? 'Update' : 'Detect'}</span>
                        </Button>
                      </div>
                      <p className="text-xs text-mocha/60 mt-2 ml-1 font-sans">
                        Click "Detect" to save your precise GPS location for customers to find you.
                      </p>
                    </div>
                  </div>

                  {/* Profile Picture */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-primary-blue uppercase tracking-[0.15em] ml-1 font-serif">Profile Picture</label>
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 rounded-full bg-alabaster border-2 border-dashed border-[#0284C7]/15 flex items-center justify-center overflow-hidden shrink-0">
                        {profilePic ? (
                          <img src={URL.createObjectURL(profilePic)} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-8 h-8 text-mocha/40" />
                        )}
                      </div>
                      <label className="cursor-pointer">
                        <div className="px-6 py-3 bg-primary-blue text-white rounded-xl hover:bg-primary-blue/90 transition-colors font-medium text-sm flex items-center gap-2 shadow-lg shadow-primary-blue/20 font-sans">
                          <Upload className="w-4 h-4" />
                          Upload Photo
                        </div>
                        <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, true)} className="hidden" />
                      </label>
                    </div>
                  </div>

                  {/* Work Samples */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-primary-blue uppercase tracking-[0.15em] ml-1 font-serif">Work Samples (Max {registrationType === 'business' ? 5 : 2})</label>
                    <div className="grid grid-cols-3 gap-4">
                      {photos.map((photo, index) => (
                        <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                          <img src={URL.createObjectURL(photo)} alt={`Work ${index + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setPhotos(prev => prev.filter((_, i) => i !== index))}
                            className="absolute top-1 right-1 bg-blue-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {photos.length < (registrationType === 'business' ? 5 : 2) && (
                        <label className="aspect-square rounded-xl bg-alabaster border-2 border-dashed border-[#0284C7]/15 flex flex-col items-center justify-center cursor-pointer hover:border-primary-blue/30 transition-colors gap-2 text-mocha/40 hover:text-primary-blue">
                          <Upload className="w-6 h-6" />
                          <span className="text-xs font-medium font-sans">Add Photo</span>
                          <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e)} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Terms of Service */}
              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 flex flex-col">
                  <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-[#0284C7]/10 shadow-xl shadow-primary-blue/5 flex flex-col h-[60vh] min-h-[400px] max-h-[600px]">
                    <div className="text-center space-y-2 mb-6">
                      <h2 className="text-3xl font-serif font-bold text-primary-blue tracking-tight">Terms of Service</h2>
                      <p className="text-mocha/60 text-sm font-medium">Please review our terms to continue</p>
                    </div>
                    <div className="flex-1 rounded-xl border border-[#0284C7]/10 bg-alabaster/50 p-2 shadow-inner overflow-hidden relative">
                      <div
                        ref={scrollRef}
                        onScroll={handleScroll}
                        className="h-full w-full rounded-lg px-4 py-4 overflow-y-auto custom-scrollbar"
                      >
                        <div className="space-y-6 text-sm text-mocha/80 leading-relaxed pr-4 font-sans text-justify pb-12">
                          <p><strong>Last Updated: February 20, 2026</strong></p>
                          <p>Welcome to FINDIT. By accessing or using our platform, you agree to be bound by these Terms of Service.</p>
                          <h3 className="font-bold text-primary-blue mt-4 text-base">1. Acceptance of Terms</h3>
                          <p>By registering for an account or using our services, you agree to these terms. If you do not agree, do not use our services.</p>
                          <h3 className="font-bold text-primary-blue mt-4 text-base">2. User Accounts</h3>
                          <p>You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.</p>
                          <h3 className="font-bold text-primary-blue mt-4 text-base">3. Service Providers</h3>
                          <p>Service providers verify that they are qualified to perform the services they list. FINDIT is a platform for connecting users and does not directly provide these services.</p>
                          <h3 className="font-bold text-primary-blue mt-4 text-base">4. User Conduct</h3>
                          <p>You agree not to use the platform for any unlawful purpose or in any way that interrupts, damages, or impairs the service.</p>
                          <h3 className="font-bold text-primary-blue mt-4 text-base">5. Location Services</h3>
                          <p>By using FINDIT, you consent to the collection and use of your precise geographic location. This data is essential for customers to find your business.</p>
                          <h3 className="font-bold text-primary-blue mt-4 text-base">6. Privacy</h3>
                          <p>Your use of the platform is also governed by our Privacy Policy.</p>
                          <h3 className="font-bold text-primary-blue mt-4 text-base">7. Termination</h3>
                          <p>We reserve the right to terminate or suspend your account at our sole discretion, without notice, for conduct that we believe violates these Terms.</p>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-alabaster to-transparent pointer-events-none" />
                    </div>
                    <div className="mt-6 pt-4 border-t border-[#0284C7]/10">
                      <div className={`flex items-center space-x-3 p-4 rounded-xl transition-colors group ${!hasScrolledToBottom ? 'opacity-50 cursor-not-allowed bg-blue-50' : 'hover:bg-blue-50'}`}>
                        <Checkbox
                          id="terms-step"
                          checked={formData.agreeTerms}
                          disabled={!hasScrolledToBottom}
                          onCheckedChange={(checked) => handleInputChange('agreeTerms', checked === true)}
                          className="border-gray-300 data-[state=checked]:bg-primary-blue data-[state=checked]:border-primary-blue w-5 h-5 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <label
                          htmlFor="terms-step"
                          className={`text-sm font-medium leading-none font-sans text-primary-blue select-none ${!hasScrolledToBottom ? 'cursor-not-allowed' : 'cursor-pointer group-hover:text-primary-blue/80'}`}
                        >
                          {hasScrolledToBottom ? 'I agree to the Terms of Service' : 'Scroll to bottom to agree'}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Payment / Summary */}
              {step === 4 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                  <div className="bg-white p-6 rounded-[2rem] border border-[#0284C7]/10 shadow-sm font-sans">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-full bg-primary-blue/5 flex items-center justify-center">
                        <Check className="w-6 h-6 text-primary-blue" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[#075985] font-serif">Registration Complete</h3>
                        <p className="text-sm text-mocha/60">Please review your details before starting.</p>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm border-t border-[#0284C7]/10 pt-4">
                      {[
                        { label: 'Account Type', val: registrationType, cap: true },
                        { label: 'Name', val: registrationType === 'service' ? (formData.fullName || 'Not provided') : (formData.businessName || 'Not provided') },
                        { label: 'Email', val: formData.email || 'Not provided' },
                        { label: 'Phone', val: formData.phone || 'Not provided' },
                        { label: 'Category', val: formData.category || 'Not provided' },
                      ].map((item, idx) => (
                        <div key={`summary-${idx}`} className="flex justify-between items-center py-1">
                          <span className="text-mocha/60 font-medium">{item.label}</span>
                          <span className={`text-[#2D4A1E] font-semibold ${item.cap ? 'capitalize' : ''}`}>{String(item.val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-primary-blue text-white p-6 rounded-[2rem] shadow-xl shadow-primary-blue/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                    <h3 className="text-lg font-bold mb-1 relative z-10 font-serif">Permanent Active Account</h3>
                    <div className="flex items-baseline gap-1 relative z-10 mb-2">
                      <span className="text-3xl font-serif font-bold">Free Lifetime Access</span>
                    </div>
                    <p className="text-sm text-white/60 relative z-10 font-sans">No subscription required. Your business remains visible indefinitely.</p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-4 pt-4 font-sans">
                {step > 1 && (
                  <Button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    variant="outline"
                    className="flex-1 py-7 rounded-xl border-[#0284C7]/15 text-[#2D4A1E] font-bold hover:bg-blue-50"
                  >
                    Back
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={isSubmitting || (step === 3 && !formData.agreeTerms)}
                  className="flex-1 py-7 bg-primary-blue hover:bg-primary-blue/90 text-white font-bold text-lg rounded-xl shadow-xl shadow-primary-blue/20 hover:shadow-2xl hover:shadow-primary-blue/30 transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : step === 3 ? 'I Accept & Continue'
                    : step === 4 ? 'Activate Lifetime Account'
                    : 'Continue'}
                </Button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-mocha/60 text-sm font-medium font-sans">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-primary-blue hover:text-primary-blue/80 font-bold transition-colors underline underline-offset-4"
                >
                  Login here
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Image Slideshow */}
      <div className="hidden lg:block lg:w-1/2 relative bg-gradient-to-br from-[#075985] via-[#0284C7] to-[#00883F] overflow-hidden">
        <ImageSlideshow images={backgroundImages} interval={5500} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-10" />
        <div className="absolute inset-0 bg-primary-blue/20 z-10 mix-blend-multiply" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center z-20 px-12">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-10 rounded-3xl animate-in fade-in zoom-in-95 duration-1000">
            <h3 className="text-4xl font-serif font-bold text-white mb-6 tracking-[-0.02em]">Join the Elite.</h3>
            <p className="text-white/80 text-lg leading-[1.7] mb-8 font-sans">
              "FINDIT has transformed how I do business. The quality of clients I get is unmatched."
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xl font-serif">S</div>
              <div className="text-left">
                <p className="text-white font-bold font-serif">Sarah K.</p>
                <p className="text-champagne text-sm font-sans">Professional Stylist</p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-12 left-0 right-0 text-center z-20">
          <p className="text-white/60 text-sm uppercase tracking-[0.15em] font-bold font-serif">Empowering Kenyan Businesses</p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
