import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

/**
 * FEATURE FLAG: set VITE_ENFORCE_SUBSCRIPTION=false in .env to temporarily
 * grant every logged-in user full access regardless of trial/subscription
 * status (e.g. during a promotional period). Defaults to true (enforced).
 * This flag exists so "always free" can be a deliberate, visible decision
 * rather than logic quietly hardcoded and forgotten — see the audit report
 * section 3.1 for why this matters.
 */
const ENFORCE_SUBSCRIPTION = import.meta.env.VITE_ENFORCE_SUBSCRIPTION !== 'false';

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const checkAccess = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setAuthorized(false);
                    setLoading(false);
                    return;
                }

                if (!ENFORCE_SUBSCRIPTION) {
                    setAuthorized(true);
                    setLoading(false);
                    return;
                }

                // Fetch profile to check subscription/trial status
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('subscription_status, trial_ends_at, subscription_ends_at')
                    .eq('auth_user_id', user.id)
                    .single();

                if (!profile) {
                    // No profile yet - let them in so they can complete registration/setup
                    setAuthorized(true);
                    setLoading(false);
                    return;
                }

                const now = new Date();
                const isActivePaid =
                    profile.subscription_status === 'active' &&
                    (!profile.subscription_ends_at || new Date(profile.subscription_ends_at) > now);
                const isOnValidTrial =
                    profile.subscription_status === 'trial' &&
                    !!profile.trial_ends_at &&
                    new Date(profile.trial_ends_at) > now;

                setAuthorized(isActivePaid || isOnValidTrial);
            } catch {
                setAuthorized(false);
            } finally {
                setLoading(false);
            }
        };

        checkAccess();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#075985] to-[#0284C7] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#0284C7] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!authorized) {
        return <Navigate to="/login?expired=1" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
