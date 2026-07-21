# FINDIT Integration Guide: Paystack + Supabase
## Complete Beginner's Guide with Security Best Practices

---

## Table of Contents
1. [Overview](#overview)
2. [Supabase Setup](#supabase-setup)
3. [Paystack Setup](#paystack-setup)
4. [Project Configuration](#project-configuration)
5. [Database Schema](#database-schema)
6. [Authentication Implementation](#authentication-implementation)
7. [Payment Integration](#payment-integration)
8. [Security Checklist](#security-checklist)
9. [Testing Guide](#testing-guide)

---

## Overview

### What We're Building
- **Supabase**: Backend database, user authentication, file storage
- **Paystack**: Payment processing for KES 250 registration fee
- **Flow**: User registers → Pays via Paystack → Account activated

### Prerequisites
- Node.js installed (v18+)
- Basic knowledge of JavaScript/TypeScript
- A code editor (VS Code recommended)
- Your FINDIT website code

---

## Supabase Setup

### Step 1: Create Supabase Account (FREE)

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub or email
4. Click "New Project"
5. Enter details:
   - **Organization**: Your name or "FINDIT"
   - **Project Name**: `findit-kenya`
   - **Database Password**: Generate a STRONG password (save it!)
   - **Region**: Select closest to Kenya ("West Europe" or "East US")
6. Click "Create new project"
7. Wait 2-3 minutes for setup

### Step 2: Get Your API Keys

1. In your project dashboard, click the **Settings** icon (gear)
2. Click **API** in the left sidebar
3. Copy these values (you'll need them):
   - **Project URL**: `https://xxxxxx.supabase.co`
   - **anon public**: `eyJhbG...` (starts with eyJ)
   - **service_role secret**: `eyJhbG...` (KEEP THIS SECRET!)

### Step 3: Install Supabase Client

Open your terminal in your project folder:

```bash
cd /mnt/okcomputer/output/app
npm install @supabase/supabase-js
```

### Step 4: Create Supabase Client File

Create a new file: `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

// These come from your Supabase dashboard
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Type definitions for your tables
export type UserProfile = {
  id: string;
  phone: string;
  full_name: string;
  business_name?: string;
  service_category: string;
  location: string;
  profile_image?: string;
  subscription_status: 'active' | 'expired' | 'pending';
  subscription_expires_at: string;
  paystack_customer_code?: string;
  created_at: string;
};

export type Payment = {
  id: string;
  user_id: string;
  paystack_reference: string;
  amount: number;
  status: 'pending' | 'success' | 'failed';
  paid_at?: string;
  created_at: string;
};
```

### Step 5: Create Environment Variables

Create a file in your project root: `.env`

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Paystack Configuration
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_key_here
```

**IMPORTANT**: Add `.env` to your `.gitignore` file so secrets aren't uploaded to GitHub!

```bash
# In your .gitignore file, add:
.env
.env.local
.env.production
```

---

## Paystack Setup

### Step 1: Create Paystack Account

1. Go to https://paystack.com
2. Click "Create free account"
3. Fill in your business details:
   - Business name: "FINDIT"
   - Email: your email
   - Phone: your phone
4. Verify your email
5. Complete KYC (Know Your Customer):
   - Upload ID
   - Add bank account for payouts
   - Business registration (if you have it)

### Step 2: Get API Keys

1. Login to Paystack Dashboard
2. Go to **Settings** → **API Keys**
3. Copy:
   - **Public Key**: `pk_test_...` (for frontend)
   - **Secret Key**: `sk_test_...` (for backend - NEVER expose this!)

### Step 3: Install Paystack SDK

```bash
npm install @paystack/inline-js
```

### Step 4: Create Payment Utility

Create file: `src/lib/paystack.ts`

```typescript
import PaystackPop from '@paystack/inline-js';

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

interface PaymentConfig {
  email: string;
  amount: number; // in kobo (250 KES = 25000)
  reference: string;
  metadata?: Record<string, any>;
  onSuccess: (reference: string) => void;
  onCancel: () => void;
}

export const initializePayment = ({
  email,
  amount,
  reference,
  metadata,
  onSuccess,
  onCancel,
}: PaymentConfig) => {
  const handler = new PaystackPop();
  
  handler.newTransaction({
    key: PAYSTACK_PUBLIC_KEY,
    email,
    amount,
    reference,
    metadata,
    currency: 'KES',
    channels: ['card', 'bank', 'ussd', 'mobile_money'],
    onSuccess: (transaction: any) => {
      onSuccess(transaction.reference);
    },
    onCancel: () => {
      onCancel();
    },
  });
};

// Generate unique payment reference
export const generateReference = (userId: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `FINDIT_${userId}_${timestamp}_${random}`;
};
```

---

## Database Schema

### Step 1: Create Tables in Supabase

Go to your Supabase dashboard → **Table Editor** → **New Table**

#### Table 1: `profiles` (User Profiles)

```sql
-- Run this in Supabase SQL Editor
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT UNIQUE NOT NULL,
  full_name TEXT,
  business_name TEXT,
  service_category TEXT,
  location TEXT,
  profile_image TEXT,
  subscription_status TEXT DEFAULT 'pending',
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  paystack_customer_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

#### Table 2: `payments` (Payment Records)

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  paystack_reference TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own payments
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);
```

#### Table 3: `business_photos` (User Photos)

```sql
CREATE TABLE business_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  is_profile_picture BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE business_photos ENABLE ROW LEVEL SECURITY;
```

### Step 2: Set Up Storage (For Photos)

1. Go to **Storage** in Supabase dashboard
2. Click **New Bucket**
3. Name: `business-photos`
4. Check: **Public bucket** (so images can be viewed)
5. Click **Create bucket**

Set up security policy:
```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow public to view
CREATE POLICY "Public can view photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'business-photos');
```

---

## Authentication Implementation

### Step 1: Create Auth Hook

Create file: `src/hooks/useAuth.ts`

```typescript
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  signUp: (phone: string, password: string, userData: any) => Promise<{ error: any }>;
  signIn: (phone: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data);
  };

  // Sign up with phone
  const signUp = async (phone: string, password: string, userData: any) => {
    // Format phone: +2547XXXXXXXX
    const formattedPhone = phone.startsWith('+') ? phone : `+254${phone.replace(/^0/, '')}`;
    
    const { data, error } = await supabase.auth.signUp({
      phone: formattedPhone,
      password,
      options: {
        data: {
          full_name: userData.fullName,
          business_name: userData.businessName,
          service_category: userData.category,
          location: userData.location,
        },
      },
    });

    if (!error && data.user) {
      // Create profile record
      await supabase.from('profiles').insert({
        id: data.user.id,
        phone: formattedPhone,
        full_name: userData.fullName,
        business_name: userData.businessName,
        service_category: userData.category,
        location: userData.location,
        subscription_status: 'pending',
      });
    }

    return { error };
  };

  // Sign in with phone
  const signIn = async (phone: string, password: string) => {
    const formattedPhone = phone.startsWith('+') ? phone : `+254${phone.replace(/^0/, '')}`;
    
    const { error } = await supabase.auth.signInWithPassword({
      phone: formattedPhone,
      password,
    });

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### Step 2: Wrap Your App with AuthProvider

Update `src/main.tsx`:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './hooks/useAuth';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
```

---

## Payment Integration

### Step 1: Create Payment Hook

Create file: `src/hooks/usePayment.ts`

```typescript
import { useState } from 'react';
import { initializePayment, generateReference } from '@/lib/paystack';
import { supabase } from '@/lib/supabase';

interface UsePaymentReturn {
  processing: boolean;
  error: string | null;
  initiatePayment: (userId: string, email: string, phone: string) => Promise<void>;
  verifyPayment: (reference: string) => Promise<boolean>;
}

export const usePayment = (): UsePaymentReturn => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiatePayment = async (userId: string, email: string, phone: string) => {
    setProcessing(true);
    setError(null);

    try {
      // Generate unique reference
      const reference = generateReference(userId);

      // Save pending payment to database
      const { error: dbError } = await supabase.from('payments').insert({
        user_id: userId,
        paystack_reference: reference,
        amount: 25000, // KES 250 in kobo
        status: 'pending',
      });

      if (dbError) throw dbError;

      // Initialize Paystack payment
      initializePayment({
        email: email || `${phone}@findit.com`,
        amount: 25000,
        reference,
        metadata: {
          user_id: userId,
          phone,
          purpose: 'subscription',
        },
        onSuccess: async (paymentRef) => {
          await verifyPayment(paymentRef);
        },
        onCancel: () => {
          setError('Payment was cancelled');
          setProcessing(false);
        },
      });
    } catch (err: any) {
      setError(err.message);
      setProcessing(false);
    }
  };

  const verifyPayment = async (reference: string): Promise<boolean> => {
    try {
      // Call your backend to verify payment
      // For now, we'll simulate success
      
      // Update payment status
      await supabase
        .from('payments')
        .update({ 
          status: 'success',
          paid_at: new Date().toISOString(),
        })
        .eq('paystack_reference', reference);

      // Get user_id from payment
      const { data: payment } = await supabase
        .from('payments')
        .select('user_id')
        .eq('paystack_reference', reference)
        .single();

      if (payment) {
        // Activate subscription (30 days from now)
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);

        await supabase
          .from('profiles')
          .update({
            subscription_status: 'active',
            subscription_expires_at: expiryDate.toISOString(),
          })
          .eq('id', payment.user_id);
      }

      setProcessing(false);
      return true;
    } catch (err: any) {
      setError(err.message);
      setProcessing(false);
      return false;
    }
  };

  return { processing, error, initiatePayment, verifyPayment };
};
```

### Step 2: Update Register Page with Payment

In your `RegisterPage.tsx`, add the payment flow:

```typescript
import { usePayment } from '@/hooks/usePayment';
import { useAuth } from '@/hooks/useAuth';

// Inside your component:
const { signUp } = useAuth();
const { processing, error, initiatePayment } = usePayment();

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (step < 3) {
    setStep(step + 1);
    return;
  }

  // Step 3: Create account and initiate payment
  const { error: signUpError } = await signUp(formData.phone, formData.password, {
    fullName: formData.fullName,
    businessName: formData.businessName,
    category: formData.category,
    location: userLocation,
  });

  if (signUpError) {
    alert('Registration failed: ' + signUpError.message);
    return;
  }

  // Initiate payment
  const userId = // get from auth context
  await initiatePayment(
    userId,
    '', // email (optional)
    formData.phone
  );
};
```

---

## Security Checklist

### ✅ Critical Security Measures

1. **Never expose secret keys**
   - `sk_test_...` (Paystack secret) → ONLY backend
   - `service_role` (Supabase) → ONLY backend
   - Store in environment variables

2. **Enable Row Level Security (RLS)**
   - All tables should have RLS enabled
   - Users can only access their own data

3. **Validate all inputs**
   ```typescript
   // Sanitize phone numbers
   const cleanPhone = phone.replace(/\D/g, '');
   
   // Validate password strength
   const isStrong = password.length >= 8 && /[A-Z]/.test(password);
   ```

4. **Use HTTPS only**
   - Never send data over HTTP
   - Supabase and Paystack both enforce HTTPS

5. **Rate limiting**
   - Limit login attempts (max 5 per minute)
   - Limit payment attempts

6. **CSRF Protection**
   - Supabase handles this automatically

### Environment Variables Security

```bash
# .env file - NEVER commit this!
VITE_SUPABASE_URL=your-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_key

# For backend only (create separate .env.server)
SUPABASE_SERVICE_ROLE_KEY=your-service-role
PAYSTACK_SECRET_KEY=sk_test_your_secret
```

---

## Testing Guide

### Test Mode (Development)

**Paystack Test Cards:**
- Card Number: `4084084084084081`
- Expiry: Any future date (e.g., 12/25)
- CVV: `000`
- PIN: `1234`

**Supabase:**
- Use the Table Editor to view/add test data
- Check Authentication → Users to see registered users

### Testing Steps

1. **Registration Flow:**
   - Fill registration form
   - Use test card for payment
   - Verify profile created in Supabase
   - Verify payment record created

2. **Login Flow:**
   - Login with registered phone
   - Check dashboard shows correct data
   - Verify subscription status

3. **Payment Verification:**
   - Check payment appears in Paystack dashboard
   - Verify subscription expiry date set correctly

---

## Deployment Checklist

Before going live:

- [ ] Switch Paystack to LIVE mode (get live keys)
- [ ] Update environment variables with LIVE keys
- [ ] Enable RLS on all tables
- [ ] Set up proper CORS in Supabase
- [ ] Test all flows in production
- [ ] Set up monitoring/alerts
- [ ] Create backup strategy

---

## Next Steps

1. **Set up Supabase** (follow Step 1-2 above)
2. **Set up Paystack** (follow Step 1-2 above)
3. **Create database tables** (run SQL in Supabase)
4. **Install dependencies** (`npm install` commands)
5. **Create the files** (supabase.ts, paystack.ts, hooks)
6. **Test with test cards**
7. **Go live!**

---

## Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **Paystack Docs**: https://paystack.com/docs
- **Paystack Test Cards**: https://paystack.com/docs/payments/test-payments

---

**Need help?** Both Supabase and Paystack have excellent support teams and community forums!
