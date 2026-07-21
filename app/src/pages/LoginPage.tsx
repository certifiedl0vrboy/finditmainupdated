import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import ImageSlideshow from '@/components/ImageSlideshow';
import { backgroundImages } from '@/lib/backgroundImages';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('expired') === '1') {
      toast.error('Your free trial or subscription has ended. Log back in and subscribe to keep your profile visible.');
    }
  }, [searchParams]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
        options: {
          // persistSession controls whether session survives browser close
          // Supabase uses localStorage by default; passing this via client-level config
        },
      });

      if (signInError) {
        setIsLoading(false);
        if (signInError.message.includes('Invalid login credentials')) {
          toast.error('Incorrect password or email. Please try again.');
        } else {
          toast.error(signInError.message);
        }
        return;
      }

      // If "remember me" is NOT checked, set a short session that expires on tab close
      if (!rememberMe) {
        // We sign out on page unload so the session doesn't persist
        window.addEventListener('beforeunload', () => supabase.auth.signOut(), { once: true });
      }

      toast.success('Welcome back!');
      navigate('/dashboard');

    } catch (err) {
      console.error('Login error:', err);
      setIsLoading(false);
      toast.error('An unexpected error occurred. Please try again.');
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) {
        toast.error(error.message);
      }
    } catch (err) {
      console.error('Google login error:', err);
      toast.error('An unexpected error occurred with Google login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address first, then tap Forgot Password.');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error('Could not send reset link. Please try again.');
    } else {
      toast.success('Reset link sent! Check your email or contact support.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F2EFE8] via-[#F0FFF5] to-[#FFF3DC] flex relative overflow-hidden font-sans selection:bg-[#0284C7]/20 leading-[1.7]">
      {/* Left Side - Form Section */}
      <div className="w-full lg:w-1/2 flex flex-col relative z-20 bg-[#F2EFE8]/96 backdrop-blur-sm">
        {/* Header */}
        <div className="p-6 md:p-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/landing')}
            className="text-[#2D4A1E] hover:bg-blue-50 hover:text-primary-blue transition-colors rounded-full"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </div>

        <div className="flex-1 flex flex-col justify-center px-4 sm:px-8 md:px-16 lg:px-24">
          <div className="max-w-md w-full mx-auto">
            {/* Logo & Welcome */}
            <div className="mb-12 text-center lg:text-left animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-8">
                <img src="/logo.jpg" alt="FindIt Logo" className="w-12 h-12 object-contain rounded-xl shadow-lg shadow-primary-blue/20 transform -rotate-3" />
                <h1 className="text-3xl font-serif font-bold text-[#075985] tracking-[-0.02em]">FIND<span className="text-primary-blue">IT</span></h1>
              </div>
              <h2 className="text-4xl font-serif font-bold text-[#075985] mb-4 tracking-[-0.02em]">Welcome back</h2>
              <p className="text-[#2D4A1E] text-lg font-medium font-sans">Please enter your details to sign in.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
              {/* Email Input */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-primary-blue ml-1 uppercase tracking-[0.15em] font-serif">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mocha/60 group-focus-within:text-primary-blue transition-colors" />
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 pr-4 py-6 bg-white border-[#0284C7]/15 text-[#2D4A1E] placeholder:text-mocha/40 rounded-xl focus:border-primary-blue focus:ring-primary-blue/5 transition-all font-medium shadow-sm font-sans"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-primary-blue ml-1 uppercase tracking-[0.15em] font-serif">Enter Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mocha/60 group-focus-within:text-primary-blue transition-colors" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 py-6 bg-white border-[#0284C7]/15 text-[#2D4A1E] placeholder:text-mocha/40 rounded-xl focus:border-primary-blue focus:ring-primary-blue/5 transition-all font-medium shadow-sm font-sans tracking-widest"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-mocha/60 hover:text-primary-blue transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    className="border-gray-300 data-[state=checked]:bg-primary-blue data-[state=checked]:border-primary-blue rounded text-white w-5 h-5"
                  />
                  <label htmlFor="remember" className="text-sm text-[#2D4A1E]/80 font-medium cursor-pointer select-none font-sans">
                    Remember me
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm font-bold text-primary-blue hover:text-primary-blue/80 hover:underline underline-offset-4 font-sans"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-7 bg-primary-blue hover:bg-primary-blue/90 text-white font-bold text-lg rounded-xl shadow-xl shadow-primary-blue/20 hover:shadow-2xl hover:shadow-primary-blue/30 transform hover:-translate-y-0.5 transition-all duration-300 mt-4 font-sans tracking-wide"
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign in'
                )}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#0284C7]/15"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-6 bg-[#F2EFE8] text-[#7C4B2A]/60 font-bold uppercase tracking-[0.15em] text-xs font-serif">Or continue with</span>
                </div>
              </div>

              {/* Google Auth Button */}
              <Button
                type="button"
                disabled={isLoading}
                onClick={handleGoogleLogin}
                className="w-full py-7 bg-white text-mocha/80 border border-[#0284C7]/15 hover:bg-blue-50 font-bold text-lg rounded-xl shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-300 font-sans tracking-wide flex items-center justify-center gap-3"
              >
                {/* Google Auth Button - using inline SVG for the Google logo */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.67 15.63 16.89 16.79 15.72 17.57V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
                  <path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.72 17.57C14.73 18.23 13.48 18.63 12 18.63C9.13999 18.63 6.70999 16.71 5.83999 14.12H2.16998V16.97C3.98998 20.59 7.69999 23 12 23Z" fill="#34A853"/>
                  <path d="M5.83999 14.12C5.60999 13.46 5.48 12.75 5.48 12C5.48 11.25 5.60999 10.54 5.83999 9.87999V7.02997H2.16998C1.42998 8.52997 1 10.21 1 12C1 13.79 1.42998 15.47 2.16998 16.97L5.83999 14.12Z" fill="#FBBC05"/>
                  <path d="M12 5.38C13.62 5.38 15.06 5.94 16.21 7.02L19.36 3.87C17.45 2.09 14.97 1 12 1C7.69999 1 3.98998 3.41 2.16998 7.02997L5.83999 9.87999C6.70999 7.29 9.13999 5.38 12 5.38Z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#0284C7]/15"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-6 bg-[#F2EFE8] text-[#7C4B2A]/60 font-bold uppercase tracking-[0.15em] text-xs font-serif">New to Find It?</span>
              </div>
            </div>

            {/* Register Link */}
            <div className="text-center">
              <button
                onClick={() => navigate('/register')}
                className="group text-[#075985] hover:text-primary-blue font-bold text-base transition-colors flex items-center justify-center gap-2 mx-auto font-sans"
              >
                Create an account
                <span className="block max-w-0 group-hover:max-w-full transition-all duration-500 h-0.5 bg-primary-blue"></span>
              </button>
            </div>

            <div className="mt-16 text-center text-xs text-mocha/40 font-bold tracking-[0.15em] uppercase font-serif">
              &copy; {new Date().getFullYear()} Find It. All rights reserved.
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Image Slideshow */}
      <div className="hidden lg:block lg:w-1/2 relative bg-gradient-to-br from-[#075985] via-[#0284C7] to-[#00883F] overflow-hidden">
        <ImageSlideshow images={backgroundImages} interval={5000} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-10" />
        <div className="absolute inset-0 bg-primary-blue/20 z-10 mix-blend-multiply" />
        <div className="absolute bottom-0 left-0 right-0 p-16 z-20 text-white">
          <div className="max-w-xl mx-auto lg:mx-0 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
            <h3 className="text-5xl font-serif font-bold mb-6 leading-[0.95] tracking-[-0.02em]">Connect with <br />Excellence.</h3>
            <p className="text-white/80 text-lg leading-[1.7] max-w-md font-sans">
              Join thousands of Kenyan businesses and service providers growing their reach today.
            </p>
            <div className="h-1 w-24 bg-champagne mt-8 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
