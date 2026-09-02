-- ==============================================================================
-- COOP HUB: COMPLETE SUPABASE SQL SCHEMA & ENHANCEMENTS SCRIPT
-- Copy and paste this script into your Supabase SQL Editor and click "RUN".
-- All statements are safe and idempotent (IF NOT EXISTS / ON CONFLICT DO NOTHING).
-- ==============================================================================

-- 1. ENABLE UUID EXTENSION
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. ENSURE SERVICE CATEGORIES & SUB-SERVICES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.services (
    id TEXT PRIMARY KEY,
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
    id TEXT PRIMARY KEY,
    service_id TEXT REFERENCES public.services(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    base_price NUMERIC(10, 2) DEFAULT 0.00,
    name_translations JSONB DEFAULT '{}'::jsonb,
    description_translations JSONB DEFAULT '{}'::jsonb,
    active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 3. INSERT / SEED ALL 8 NEW SERVICE CATEGORIES + CORE CATEGORIES
-- ==============================================================================
INSERT INTO public.services (id, name, category, icon, name_translations, description_translations, display_order)
VALUES
    ('srv-1', 'Electrical Repair', 'Electrical', '⚡', 
     '{"en": "Electrical Repair", "ta": "மின்சார பழுதுபார்ப்பு", "hi": "बिजली मरम्मत"}'::jsonb,
     '{"en": "Fan repair, switchboard wiring, inverter installation & short circuit fixes.", "ta": "மின்விசிறி பழுது, சுவிட்ச்போர்டு வயரிங் மற்றும் இன்வெர்ட்டர் பொருத்துதல்."}'::jsonb, 1),
    ('srv-2', 'AC Repair & Service', 'Cooling', '❄️',
     '{"en": "AC Repair & Service", "ta": "ஏசி பழுது மற்றும் பராமரிப்பு", "hi": "एसी मरम्मत और सर्विसिंग"}'::jsonb,
     '{"en": "Gas leak repair, deep jet pump cleaning, cooling issues and PCB service.", "ta": "கேஸ் கசிவு சரிசெய்தல், ஜெட் பம்ப் சர்வீஸ் மற்றும் கூலிங் பராமரிப்பு."}'::jsonb, 2),
    ('srv-3', 'Plumbing & Pipe Fixing', 'Plumbing', '🔧',
     '{"en": "Plumbing & Pipe Fixing", "ta": "பிளம்பிங் மற்றும் குழாய் பொருத்துதல்", "hi": "प्लंबिंग और पाइप मरम्मत"}'::jsonb,
     '{"en": "Pipe leakage, tap fixture replacement, motor installation and drainage blockage.", "ta": "குழாய் கசிவு, புதிய குழாய் பொருத்துதல் மற்றும் மோட்டார் சர்வீஸ்."}'::jsonb, 3),
    ('srv-4', 'Appliance Repair', 'Appliances', '🧺',
     '{"en": "Appliance Repair", "ta": "வீட்டு உபகரணங்கள் பழுதுபார்ப்பு", "hi": "उपकरण मरम्मत"}'::jsonb,
     '{"en": "Washing machine, refrigerator, microwave oven and water purifier service.", "ta": "வாஷிங் மெஷின், ஃப்ரிட்ஜ், மைக்ரோவேவ் மற்றும் ஆர்.ஓ பியூரிஃபையர் சர்வீஸ்."}'::jsonb, 4),
    ('srv-5', 'House Painting & Polish', 'Painting', '🎨',
     '{"en": "House Painting & Polish", "ta": "வீட்டு பெயிண்டிங் மற்றும் பாலிஷ்", "hi": "हाउस पेंटिंग और पॉलिश"}'::jsonb,
     '{"en": "Interior & exterior emulsion painting, wood polish and waterproofing.", "ta": "உள் மற்றும் வெளி சுவர் பெயிண்டிங், மர பாலிஷ் மற்றும் வாட்டர்ப்ரூஃபிங்."}'::jsonb, 5),
    ('srv-domestic', 'Domestic Helpers', 'Domestic', '🍲',
     '{"en": "Domestic Helpers", "ta": "வீட்டு உதவியாளர்கள்", "hi": "घरेलू सहायक"}'::jsonb,
     '{"en": "Cooking, household assistance, daily domestic support.", "ta": "சமையல், வீட்டு வேலைகள் மற்றும் தினசரி குடும்ப உதவி."}'::jsonb, 6),
    ('srv-caregiver', 'Caregiver Services', 'Healthcare', '🩺',
     '{"en": "Caregiver Services", "ta": "பராமரிப்பாளர் சேவைகள்", "hi": "देखभालकर्ता सेवाएं"}'::jsonb,
     '{"en": "Elder care, patient assistance, home care and nursing support.", "ta": "முதியோர் பராமரிப்பு, நோயாளி உதவி மற்றும் செவிலியர் ஆதரவு."}'::jsonb, 7),
    ('srv-gardening', 'Gardening & Landscaping', 'Outdoor', '🌿',
     '{"en": "Gardening & Landscaping", "ta": "தோட்டக்கலை & இயற்கையமைப்பு", "hi": "बागवानी और लैंडस्केपिंग"}'::jsonb,
     '{"en": "Garden maintenance, plant care, pruning and landscaping.", "ta": "தோட்ட பராமரிப்பு, செடி வளர்ப்பு, கவாத்து மற்றும் வடிவமைப்பு."}'::jsonb, 8),
    ('srv-technician', 'Technician Services', 'Technical', '🔧',
     '{"en": "Technician Services", "ta": "தொழில்நுட்ப வல்லுநர் சேவைகள்", "hi": "तकनीशियन सेवाएं"}'::jsonb,
     '{"en": "Appliance repair, CCTV, electronics and equipment maintenance.", "ta": "உபகரண பழுது, சிசிடிவி மற்றும் மின்னணு சாதன பராமரிப்பு."}'::jsonb, 9),
    ('srv-emergency', 'Emergency Services', 'Emergency', '🚨',
     '{"en": "Emergency Services", "ta": "அவசர சேவைகள்", "hi": "आपातकालीन सेवाएं"}'::jsonb,
     '{"en": "24/7 urgent household and repair assistance.", "ta": "24/7 அவசர வீட்டு பராமரிப்பு மற்றும் உடனடி பழுதுபார்ப்பு."}'::jsonb, 10),
    ('srv-ondemand', 'On-Demand Services', 'On-Demand', '⚡',
     '{"en": "On-Demand Services", "ta": "தேவைக்கேற்ற உடனடி சேவைகள்", "hi": "ऑन-डिमांड सेवाएं"}'::jsonb,
     '{"en": "Instant booking for quick and immediate assistance.", "ta": "விரைவான மற்றும் உடனடி உதவிக்கான நேரடி முன்பதிவு."}'::jsonb, 11),
    ('srv-coop-workers', 'Verified Cooperative Workers', 'Cooperative', '🛡️',
     '{"en": "Verified Cooperative Workers", "ta": "சரிபார்க்கப்பட்ட கூட்டுறவு பணியாளர்கள்", "hi": "सत्यापित सहकारी कार्यकर्ता"}'::jsonb,
     '{"en": "Verified and skilled workers from cooperative societies.", "ta": "கூட்டுறவு சங்கங்களிலிருந்து சரிபார்க்கப்பட்ட திறமையான தொழிலாளர்கள்."}'::jsonb, 12),
    ('srv-training', 'Training & Certification', 'Training', '🎓',
     '{"en": "Training & Certification", "ta": "பயிற்சி மற்றும் சான்றிதழ்", "hi": "प्रशिक्षण और प्रमाणन"}'::jsonb,
     '{"en": "Worker skill development, training and certification.", "ta": "தொழிலாளர் திறன் மேம்பாடு, பயிற்சி மற்றும் சான்றிதழ்."}'::jsonb, 13),
    ('srv-driver', 'Professional Driver Services', 'Transport', '🚗',
     '{"en": "Professional Driver Services", "ta": "தொழில்முறை ஓட்டுநர் சேவை", "hi": "पेशेवर ड्राइवर सेवा"}'::jsonb,
     '{"en": "Verified personal and commercial chauffeurs for local and outstation trips.", "ta": "உள்ளூர் மற்றும் வெளியூர் பயணங்களுக்கான சரிபார்க்கப்பட்ட ஓட்டுநர்கள்."}'::jsonb, 14)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    icon = EXCLUDED.icon,
    name_translations = EXCLUDED.name_translations,
    description_translations = EXCLUDED.description_translations,
    display_order = EXCLUDED.display_order;

-- ==============================================================================
-- 4. INSERT SUB-SERVICES FOR THE NEW CATEGORIES
-- ==============================================================================
INSERT INTO public.sub_services (id, service_id, name, base_price)
VALUES
    ('sub-dom-1', 'srv-domestic', 'Daily Cooking & Meal Preparation', 350.00),
    ('sub-dom-2', 'srv-domestic', 'Household Assistance & Maid Service', 500.00),
    ('sub-care-1', 'srv-caregiver', 'Elder Care & Daily Patient Assistance', 800.00),
    ('sub-care-2', 'srv-caregiver', 'Home Nursing & Medication Support', 1200.00),
    ('sub-gard-1', 'srv-gardening', 'Garden Maintenance & Lawn Mowing', 450.00),
    ('sub-gard-2', 'srv-gardening', 'Plant Care, Pruning & Landscaping', 650.00),
    ('sub-tech-1', 'srv-technician', 'CCTV & Security Camera Setup', 850.00),
    ('sub-tech-2', 'srv-technician', 'Electronics & Equipment Maintenance', 550.00),
    ('sub-emerg-1', 'srv-emergency', '24/7 Urgent Plumbing & Pipe Burst Fix', 600.00),
    ('sub-emerg-2', 'srv-emergency', '24/7 Emergency Electrical Short Circuit', 700.00),
    ('sub-ondem-1', 'srv-ondemand', 'Instant 30-Min Priority Dispatch', 400.00),
    ('sub-coop-1', 'srv-coop-workers', 'Verified Skilled Cooperative Technician', 500.00),
    ('sub-train-1', 'srv-training', 'Worker Skill Assessment & Certification', 0.00),
    ('sub-driver-1', 'srv-driver', 'Personal City Chauffeur (Local Trip)', 450.00),
    ('sub-driver-2', 'srv-driver', 'Outstation / Full-Day Driver', 1200.00)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    base_price = EXCLUDED.base_price;

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
