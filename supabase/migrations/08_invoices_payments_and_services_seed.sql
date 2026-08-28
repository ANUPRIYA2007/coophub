-- ==============================================================================
-- COOP HUB MIGRATION 08: INVOICES, PAYMENTS, LOCATION CONSENT & DRIVER SERVICES SEED
-- ==============================================================================

-- 1. Ensure columns exist on pillar_profiles
ALTER TABLE public.pillar_profiles 
ADD COLUMN IF NOT EXISTS location_sharing_enabled BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.pillar_profiles 
ADD COLUMN IF NOT EXISTS custom_role TEXT;

ALTER TABLE public.pillar_profiles 
ADD COLUMN IF NOT EXISTS area TEXT;

ALTER TABLE public.pillar_profiles 
ADD COLUMN IF NOT EXISTS pincode TEXT;

-- 2. Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.service_requests(id) ON DELETE CASCADE,
    booking_id UUID,
    invoice_number TEXT UNIQUE NOT NULL,
    customer_id UUID,
    pillar_id UUID,
    base_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    extra_charges NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    currency TEXT DEFAULT 'INR',
    invoice_status TEXT CHECK (invoice_status IN ('pending', 'paid', 'refunded', 'cancelled')) DEFAULT 'pending',
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.service_requests(id) ON DELETE CASCADE,
    booking_id UUID,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
    customer_id UUID,
    pillar_id UUID,
    amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    payment_method TEXT DEFAULT 'upi',
    transaction_ref TEXT,
    gateway_order_id TEXT,
    gateway_payment_id TEXT,
    payment_status TEXT CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded')) DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS and Policies for Invoices & Payments
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Allow authenticated users to read own invoices') THEN
        CREATE POLICY "Allow authenticated users to read own invoices"
        ON public.invoices FOR SELECT
        TO authenticated
        USING (auth.uid() = customer_id OR auth.uid() = pillar_id OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Allow insert for authenticated users and system') THEN
        CREATE POLICY "Allow insert for authenticated users and system"
        ON public.invoices FOR ALL
        TO authenticated
        USING (true)
        WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Allow authenticated users to read own payments') THEN
        CREATE POLICY "Allow authenticated users to read own payments"
        ON public.payments FOR SELECT
        TO authenticated
        USING (auth.uid() = customer_id OR auth.uid() = pillar_id OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Allow insert for authenticated payments') THEN
        CREATE POLICY "Allow insert for authenticated payments"
        ON public.payments FOR ALL
        TO authenticated
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;

-- 5. Ensure convenience columns exist on services and sub_services
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.sub_services ADD COLUMN IF NOT EXISTS name TEXT;

-- 6. Seed Services (Using Valid UUIDs)
INSERT INTO public.services (id, name, category, icon, name_translations, description_translations, active, display_order)
VALUES
    ('a0000000-0000-0000-0000-000000000007'::uuid, 'Professional Driver Services', 'transport', 'car', 
     '{"en": "Professional Driver Services", "ta": "தொழில்முறை ஓட்டுநர் சேவை", "hi": "पेशेवर ड्राइवर सेवा", "te": "డ్రైవర్ సేవలు", "kn": "ಡ್ರೈವರ್ ಸೇವೆಗಳು"}'::jsonb,
     '{"en": "Verified personal and commercial chauffeurs for local and outstation trips", "ta": "உள்ளூர் மற்றும் வெளியூர் பயணங்களுக்கான சரிபார்க்கப்பட்ட ஓட்டுநர்கள்"}'::jsonb,
     true, 7),
    ('a0000000-0000-0000-0000-000000000001'::uuid, 'Electrical Repair', 'electrical', 'zap', 
     '{"en": "Electrical Repair", "ta": "மின்சார பழுதுபார்ப்பு", "hi": "बिजली मरम्मत", "te": "విద్యుత్ మరమ్మత్తు", "kn": "ವಿದ್ಯುತ್ ದುರಸ್ತಿ"}'::jsonb,
     '{"en": "Home & industrial electrical repair, wiring, and DB box servicing", "ta": "வீட்டு மற்றும் தொழில்துறை மின்சார பழுதுபார்ப்பு"}'::jsonb,
     true, 1),
    ('a0000000-0000-0000-0000-000000000002'::uuid, 'Plumbing Service', 'plumbing', 'droplet', 
     '{"en": "Plumbing Service", "ta": "குழாய் பழுதுபார்ப்பு", "hi": "नलसाजी सेवा", "te": "ప్లంబింగ్ సేవ", "kn": "ಪ್ಲಂಬಿಂಗ್ ಸೇವೆ"}'::jsonb,
     '{"en": "Piping, sanitary fitting, leak inspection, and tank cleaning", "ta": "குழாய் பழுதுபார்ப்பு மற்றும் கசிவு சரிபார்த்தல்"}'::jsonb,
     true, 2),
    ('a0000000-0000-0000-0000-000000000003'::uuid, 'AC Repair & HVAC', 'appliance', 'wind', 
     '{"en": "AC Repair & HVAC", "ta": "ஏசி பழுதுபார்ப்பு", "hi": "एसी मरम्मत", "te": "ఏసీ మరమ్మత్తు", "kn": "ಎಸಿ ದುರಸ್ತಿ"}'::jsonb,
     '{"en": "Split and window AC servicing, gas filling, and deep cooling maintenance", "ta": "ஏசி பழுது மற்றும் பராமரிப்பு"}'::jsonb,
     true, 3),
    ('a0000000-0000-0000-0000-000000000004'::uuid, 'Carpentry & Woodwork', 'carpentry', 'hammer', 
     '{"en": "Carpentry & Woodwork", "ta": "மரவேலை சேவை", "hi": "बढ़ईगीरी सेवा", "te": "వడ్రంగి సేవ", "kn": "ಬಡಗಿ ಸೇವೆ"}'::jsonb,
     '{"en": "Furniture repair, modular woodwork, door locks, and custom fittings", "ta": "மரச்சாமான்கள் பழுதுபார்ப்பு மற்றும் பொருத்துதல்"}'::jsonb,
     true, 4),
    ('a0000000-0000-0000-0000-000000000005'::uuid, 'Painting & Waterproofing', 'painting', 'paint-brush', 
     '{"en": "Painting & Waterproofing", "ta": "வர்ணம் பூசுதல்", "hi": "पेंटिंग सेवा", "te": "పెయింటింగ్ సేవ", "kn": "ಪೇಂಟಿಂಗ್ ಸೇವೆ"}'::jsonb,
     '{"en": "Interior and exterior wall painting, damp proofing, and texture work", "ta": "உள் மற்றும் வெளிப்புற வர்ணம் பூசுதல்"}'::jsonb,
     true, 5),
    ('a0000000-0000-0000-0000-000000000006'::uuid, 'Deep Home Cleaning', 'cleaning', 'sparkles', 
     '{"en": "Deep Home Cleaning", "ta": "ஆழ்ந்த தூய்மைப்பணி", "hi": "गहरी सफाई", "te": "డీప్ క్లీనింగ్", "kn": "ಆಳವಾದ ಸ್ವಚ್ಛತೆ"}'::jsonb,
     '{"en": "Kitchen, bathroom, sofa deep cleaning, and sanitization", "ta": "முழுமையான வீட்டு மற்றும் சமையலறை சுத்தம்"}'::jsonb,
     true, 6),
    ('a0000000-0000-0000-0000-000000000008'::uuid, 'Specialized & Custom Trades', 'general', 'tool', 
     '{"en": "Specialized & Custom Trades", "ta": "சிறப்புத் தொழில்கள்", "hi": "विशेषज्ञ सेवाएं", "te": "ప్రత్యేక సేవలు", "kn": "ವಿಶೇಷ ಸೇವೆಗಳು"}'::jsonb,
     '{"en": "CCTV installation, welding, masonry, and custom artisan trades", "ta": "சிசிடிவி பொருத்துதல், வெல்டிங் மற்றும் இதர பணிகள்"}'::jsonb,
     true, 8)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    icon = EXCLUDED.icon,
    name_translations = EXCLUDED.name_translations,
    description_translations = EXCLUDED.description_translations,
    active = EXCLUDED.active,
    display_order = EXCLUDED.display_order;

-- 7. Seed Sub-Services (Using Valid UUIDs)
INSERT INTO public.sub_services (id, service_id, name, base_price, name_translations, description_translations, active, display_order)
VALUES
    ('b0000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000007'::uuid, 'Personal City Chauffeur (Per Trip)', 450.00,
     '{"en": "Personal City Chauffeur (Per Trip)", "ta": "நகர ஓட்டுநர் (பயணம் ஒன்றுக்கு)"}'::jsonb,
     '{"en": "Experienced chauffeur for local intra-city travel and errands (up to 4 hours)"}'::jsonb,
     true, 1),
    ('b0000000-0000-0000-0000-000000000002'::uuid, 'a0000000-0000-0000-0000-000000000007'::uuid, 'Outstation / Full-Day Driver', 1200.00,
     '{"en": "Outstation / Full-Day Driver", "ta": "வெளியூர் / முழு நாள் ஓட்டுநர்"}'::jsonb,
     '{"en": "Professional licensed driver for highway and inter-city round trips (up to 10 hours)"}'::jsonb,
     true, 2),
    ('b0000000-0000-0000-0000-000000000003'::uuid, 'a0000000-0000-0000-0000-000000000007'::uuid, 'Commercial / Valet Transport', 800.00,
     '{"en": "Commercial / Valet Transport", "ta": "வணிக ஓட்டுநர்"}'::jsonb,
     '{"en": "Commercial vehicle transport and emergency event valet driving"}'::jsonb,
     true, 3),
    ('b0000000-0000-0000-0000-000000000004'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'Ceiling Fan & Switchboard Wiring', 250.00,
     '{"en": "Ceiling Fan & Switchboard Wiring", "ta": "மின்விசிறி மற்றும் வயரிங்"}'::jsonb,
     '{"en": "Complete wiring diagnostics and switch replacement"}'::jsonb,
     true, 1),
    ('b0000000-0000-0000-0000-000000000005'::uuid, 'a0000000-0000-0000-0000-000000000002'::uuid, 'Pipe Leak Repair & Tap Fixing', 300.00,
     '{"en": "Pipe Leak Repair & Tap Fixing", "ta": "குழாய் கசிவு பழுதுபார்ப்பு"}'::jsonb,
     '{"en": "Drain unblocking, sanitary repairs, and tap fitting"}'::jsonb,
     true, 1),
    ('b0000000-0000-0000-0000-000000000006'::uuid, 'a0000000-0000-0000-0000-000000000003'::uuid, 'Split AC Master Service & Filter Deep Clean', 550.00,
     '{"en": "Split AC Master Service & Filter Deep Clean", "ta": "ஏசி சர்வீஸ்"}'::jsonb,
     '{"en": "Coil wash, filter sanitization, and cooling test"}'::jsonb,
     true, 1),
    ('b0000000-0000-0000-0000-000000000007'::uuid, 'a0000000-0000-0000-0000-000000000008'::uuid, 'CCTV & Smart Security Setup', 850.00,
     '{"en": "CCTV & Smart Security Setup", "ta": "சிசிடிவி நிறுவுதல்"}'::jsonb,
     '{"en": "Camera mounting, DVR configuration, and remote app setup"}'::jsonb,
     true, 1)
ON CONFLICT (id) DO UPDATE SET
    service_id = EXCLUDED.service_id,
    name = EXCLUDED.name,
    base_price = EXCLUDED.base_price,
    name_translations = EXCLUDED.name_translations,
    description_translations = EXCLUDED.description_translations,
    active = EXCLUDED.active,
    display_order = EXCLUDED.display_order;

-- 8. Add Realtime publications
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
