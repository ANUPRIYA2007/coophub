-- ============================================================
-- COOP HUB Migration 13: Pillar Skill Certificates & Verification Fields
-- ============================================================

-- 1. Ensure all Certificate and Verification columns exist on pillar_profiles
DO $$
BEGIN
    -- Application ID
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pillar_profiles' AND column_name = 'application_id') THEN
        ALTER TABLE public.pillar_profiles ADD COLUMN application_id TEXT;
        CREATE INDEX IF NOT EXISTS idx_pillar_profiles_app_id ON public.pillar_profiles(application_id);
    END IF;

    -- Certificate Columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pillar_profiles' AND column_name = 'certificate_type') THEN
        ALTER TABLE public.pillar_profiles ADD COLUMN certificate_type TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pillar_profiles' AND column_name = 'certificate_number') THEN
        ALTER TABLE public.pillar_profiles ADD COLUMN certificate_number TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pillar_profiles' AND column_name = 'certificate_url') THEN
        ALTER TABLE public.pillar_profiles ADD COLUMN certificate_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pillar_profiles' AND column_name = 'certificate_ocr_data') THEN
        ALTER TABLE public.pillar_profiles ADD COLUMN certificate_ocr_data JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pillar_profiles' AND column_name = 'certificate_issuer') THEN
        ALTER TABLE public.pillar_profiles ADD COLUMN certificate_issuer TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pillar_profiles' AND column_name = 'certificate_trade') THEN
        ALTER TABLE public.pillar_profiles ADD COLUMN certificate_trade TEXT;
    END IF;

    -- Rejection Reason & Detailed Explanation
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pillar_profiles' AND column_name = 'rejection_reason') THEN
        ALTER TABLE public.pillar_profiles ADD COLUMN rejection_reason TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pillar_profiles' AND column_name = 'rejection_explanation') THEN
        ALTER TABLE public.pillar_profiles ADD COLUMN rejection_explanation TEXT;
    END IF;

    -- Location sharing consent
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pillar_profiles' AND column_name = 'location_sharing_enabled') THEN
        ALTER TABLE public.pillar_profiles ADD COLUMN location_sharing_enabled BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 2. Update status constraint on pillar_profiles
ALTER TABLE public.pillar_profiles DROP CONSTRAINT IF EXISTS pillar_profiles_status_check;

ALTER TABLE public.pillar_profiles 
ADD CONSTRAINT pillar_profiles_status_check 
CHECK (status IN (
    'pending',
    'pending_review',
    'pending_verification',
    'under_review',
    'approved',
    'verified',
    'rejected',
    'suspended'
));

-- 3. Ensure kyc_documents table exists
CREATE TABLE IF NOT EXISTS public.kyc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pillar_id UUID REFERENCES public.pillar_profiles(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    document_number TEXT,
    verification_status TEXT DEFAULT 'pending_inspection',
    document_url TEXT,
    ocr_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS and public policies for kyc_documents
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'kyc_documents' AND policyname = 'Allow public read and write on kyc_documents'
    ) THEN
        CREATE POLICY "Allow public read and write on kyc_documents" 
        ON public.kyc_documents FOR ALL 
        USING (true) 
        WITH CHECK (true);
    END IF;
END $$;
