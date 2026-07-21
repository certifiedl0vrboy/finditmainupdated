import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Copy .env.example to .env and fill in your Supabase URL and anon key.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Type helpers ──────────────────────────────────────────────────────────────
// Run `supabase gen types typescript --project-id YOUR_ID > src/types/supabase.ts`
// for full generated types. These manual types cover the core tables until then.

export interface Profile {
  id: string;
  auth_user_id: string;
  full_name: string | null;
  business_name: string | null;
  phone: string;
  category: string | null;
  user_type: 'service' | 'business';
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  avatar_url: string | null;
  description: string | null;
  subscription_status: 'trial' | 'active' | 'expired';
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  rating: number | null;
  reviews_count: number | null;
  working_days: string[] | null;
  opening_time: string | null;
  closing_time: string | null;
  business_hours: string | null;
  created_at: string;
}

export interface BusinessPhoto {
  id: string;
  profile_id: string;
  storage_path: string;
  caption: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  profile_id: string;
  author_name: string;
  rating: number;
  content: string;
  created_at: string;
}
