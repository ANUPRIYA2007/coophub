-- ============================================================
-- COOP HUB Migration 16: Dedicated Document Tables Schema
-- ============================================================
-- Creates 4 separate tables for all KYC document types:
-- 1. pillar_aadhaar_documents
-- 2. pillar_pan_documents
-- 3. pillar_voter_id_documents
-- 4. pillar_driving_license_documents
-- ============================================================

-- 1. AADHAAR DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.pillar_aadhaar_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pillar_id UUID NOT NULL REFERENCES public.pillar_profiles(id) ON DELETE CASCADE,
    aadhaar_number TEXT,
    full_name TEXT,
    date_of_birth DATE,
    gender TEXT,
    address TEXT,
    care_of TEXT,
    village_town_city TEXT,
    district TEXT,
    state TEXT,
    pincode TEXT,
    issue_date DATE,
    document_image_url TEXT,
    document_file_url TEXT,
    ocr_raw_text TEXT,
    extracted_data JSONB DEFAULT '{}'::jsonb,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'under_review', 'verified', 'rejected', 'expired')),
    verification_score NUMERIC(5,2) DEFAULT 0.0,
    validation_errors JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_pillar_aadhaar UNIQUE (pillar_id)
);

CREATE INDEX IF NOT EXISTS idx_pillar_aadhaar_pillar_id ON public.pillar_aadhaar_documents(pillar_id);
CREATE INDEX IF NOT EXISTS idx_pillar_aadhaar_number ON public.pillar_aadhaar_documents(aadhaar_number);
CREATE INDEX IF NOT EXISTS idx_pillar_aadhaar_status ON public.pillar_aadhaar_documents(verification_status);

-- 2. PAN DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.pillar_pan_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pillar_id UUID NOT NULL REFERENCES public.pillar_profiles(id) ON DELETE CASCADE,
    pan_number TEXT,
    full_name TEXT,
    father_name TEXT,
    date_of_birth DATE,
    signature_detected BOOLEAN DEFAULT false,
    photograph_detected BOOLEAN DEFAULT false,
    document_image_url TEXT,
    document_file_url TEXT,
    ocr_raw_text TEXT,
    extracted_data JSONB DEFAULT '{}'::jsonb,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'under_review', 'verified', 'rejected', 'expired')),
    verification_score NUMERIC(5,2) DEFAULT 0.0,
    validation_errors JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_pillar_pan UNIQUE (pillar_id)
);

CREATE INDEX IF NOT EXISTS idx_pillar_pan_pillar_id ON public.pillar_pan_documents(pillar_id);
CREATE INDEX IF NOT EXISTS idx_pillar_pan_number ON public.pillar_pan_documents(pan_number);
CREATE INDEX IF NOT EXISTS idx_pillar_pan_status ON public.pillar_pan_documents(verification_status);

-- 3. VOTER ID DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.pillar_voter_id_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pillar_id UUID NOT NULL REFERENCES public.pillar_profiles(id) ON DELETE CASCADE,
    voter_id_number TEXT,
    full_name TEXT,
    guardian_name TEXT,
    date_of_birth DATE,
    age INTEGER,
    gender TEXT,
    address TEXT,
    village_town_city TEXT,
    district TEXT,
    state TEXT,
    pincode TEXT,
    polling_station TEXT,
    constituency TEXT,
    document_image_url TEXT,
    document_file_url TEXT,
    ocr_raw_text TEXT,
    extracted_data JSONB DEFAULT '{}'::jsonb,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'under_review', 'verified', 'rejected', 'expired')),
    verification_score NUMERIC(5,2) DEFAULT 0.0,
    validation_errors JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_pillar_voter_id UNIQUE (pillar_id)
);

CREATE INDEX IF NOT EXISTS idx_pillar_voter_id_pillar_id ON public.pillar_voter_id_documents(pillar_id);
CREATE INDEX IF NOT EXISTS idx_pillar_voter_id_number ON public.pillar_voter_id_documents(voter_id_number);
CREATE INDEX IF NOT EXISTS idx_pillar_voter_id_status ON public.pillar_voter_id_documents(verification_status);

