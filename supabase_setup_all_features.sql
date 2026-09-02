-- ==============================================================================
-- COOP HUB: STREAMLINED & ROBUST SUPABASE SETUP SCRIPT
-- ==============================================================================

-- 1. UUID EXTENSION
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE TABLES IF NOT EXISTING
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    icon TEXT DEFAULT '⚡',
    name_translations JSONB DEFAULT '{}'::jsonb,
    description_translations JSONB DEFAULT '{}'::jsonb,
    active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.sub_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    base_price NUMERIC(10, 2) DEFAULT 0.00,
    name_translations JSONB DEFAULT '{}'::jsonb,
    description_translations JSONB DEFAULT '{}'::jsonb,
    active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. SEED SERVICES
INSERT INTO public.services (id, name, category, icon, display_order)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Electrical Repair', 'electrical', '⚡', 1),
    ('a0000000-0000-0000-0000-000000000002', 'Plumbing & Pipe Fixing', 'plumbing', '🔧', 2),
    ('a0000000-0000-0000-0000-000000000003', 'AC Repair & Service', 'cooling', '❄️', 3),
    ('a0000000-0000-0000-0000-000000000004', 'Appliance Repair', 'appliances', '🧺', 4),
    ('a0000000-0000-0000-0000-000000000005', 'House Painting & Polish', 'painting', '🎨', 5),
    ('a0000000-0000-0000-0000-000000000007', 'Professional Driver Services', 'transport', '🚗', 6),
    ('a0000000-0000-0000-0000-000000000010', 'Domestic Helpers', 'domestic', '🍲', 7),
    ('a0000000-0000-0000-0000-000000000011', 'Caregiver Services', 'healthcare', '🩺', 8),
    ('a0000000-0000-0000-0000-000000000012', 'Gardening & Landscaping', 'outdoor', '🌿', 9),
    ('a0000000-0000-0000-0000-000000000013', 'Technician Services', 'technical', '🔧', 10),
    ('a0000000-0000-0000-0000-000000000014', 'Emergency Services', 'emergency', '🚨', 11),
    ('a0000000-0000-0000-0000-000000000015', 'On-Demand Services', 'on-demand', '⚡', 12),
    ('a0000000-0000-0000-0000-000000000016', 'Verified Cooperative Workers', 'cooperative', '🛡️', 13),
    ('a0000000-0000-0000-0000-000000000017', 'Training & Certification', 'training', '🎓', 14)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    icon = EXCLUDED.icon,
    display_order = EXCLUDED.display_order;

-- 4. SEED SUB-SERVICES
INSERT INTO public.sub_services (id, service_id, name, base_price)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000007', 'Personal City Chauffeur (Local Trip)', 450.00),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000007', 'Outstation / Full-Day Driver', 1200.00),
    ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Ceiling Fan & Switchboard Wiring', 350.00),
    ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'Pipe Leak Repair & Tap Fixing', 250.00),
    ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000003', 'Split AC Master Service & Jet Cleaning', 600.00),
    ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000004', 'Washing Machine Drum & Motor Service', 650.00),
    ('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000005', 'Single Room Wall Painting & Primer', 2400.00),
    ('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000010', 'Daily Cooking & Meal Preparation', 350.00),
    ('b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000010', 'Household Assistance & Maid Service', 500.00),
    ('b0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000011', 'Elder Care & Daily Patient Assistance', 800.00),
    ('b0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000011', 'Home Nursing & Medication Support', 1200.00),
    ('b0000000-0000-0000-0000-000000000030', 'a0000000-0000-0000-0000-000000000012', 'Garden Maintenance & Lawn Mowing', 450.00),
    ('b0000000-0000-0000-0000-000000000031', 'a0000000-0000-0000-0000-000000000012', 'Plant Care, Pruning & Landscaping', 650.00),
    ('b0000000-0000-0000-0000-000000000040', 'a0000000-0000-0000-0000-000000000013', 'CCTV & Security Camera Setup', 850.00),
    ('b0000000-0000-0000-0000-000000000041', 'a0000000-0000-0000-0000-000000000013', 'Electronics & Equipment Maintenance', 550.00),
    ('b0000000-0000-0000-0000-000000000050', 'a0000000-0000-0000-0000-000000000014', '24/7 Urgent Plumbing & Pipe Burst Fix', 600.00),
    ('b0000000-0000-0000-0000-000000000051', 'a0000000-0000-0000-0000-000000000014', '24/7 Emergency Electrical Short Circuit', 700.00),
    ('b0000000-0000-0000-0000-000000000060', 'a0000000-0000-0000-0000-000000000015', 'Instant 30-Min Priority Dispatch', 400.00),
    ('b0000000-0000-0000-0000-000000000070', 'a0000000-0000-0000-0000-000000000016', 'Verified Skilled Cooperative Technician', 500.00),
    ('b0000000-0000-0000-0000-000000000080', 'a0000000-0000-0000-0000-000000000017', 'Worker Skill Assessment & Certification', 0.00)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    base_price = EXCLUDED.base_price;

-- 5. SERVICE REQUESTS & BILLING RECEIPT COLUMNS
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_requests') THEN
        ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS service_charge NUMERIC(10,2) DEFAULT 800.00;
        ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS materials_cost NUMERIC(10,2) DEFAULT 0.00;
        ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS additional_charges NUMERIC(10,2) DEFAULT 0.00;
        ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2) DEFAULT 800.00;
        ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS gst_amount NUMERIC(10,2) DEFAULT 144.00;
        ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10,2) DEFAULT 944.00;
        ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS receipt_number TEXT;
        ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS receipt_generated_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS customer_email_receipt_sent BOOLEAN DEFAULT false;
        ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS customer_attachments JSONB DEFAULT '[]'::jsonb;
        ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS bill_breakdown JSONB;
        ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pillar_profiles') THEN
        ALTER TABLE public.pillar_profiles ADD COLUMN IF NOT EXISTS application_id TEXT;
        ALTER TABLE public.pillar_profiles ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
        ALTER TABLE public.pillar_profiles ADD COLUMN IF NOT EXISTS kyc_document_url TEXT;
        ALTER TABLE public.pillar_profiles ADD COLUMN IF NOT EXISTS skill_certificate_url TEXT;
        ALTER TABLE public.pillar_profiles ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 6. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    role TEXT DEFAULT 'customer',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    data JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. ENABLE REALTIME REPLICATION
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_requests') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND tablename = 'service_requests'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pillar_profiles') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND tablename = 'pillar_profiles'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.pillar_profiles;
        END IF;
    END IF;
END $$;

-- 8. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read services" ON public.services;
CREATE POLICY "Public read services" ON public.services FOR SELECT USING (true);

ALTER TABLE public.sub_services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read sub_services" ON public.sub_services;
CREATE POLICY "Public read sub_services" ON public.sub_services FOR SELECT USING (true);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable full access to notifications" ON public.notifications;
CREATE POLICY "Enable full access to notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

-- 9. CONFIRMATION
SELECT 'COOP HUB SUPABASE ENHANCEMENTS COMPLETED SUCCESSFULLY!' as result;
