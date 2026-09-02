-- ==============================================================================
-- COOP HUB: COMPLETE SUPABASE SQL SCHEMA & ENHANCEMENTS SCRIPT (UUID VALIDATED)
-- Copy and paste this script into your Supabase SQL Editor and click "RUN".
-- ==============================================================================

-- 1. ENABLE UUID EXTENSION
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. ENSURE SERVICE CATEGORIES & SUB-SERVICES TABLE
-- ==============================================================================
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

-- ==============================================================================
-- 3. INSERT / SEED ALL 8 NEW SERVICE CATEGORIES + CORE MASTER CATEGORIES (VALID UUIDs)
-- ==============================================================================
INSERT INTO public.services (id, name, category, icon, name_translations, description_translations, active, display_order)
VALUES
    ('a0000000-0000-0000-0000-000000000001'::uuid, 'Electrical Repair', 'electrical', '⚡', 
     '{"en": "Electrical Repair", "ta": "மின்சார பழுதுபார்ப்பு", "hi": "बिजली मरम्मत"}'::jsonb,
     '{"en": "Fan repair, switchboard wiring, inverter installation & short circuit fixes.", "ta": "மின்விசிறி பழுது, சுவிட்ச்போர்டு வயரிங் மற்றும் இன்வெர்ட்டர் பொருத்துதல்."}'::jsonb, true, 1),
    ('a0000000-0000-0000-0000-000000000003'::uuid, 'AC Repair & Service', 'cooling', '❄️',
     '{"en": "AC Repair & Service", "ta": "ஏசி பழுது மற்றும் பராமரிப்பு", "hi": "एसी मरम्मत और सर्विसिंग"}'::jsonb,
     '{"en": "Gas leak repair, deep jet pump cleaning, cooling issues and PCB service.", "ta": "கேஸ் கசிவு சரிசெய்தல், ஜெட் பம்ப் சர்வீஸ் மற்றும் கூலிங் பராமரிப்பு."}'::jsonb, true, 2),
    ('a0000000-0000-0000-0000-000000000002'::uuid, 'Plumbing & Pipe Fixing', 'plumbing', '🔧',
     '{"en": "Plumbing & Pipe Fixing", "ta": "பிளம்பிங் மற்றும் குழாய் பொருத்துதல்", "hi": "प्लंबिंग और पाइप मरम्मत"}'::jsonb,
     '{"en": "Pipe leakage, tap fixture replacement, motor installation and drainage blockage.", "ta": "குழாய் கசிவு, புதிய குழாய் பொருத்துதல் மற்றும் மோட்டார் சர்வீஸ்."}'::jsonb, true, 3),
    ('a0000000-0000-0000-0000-000000000004'::uuid, 'Appliance Repair', 'appliances', '🧺',
     '{"en": "Appliance Repair", "ta": "வீட்டு உபகரணங்கள் பழுதுபார்ப்பு", "hi": "उपकरण मरम्मत"}'::jsonb,
     '{"en": "Washing machine, refrigerator, microwave oven and water purifier service.", "ta": "வாஷிங் மெஷின், ஃப்ரிட்ஜ், மைக்ரோவேவ் மற்றும் ஆர்.ஓ பியூரிஃபையர் சர்வீஸ்."}'::jsonb, true, 4),
    ('a0000000-0000-0000-0000-000000000005'::uuid, 'House Painting & Polish', 'painting', '🎨',
     '{"en": "House Painting & Polish", "ta": "வீட்டு பெயிண்டிங் மற்றும் பாலிஷ்", "hi": "हाउस पेंटिंग और पॉलिश"}'::jsonb,
     '{"en": "Interior & exterior emulsion painting, wood polish and waterproofing.", "ta": "உள் மற்றும் வெளி சுவர் பெயிண்டிங், மர பாலிஷ் மற்றும் வாட்டர்ப்ரூஃபிங்."}'::jsonb, true, 5),
    ('a0000000-0000-0000-0000-000000000010'::uuid, 'Domestic Helpers', 'domestic', '🍲',
     '{"en": "Domestic Helpers", "ta": "வீட்டு உதவியாளர்கள்", "hi": "घरेलू सहायक"}'::jsonb,
     '{"en": "Cooking, household assistance, daily domestic support.", "ta": "சமையல், வீட்டு வேலைகள் மற்றும் தினசரி குடும்ப உதவி."}'::jsonb, true, 6),
    ('a0000000-0000-0000-0000-000000000011'::uuid, 'Caregiver Services', 'healthcare', '🩺',
     '{"en": "Caregiver Services", "ta": "பராமரிப்பாளர் சேவைகள்", "hi": "देखभालकर्ता सेवाएं"}'::jsonb,
     '{"en": "Elder care, patient assistance, home care and nursing support.", "ta": "முதியோர் பராமரிப்பு, நோயாளி உதவி மற்றும் செவிலியர் ஆதரவு."}'::jsonb, true, 7),
    ('a0000000-0000-0000-0000-000000000012'::uuid, 'Gardening & Landscaping', 'outdoor', '🌿',
     '{"en": "Gardening & Landscaping", "ta": "தோட்டக்கலை & இயற்கையமைப்பு", "hi": "बागवानी और लैंडस्केपिंग"}'::jsonb,
     '{"en": "Garden maintenance, plant care, pruning and landscaping.", "ta": "தோட்ட பராமரிப்பு, செடி வளர்ப்பு, கவாத்து மற்றும் வடிவமைப்பு."}'::jsonb, true, 8),
    ('a0000000-0000-0000-0000-000000000013'::uuid, 'Technician Services', 'technical', '🔧',
     '{"en": "Technician Services", "ta": "தொழில்நுட்ப வல்லுநர் சேவைகள்", "hi": "तकनीशियन सेवाएं"}'::jsonb,
     '{"en": "Appliance repair, CCTV, electronics and equipment maintenance.", "ta": "உபகரண பழுது, சிசிடிவி மற்றும் மின்னணு சாதன பராமரிப்பு."}'::jsonb, true, 9),
    ('a0000000-0000-0000-0000-000000000014'::uuid, 'Emergency Services', 'emergency', '🚨',
     '{"en": "Emergency Services", "ta": "அவசர சேவைகள்", "hi": "आपातकालीन सेवाएं"}'::jsonb,
     '{"en": "24/7 urgent household and repair assistance.", "ta": "24/7 அவசர வீட்டு பராமரிப்பு மற்றும் உடனடி பழுதுபார்ப்பு."}'::jsonb, true, 10),
    ('a0000000-0000-0000-0000-000000000015'::uuid, 'On-Demand Services', 'on-demand', '⚡',
     '{"en": "On-Demand Services", "ta": "தேவைக்கேற்ற உடனடி சேவைகள்", "hi": "ऑन-डिमांड सेवाएं"}'::jsonb,
     '{"en": "Instant booking for quick and immediate assistance.", "ta": "விரைவான மற்றும் உடனடி உதவிக்கான நேரடி முன்பதிவு."}'::jsonb, true, 11),
    ('a0000000-0000-0000-0000-000000000016'::uuid, 'Verified Cooperative Workers', 'cooperative', '🛡️',
     '{"en": "Verified Cooperative Workers", "ta": "சரிபார்க்கப்பட்ட கூட்டுறவு பணியாளர்கள்", "hi": "सत्यापित सहकारी कार्यकर्ता"}'::jsonb,
     '{"en": "Verified and skilled workers from cooperative societies.", "ta": "கூட்டுறவு சங்கங்களிலிருந்து சரிபார்க்கப்பட்ட திறமையான தொழிலாளர்கள்."}'::jsonb, true, 12),
    ('a0000000-0000-0000-0000-000000000017'::uuid, 'Training & Certification', 'training', '🎓',
     '{"en": "Training & Certification", "ta": "பயிற்சி மற்றும் சான்றிதழ்", "hi": "प्रशिक्षण और प्रमाणन"}'::jsonb,
     '{"en": "Worker skill development, training and certification.", "ta": "தொழிலாளர் திறன் மேம்பாடு, பயிற்சி மற்றும் சான்றிதழ்."}'::jsonb, true, 13),
    ('a0000000-0000-0000-0000-000000000007'::uuid, 'Professional Driver Services', 'transport', '🚗',
     '{"en": "Professional Driver Services", "ta": "தொழில்முறை ஓட்டுநர் சேவை", "hi": "पेशेवर ड्राइवर सेवा"}'::jsonb,
     '{"en": "Verified personal and commercial chauffeurs for local and outstation trips.", "ta": "உள்ளூர் மற்றும் வெளியூர் பயணங்களுக்கான சரிபார்க்கப்பட்ட ஓட்டுநர்கள்."}'::jsonb, true, 14)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    icon = EXCLUDED.icon,
    name_translations = EXCLUDED.name_translations,
    description_translations = EXCLUDED.description_translations,
    active = EXCLUDED.active,
    display_order = EXCLUDED.display_order;