-- 4. DRIVING LICENCE DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.pillar_driving_license_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pillar_id UUID NOT NULL REFERENCES public.pillar_profiles(id) ON DELETE CASCADE,
    driving_license_number TEXT,
    full_name TEXT,
    date_of_birth DATE,
    guardian_name TEXT,
    address TEXT,
    blood_group TEXT,
    issue_date DATE,
    expiry_date DATE,
    issuing_authority TEXT,
    transport_authority TEXT,
    vehicle_classes TEXT[],
    validity_status TEXT,
    document_image_url TEXT,
    document_file_url TEXT,
    ocr_raw_text TEXT,
    extracted_data JSONB DEFAULT '{}'::jsonb,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'under_review', 'verified', 'rejected', 'expired')),
    verification_score NUMERIC(5,2) DEFAULT 0.0,
    validation_errors JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_pillar_driving_license UNIQUE (pillar_id)
);

CREATE INDEX IF NOT EXISTS idx_pillar_dl_pillar_id ON public.pillar_driving_license_documents(pillar_id);
CREATE INDEX IF NOT EXISTS idx_pillar_dl_number ON public.pillar_driving_license_documents(driving_license_number);
CREATE INDEX IF NOT EXISTS idx_pillar_dl_status ON public.pillar_driving_license_documents(verification_status);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.pillar_aadhaar_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pillar_pan_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pillar_voter_id_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pillar_driving_license_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pillars and Admins access aadhaar documents" ON public.pillar_aadhaar_documents;
CREATE POLICY "Pillars and Admins access aadhaar documents"
ON public.pillar_aadhaar_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Pillars and Admins access pan documents" ON public.pillar_pan_documents;
CREATE POLICY "Pillars and Admins access pan documents"
ON public.pillar_pan_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Pillars and Admins access voter id documents" ON public.pillar_voter_id_documents;
CREATE POLICY "Pillars and Admins access voter id documents"
ON public.pillar_voter_id_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Pillars and Admins access driving license documents" ON public.pillar_driving_license_documents;
CREATE POLICY "Pillars and Admins access driving license documents"
ON public.pillar_driving_license_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. DATA MIGRATION FROM EXISTING KYC DOCUMENTS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'kyc_documents') THEN
        -- Aadhaar Migration
        INSERT INTO public.pillar_aadhaar_documents (
            pillar_id, document_image_url, verification_status, created_at, updated_at
        )
        SELECT 
            pillar_id, document_url, COALESCE(verification_status, 'pending'), COALESCE(uploaded_at, now()), now()
        FROM public.kyc_documents
        WHERE LOWER(document_type) LIKE '%aadhaar%'
        ON CONFLICT (pillar_id) DO NOTHING;

        -- PAN Migration
        INSERT INTO public.pillar_pan_documents (
            pillar_id, document_image_url, verification_status, created_at, updated_at
        )
        SELECT 
            pillar_id, document_url, COALESCE(verification_status, 'pending'), COALESCE(uploaded_at, now()), now()
        FROM public.kyc_documents
        WHERE LOWER(document_type) LIKE '%pan%'
        ON CONFLICT (pillar_id) DO NOTHING;

        -- Voter ID Migration
        INSERT INTO public.pillar_voter_id_documents (
            pillar_id, document_image_url, verification_status, created_at, updated_at
        )
        SELECT 
            pillar_id, document_url, COALESCE(verification_status, 'pending'), COALESCE(uploaded_at, now()), now()
        FROM public.kyc_documents
        WHERE LOWER(document_type) LIKE '%voter%' OR LOWER(document_type) LIKE '%epic%'
        ON CONFLICT (pillar_id) DO NOTHING;

        -- Driving Licence Migration
        INSERT INTO public.pillar_driving_license_documents (
            pillar_id, document_image_url, verification_status, created_at, updated_at
        )
        SELECT 
            pillar_id, document_url, COALESCE(verification_status, 'pending'), COALESCE(uploaded_at, now()), now()
        FROM public.kyc_documents
        WHERE LOWER(document_type) LIKE '%driving%' OR LOWER(document_type) LIKE '%licen%'
        ON CONFLICT (pillar_id) DO NOTHING;
    END IF;
END $$;
