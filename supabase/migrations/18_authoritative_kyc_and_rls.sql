-- ==============================================================================
-- Migration 18: Authoritative Government ID Verification Architecture & Strict RLS
-- ==============================================================================

-- 1. Ensure verification metadata columns in pillar_profiles
ALTER TABLE IF EXISTS public.pillar_profiles
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending_verification',
ADD COLUMN IF NOT EXISTS verification_method TEXT DEFAULT 'ocr_ai',
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verified_by TEXT,
ADD COLUMN IF NOT EXISTS authoritative_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS failure_reason TEXT,
ADD COLUMN IF NOT EXISTS verification_metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Ensure verification metadata columns in kyc_documents
ALTER TABLE IF EXISTS public.kyc_documents
ADD COLUMN IF NOT EXISTS verification_method TEXT DEFAULT 'ocr_ai',
ADD COLUMN IF NOT EXISTS authoritative_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS raw_ocr_text TEXT,
ADD COLUMN IF NOT EXISTS extracted_fields JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS failure_reason TEXT;

-- 3. Strict Row Level Security (RLS) on Dedicated KYC Document Tables
-- Core Mandate:
-- - Pillars can ONLY access/insert their own documents
-- - Admins have full review access
-- - Customers and anonymous users have ZERO access

-- A. pillar_aadhaar_documents
ALTER TABLE IF EXISTS public.pillar_aadhaar_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Pillars access own aadhaar documents" ON public.pillar_aadhaar_documents;
DROP POLICY IF EXISTS "Pillars and Admins access aadhaar documents" ON public.pillar_aadhaar_documents;
DROP POLICY IF EXISTS "Allow all on pillar_aadhaar_documents" ON public.pillar_aadhaar_documents;

CREATE POLICY "Pillars access own aadhaar documents"
ON public.pillar_aadhaar_documents
FOR ALL
TO authenticated
USING (
  pillar_id = auth.uid() 
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  pillar_id = auth.uid() 
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- B. pillar_pan_documents
ALTER TABLE IF EXISTS public.pillar_pan_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Pillars access own pan documents" ON public.pillar_pan_documents;
DROP POLICY IF EXISTS "Pillars and Admins access pan documents" ON public.pillar_pan_documents;

CREATE POLICY "Pillars access own pan documents"
ON public.pillar_pan_documents
FOR ALL
TO authenticated
USING (
  pillar_id = auth.uid() 
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  pillar_id = auth.uid() 
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- C. pillar_voter_id_documents
ALTER TABLE IF EXISTS public.pillar_voter_id_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Pillars access own voter id documents" ON public.pillar_voter_id_documents;
DROP POLICY IF EXISTS "Pillars and Admins access voter id documents" ON public.pillar_voter_id_documents;

CREATE POLICY "Pillars access own voter id documents"
ON public.pillar_voter_id_documents
FOR ALL
TO authenticated
USING (
  pillar_id = auth.uid() 
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  pillar_id = auth.uid() 
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- D. pillar_driving_license_documents
ALTER TABLE IF EXISTS public.pillar_driving_license_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Pillars access own driving license documents" ON public.pillar_driving_license_documents;
DROP POLICY IF EXISTS "Pillars and Admins access driving license documents" ON public.pillar_driving_license_documents;

CREATE POLICY "Pillars access own driving license documents"
ON public.pillar_driving_license_documents
FOR ALL
TO authenticated
USING (
  pillar_id = auth.uid() 
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  pillar_id = auth.uid() 
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- E. kyc_documents
ALTER TABLE IF EXISTS public.kyc_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Pillars access own kyc_documents" ON public.kyc_documents;
DROP POLICY IF EXISTS "Allow all on kyc_documents" ON public.kyc_documents;

CREATE POLICY "Pillars access own kyc_documents"
ON public.kyc_documents
FOR ALL
TO authenticated
USING (
  pillar_id = auth.uid() 
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  pillar_id = auth.uid() 
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