-- ==============================================================================
-- 4. INSERT SUB-SERVICES FOR THE NEW CATEGORIES (VALID UUIDs)
-- ==============================================================================
INSERT INTO public.sub_services (id, service_id, name, base_price, active, display_order)
VALUES
    ('b0000000-0000-0000-0000-000000000004'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'Ceiling Fan & Switchboard Wiring', 350.00, true, 1),
    ('b0000000-0000-0000-0000-000000000005'::uuid, 'a0000000-0000-0000-0000-000000000002'::uuid, 'Pipe Leak Repair & Tap Fixing', 250.00, true, 1),
    ('b0000000-0000-0000-0000-000000000006'::uuid, 'a0000000-0000-0000-0000-000000000003'::uuid, 'Split AC Master Service & Jet Cleaning', 600.00, true, 1),
    ('b0000000-0000-0000-0000-000000000007'::uuid, 'a0000000-0000-0000-0000-000000000004'::uuid, 'Washing Machine Drum & Motor Service', 650.00, true, 1),
    ('b0000000-0000-0000-0000-000000000008'::uuid, 'a0000000-0000-0000-0000-000000000005'::uuid, 'Single Room Wall Painting & Primer', 2400.00, true, 1),
    ('b0000000-0000-0000-0000-000000000010'::uuid, 'a0000000-0000-0000-0000-000000000010'::uuid, 'Daily Cooking & Meal Preparation', 350.00, true, 1),
    ('b0000000-0000-0000-0000-000000000011'::uuid, 'a0000000-0000-0000-0000-000000000010'::uuid, 'Household Assistance & Maid Service', 500.00, true, 2),
    ('b0000000-0000-0000-0000-000000000020'::uuid, 'a0000000-0000-0000-0000-000000000011'::uuid, 'Elder Care & Daily Patient Assistance', 800.00, true, 1),
    ('b0000000-0000-0000-0000-000000000021'::uuid, 'a0000000-0000-0000-0000-000000000011'::uuid, 'Home Nursing & Medication Support', 1200.00, true, 2),
    ('b0000000-0000-0000-0000-000000000030'::uuid, 'a0000000-0000-0000-0000-000000000012'::uuid, 'Garden Maintenance & Lawn Mowing', 450.00, true, 1),
    ('b0000000-0000-0000-0000-000000000031'::uuid, 'a0000000-0000-0000-0000-000000000012'::uuid, 'Plant Care, Pruning & Landscaping', 650.00, true, 2),
    ('b0000000-0000-0000-0000-000000000040'::uuid, 'a0000000-0000-0000-0000-000000000013'::uuid, 'CCTV & Security Camera Setup', 850.00, true, 1),
    ('b0000000-0000-0000-0000-000000000041'::uuid, 'a0000000-0000-0000-0000-000000000013'::uuid, 'Electronics & Equipment Maintenance', 550.00, true, 2),
    ('b0000000-0000-0000-0000-000000000050'::uuid, 'a0000000-0000-0000-0000-000000000014'::uuid, '24/7 Urgent Plumbing & Pipe Burst Fix', 600.00, true, 1),
    ('b0000000-0000-0000-0000-000000000051'::uuid, 'a0000000-0000-0000-0000-000000000014'::uuid, '24/7 Emergency Electrical Short Circuit', 700.00, true, 2),
    ('b0000000-0000-0000-0000-000000000060'::uuid, 'a0000000-0000-0000-0000-000000000015'::uuid, 'Instant 30-Min Priority Dispatch', 400.00, true, 1),
    ('b0000000-0000-0000-0000-000000000070'::uuid, 'a0000000-0000-0000-0000-000000000016'::uuid, 'Verified Skilled Cooperative Technician', 500.00, true, 1),
    ('b0000000-0000-0000-0000-000000000080'::uuid, 'a0000000-0000-0000-0000-000000000017'::uuid, 'Worker Skill Assessment & Certification', 0.00, true, 1),
    ('b0000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000007'::uuid, 'Personal City Chauffeur (Local Trip)', 450.00, true, 1),
    ('b0000000-0000-0000-0000-000000000002'::uuid, 'a0000000-0000-0000-0000-000000000007'::uuid, 'Outstation / Full-Day Driver', 1200.00, true, 2)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    base_price = EXCLUDED.base_price,
    active = EXCLUDED.active;

-- ==============================================================================
-- 5. SERVICE REQUESTS & BILLING RECEIPT ENHANCEMENTS
-- ==============================================================================
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

-- ==============================================================================
-- 6. NOTIFICATIONS TABLE (HERO AI & REALTIME VOICE SPEECH)
-- ==============================================================================
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

-- ==============================================================================
-- 7. ENABLE SUPABASE REALTIME REPLICATION
-- ==============================================================================
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

-- ==============================================================================
-- 8. OPEN ROW LEVEL SECURITY (RLS) FOR SMOOTH OPERATION
-- ==============================================================================
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read services" ON public.services;
CREATE POLICY "Public read services" ON public.services FOR SELECT USING (true);

ALTER TABLE public.sub_services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read sub_services" ON public.sub_services;
CREATE POLICY "Public read sub_services" ON public.sub_services FOR SELECT USING (true);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable full access to notifications" ON public.notifications;
CREATE POLICY "Enable full access to notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- SUCCESS CONFIRMATION
-- ==============================================================================
SELECT 'COOP HUB SUPABASE ENHANCEMENTS COMPLETED SUCCESSFULLY!' as result;
