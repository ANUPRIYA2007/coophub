-- ============================================================
-- COOP HUB PILLAR PORTAL — DATABASE SCHEMA & POLICIES
-- Run this SQL in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/aqzkzaswckfoazpqeeti/sql
-- ============================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. PILLAR PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pillar_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    mobile TEXT,
    pillar_id TEXT UNIQUE DEFAULT ('CH-P' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6))),
    avatar_url TEXT,
    main_services TEXT[] DEFAULT '{}',
    sub_services TEXT[] DEFAULT '{}',
    experience_years TEXT,
    service_area TEXT,
    preferred_language TEXT DEFAULT 'en',
    is_available BOOLEAN DEFAULT TRUE,
    rating NUMERIC(3, 2) DEFAULT 5.00,
    total_reviews INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'under_review', 'approved', 'rejected', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- ============================================================
-- 3. BOOKINGS / ORDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_code TEXT UNIQUE DEFAULT ('ORD-' || FLOOR(1000 + RANDOM() * 9000)::TEXT),
    customer_id UUID REFERENCES auth.users(id),
    pillar_id UUID REFERENCES public.pillar_profiles(id),
    service_name TEXT NOT NULL,
    sub_service_name TEXT,
    customer_name TEXT NOT NULL,
    customer_mobile TEXT,
    service_address TEXT NOT NULL,
    scheduled_date DATE DEFAULT CURRENT_DATE,
    scheduled_time TEXT,
    base_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    extra_charges NUMERIC(10, 2) DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    arrival_otp TEXT DEFAULT (FLOOR(100000 + RANDOM() * 900000)::TEXT),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'onTheWay', 'arrived', 'inProgress', 'completed', 'cancelled', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- ============================================================
-- 4. EXTRA CHARGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.extra_charges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- ============================================================
-- 5. PILLAR EARNINGS / TRANSACTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pillar_earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pillar_id UUID REFERENCES public.pillar_profiles(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id),
    amount NUMERIC(10, 2) NOT NULL,
    type TEXT DEFAULT 'service' CHECK (type IN ('service', 'extra_charge', 'tip', 'bonus', 'payout')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- ============================================================
-- 6. SUPPORT TICKETS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_code TEXT UNIQUE DEFAULT ('TKT-' || FLOOR(100 + RANDOM() * 900)::TEXT),
    pillar_id UUID REFERENCES public.pillar_profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    category TEXT DEFAULT 'booking' CHECK (category IN ('account', 'booking', 'payment', 'customer', 'location', 'verification', 'technical', 'other')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    description TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'inProgress', 'resolved', 'closed')),
    response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- ============================================================
-- 7. NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'announcement',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- ============================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE public.pillar_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extra_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pillar_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow public / authenticated access for Pillar portal operations
CREATE POLICY "Allow public read of approved pillar profiles" ON public.pillar_profiles FOR SELECT USING (true);
CREATE POLICY "Allow users to insert/update their pillar profile" ON public.pillar_profiles FOR ALL USING (true);

CREATE POLICY "Allow pillars to view their bookings" ON public.bookings FOR ALL USING (true);
CREATE POLICY "Allow extra charges access" ON public.extra_charges FOR ALL USING (true);
CREATE POLICY "Allow earnings access" ON public.pillar_earnings FOR ALL USING (true);
CREATE POLICY "Allow support tickets access" ON public.support_tickets FOR ALL USING (true);
CREATE POLICY "Allow notifications access" ON public.notifications FOR ALL USING (true);
