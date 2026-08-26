-- ============================================================================
-- COOPERATIVE ADMIN DASHBOARD & COOP HUB DATABASE SCHEMA MIGRATION (V2 - SAFE)
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard
-- ============================================================================

-- 1. Ensure UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create or Safely Update PILLAR PROFILES Table
CREATE TABLE IF NOT EXISTS public.pillar_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    full_name TEXT,
    email TEXT,
    mobile TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely add any missing columns to pillar_profiles if it was already created
ALTER TABLE public.pillar_profiles ADD COLUMN IF NOT EXISTS pillar_code TEXT;
ALTER TABLE public.pillar_profiles ADD COLUMN IF NOT EXISTS pillar_id TEXT;
ALTER TABLE public.pillar_profiles ADD COLUMN IF NOT EXISTS service_area TEXT[] DEFAULT ARRAY['Guindy', 'Adyar', 'T. Nagar', 'Velachery'];
ALTER TABLE public.pillar_profiles ADD COLUMN IF NOT EXISTS main_services TEXT[] DEFAULT ARRAY['Electrician', 'Plumber', 'Appliance Repair'];
ALTER TABLE public.pillar_profiles ADD COLUMN IF NOT EXISTS experience_years TEXT DEFAULT '3';
ALTER TABLE public.pillar_profiles ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';
ALTER TABLE public.pillar_profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'verified';
ALTER TABLE public.pillar_profiles ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;
ALTER TABLE public.pillar_profiles ADD COLUMN IF NOT EXISTS current_lat DOUBLE PRECISION DEFAULT 13.0067;
ALTER TABLE public.pillar_profiles ADD COLUMN IF NOT EXISTS current_lng DOUBLE PRECISION DEFAULT 80.2025;
ALTER TABLE public.pillar_profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Create or Safely Update SERVICE REQUESTS Table
CREATE TABLE IF NOT EXISTS public.service_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_code TEXT UNIQUE,
    customer_id UUID,
    customer_name TEXT,
    customer_phone TEXT,
    customer_address TEXT,
    category TEXT,
    service_name TEXT,
    pillar_id UUID,
    status TEXT DEFAULT 'pending',
    amount NUMERIC(10, 2) DEFAULT 0.00,
    final_amount NUMERIC(10, 2) DEFAULT 0.00,
    payment_status TEXT DEFAULT 'pending',
    location_name TEXT DEFAULT 'Chennai Central Hub',
    lat DOUBLE PRECISION DEFAULT 13.0067,
    lng DOUBLE PRECISION DEFAULT 80.2025,
    scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create BROADCAST MESSAGES Table
CREATE TABLE IF NOT EXISTS public.broadcast_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    priority TEXT DEFAULT 'normal',
    target_audience TEXT DEFAULT 'all_pillars',
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create SUPPORT TICKETS Table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pillar_id UUID,
    user_name TEXT,
    subject TEXT NOT NULL,
    issue_type TEXT DEFAULT 'general',
    description TEXT NOT NULL,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'open',
    admin_response TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create ADMIN SETTINGS Table
CREATE TABLE IF NOT EXISTS public.admin_settings (
    id INT PRIMARY KEY DEFAULT 1,
    commission_rate NUMERIC(5, 2) DEFAULT 8.50,
    emergency_contact TEXT DEFAULT '+91 94440 12345',
    auto_dispatch_enabled BOOLEAN DEFAULT TRUE,
    max_service_radius_km INT DEFAULT 15,
    payout_cycle TEXT DEFAULT 'weekly',
    system_notice TEXT DEFAULT 'Cooperative operations running smoothly across all service hubs.',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Default Admin Settings Row if not existing
INSERT INTO public.admin_settings (id, commission_rate, emergency_contact, auto_dispatch_enabled, max_service_radius_km, payout_cycle, system_notice)
VALUES (1, 8.50, '+91 94440 12345', TRUE, 15, 'weekly', 'Cooperative operations running smoothly across all service hubs.')
ON CONFLICT (id) DO NOTHING;

-- 7. Safe Indexes Creation
CREATE INDEX IF NOT EXISTS idx_pillar_profiles_status ON public.pillar_profiles(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON public.service_requests(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);

-- 8. Enable Row Level Security (RLS) & Set Permissive Policies
ALTER TABLE public.pillar_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Public full access to pillar_profiles" ON public.pillar_profiles;
    CREATE POLICY "Public full access to pillar_profiles" ON public.pillar_profiles FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public full access to service_requests" ON public.service_requests;
    CREATE POLICY "Public full access to service_requests" ON public.service_requests FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public full access to broadcast_messages" ON public.broadcast_messages;
    CREATE POLICY "Public full access to broadcast_messages" ON public.broadcast_messages FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public full access to support_tickets" ON public.support_tickets;
    CREATE POLICY "Public full access to support_tickets" ON public.support_tickets FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public full access to admin_settings" ON public.admin_settings;
    CREATE POLICY "Public full access to admin_settings" ON public.admin_settings FOR ALL USING (true) WITH CHECK (true);
END $$;
