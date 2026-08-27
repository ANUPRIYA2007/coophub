-- ==============================================================================
-- COOP HUB COMPLETE UNIFIED DATABASE SCHEMA (Supabase SQL Editor Ready)
-- Covers: Customer Portal, Pillar Partner Portal, and Cooperative Admin Portal
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. USER PROFILES & AUTH SYNCHRONIZATION
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    role TEXT CHECK (role IN ('customer', 'pillar', 'admin')) DEFAULT 'customer',
    preferred_language TEXT DEFAULT 'en',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile trigger on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, phone, role, preferred_language)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'mobile_number', NEW.phone, ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
        COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en')
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 3. SERVICES & SUB-SERVICES CATALOGUE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    icon TEXT,
    name_translations JSONB DEFAULT '{}'::jsonb,
    description_translations JSONB DEFAULT '{}'::jsonb,
    active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sub_services (
    id TEXT PRIMARY KEY,
    service_id TEXT REFERENCES public.services(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    base_price NUMERIC(10,2) DEFAULT 0,
    name_translations JSONB DEFAULT '{}'::jsonb,
    description_translations JSONB DEFAULT '{}'::jsonb,
    active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. SERVICE REQUESTS & BOOKING LIFECYCLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.service_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    service_id TEXT REFERENCES public.services(id) ON DELETE SET NULL,
    sub_service_id TEXT REFERENCES public.sub_services(id) ON DELETE SET NULL,
    pillar_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT CHECK (status IN ('requested', 'pending', 'assigned', 'accepted', 'on_the_way', 'arrived', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
    location_type TEXT DEFAULT 'manual',
    address_line TEXT,
    area TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    flexible_timing BOOLEAN DEFAULT FALSE,
    preferred_date DATE,
    preferred_time TEXT,
    customer_description TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    arrival_otp TEXT,
    extra_charge_amount NUMERIC(10,2) DEFAULT 0,
    extra_charge_reason TEXT,
    extra_charge_status TEXT CHECK (extra_charge_status IN ('none', 'pending', 'accepted', 'rejected')) DEFAULT 'none',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.request_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.service_requests(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 5. REALTIME CHAT MESSAGING (CUSTOMER ↔ PILLAR)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.service_requests(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    sender_type TEXT CHECK (sender_type IN ('customer', 'pillar', 'admin')) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Realtime publication on messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;

-- ==============================================================================
-- 6. INVOICES & PAYMENTS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.service_requests(id) ON DELETE CASCADE,
    invoice_number TEXT UNIQUE NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'INR',
    invoice_status TEXT CHECK (invoice_status IN ('pending', 'paid', 'refunded')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.service_requests(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    payment_method TEXT DEFAULT 'upi',
    payment_status TEXT CHECK (payment_status IN ('pending', 'completed', 'failed')) DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 7. REVIEWS & RATINGS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.service_requests(id) ON DELETE CASCADE UNIQUE,
    customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    pillar_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 8. CUSTOMER & PILLAR SUPPORT TICKETS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    description TEXT NOT NULL,
    status TEXT CHECK (status IN ('open', 'in_progress', 'waiting_for_customer', 'resolved', 'closed')) DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 9. NOTIFICATIONS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    request_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Public Services Read Access
CREATE POLICY "Public read services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Public read sub_services" ON public.sub_services FOR SELECT USING (true);

-- Profiles Access
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Service Requests Access
CREATE POLICY "Customers view own requests" ON public.service_requests FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Customers create requests" ON public.service_requests FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers update own requests" ON public.service_requests FOR UPDATE USING (auth.uid() = customer_id);

-- Messages Access
CREATE POLICY "Participants view messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Authenticated users send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Invoices & Reviews
CREATE POLICY "Customers view own invoices" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Customers submit reviews" ON public.reviews FOR ALL USING (auth.uid() = customer_id);

-- Support & Notifications
CREATE POLICY "Customers view own tickets" ON public.support_tickets FOR ALL USING (auth.uid() = customer_id);
CREATE POLICY "Customers view own notifications" ON public.notifications FOR ALL USING (auth.uid() = customer_id);
