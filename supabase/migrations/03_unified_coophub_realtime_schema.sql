-- ============================================================================
-- COOP HUB 3-PORTAL UNIFIED REALTIME & INTERCONNECTION SCHEMA (V3)
-- Connects: 1) Customer Portal, 2) Pillar Portal, 3) Cooperative Admin Portal
-- Enables: Live Supabase Realtime across all 3 portals
-- ============================================================================

-- 1. Ensure UUID extension is active
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Customer Profiles Table (if not exists)
CREATE TABLE IF NOT EXISTS public.customer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    full_name TEXT NOT NULL,
    mobile TEXT,
    email TEXT,
    address TEXT,
    city TEXT DEFAULT 'Chennai',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Pillar Profiles Table (Ensure all fields exist)
CREATE TABLE IF NOT EXISTS public.pillar_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    full_name TEXT,
    email TEXT,
    mobile TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- 4. Unified Bookings / Service Requests Table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_code TEXT UNIQUE DEFAULT ('ORD-' || FLOOR(1000 + RANDOM() * 9000)::TEXT),
    customer_id UUID,
    pillar_id UUID,
    service_name TEXT NOT NULL,
    sub_service_name TEXT,
    customer_name TEXT NOT NULL,
    customer_mobile TEXT,
    service_address TEXT NOT NULL,
    scheduled_date DATE DEFAULT CURRENT_DATE,
    scheduled_time TEXT DEFAULT '10:00 AM',
    base_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    extra_charges NUMERIC(10, 2) DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    arrival_otp TEXT DEFAULT (FLOOR(100000 + RANDOM() * 900000)::TEXT),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'assigned', 'onTheWay', 'arrived', 'inProgress', 'in_progress', 'completed', 'cancelled', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure service_requests table also exists and mirrors bookings
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

-- 5. Broadcast Messages Table
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

-- 6. Support Tickets Table
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

-- 7. Admin Settings Table
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

INSERT INTO public.admin_settings (id, commission_rate, emergency_contact, auto_dispatch_enabled, max_service_radius_km, payout_cycle, system_notice)
VALUES (1, 8.50, '+91 94440 12345', TRUE, 15, 'weekly', 'Cooperative operations running smoothly across all service hubs.')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 8. AUTOMATIC BIDIRECTIONAL SYNC TRIGGER BETWEEN BOOKINGS & SERVICE_REQUESTS
-- ============================================================================
CREATE OR REPLACE FUNCTION sync_booking_to_service_request()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.service_requests (
        id, order_code, customer_id, customer_name, customer_phone,
        customer_address, service_name, category, pillar_id, status,
        amount, final_amount, scheduled_at, updated_at
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.booking_code, 'ORD-' || SUBSTRING(NEW.id::TEXT, 1, 6)),
        NEW.customer_id,
        NEW.customer_name,
        NEW.customer_mobile,
        NEW.service_address,
        NEW.service_name,
        COALESCE(NEW.sub_service_name, 'General'),
        NEW.pillar_id,
        NEW.status,
        NEW.base_amount,
        NEW.total_amount,
        COALESCE(NEW.created_at, NOW()),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        pillar_id = EXCLUDED.pillar_id,
        status = EXCLUDED.status,
        final_amount = EXCLUDED.final_amount,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_booking_to_service_request ON public.bookings;
CREATE TRIGGER trg_sync_booking_to_service_request
AFTER INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION sync_booking_to_service_request();

-- ============================================================================
-- 9. ENABLE SUPABASE REALTIME REPLICATION & REPLICA IDENTITY
-- ============================================================================
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.service_requests REPLICA IDENTITY FULL;
ALTER TABLE public.pillar_profiles REPLICA IDENTITY FULL;
ALTER TABLE public.broadcast_messages REPLICA IDENTITY FULL;
ALTER TABLE public.support_tickets REPLICA IDENTITY FULL;
ALTER TABLE public.admin_settings REPLICA IDENTITY FULL;

-- Add all shared tables to the Realtime publication
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.pillar_profiles;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcast_messages;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_settings;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

-- 10. Permissive RLS Policies for Seamless Multi-Portal Access
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pillar_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Unified access to bookings" ON public.bookings;
    CREATE POLICY "Unified access to bookings" ON public.bookings FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Unified access to service_requests" ON public.service_requests;
    CREATE POLICY "Unified access to service_requests" ON public.service_requests FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Unified access to pillar_profiles" ON public.pillar_profiles;
    CREATE POLICY "Unified access to pillar_profiles" ON public.pillar_profiles FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Unified access to broadcast_messages" ON public.broadcast_messages;
    CREATE POLICY "Unified access to broadcast_messages" ON public.broadcast_messages FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Unified access to support_tickets" ON public.support_tickets;
    CREATE POLICY "Unified access to support_tickets" ON public.support_tickets FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Unified access to admin_settings" ON public.admin_settings;
    CREATE POLICY "Unified access to admin_settings" ON public.admin_settings FOR ALL USING (true) WITH CHECK (true);
END $$;
