-- ==============================================================================
-- Migration 20: Real AI Document Intelligence, Quality & KYC Risk Analysis
-- ==============================================================================

-- 1. Ensure pillar_kyc_documents table exists (with backwards compatibility)
CREATE TABLE IF NOT EXISTS public.pillar_kyc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pillar_id UUID REFERENCES public.pillar_profiles(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    document_number TEXT,
    verification_status TEXT DEFAULT 'pending_inspection',
    document_url TEXT,
    ocr_data JSONB DEFAULT '{}'::jsonb,
    document_fingerprint TEXT,
    quality_assessment JSONB DEFAULT '{}'::jsonb,
    risk_score INTEGER DEFAULT 0,
    risk_tier TEXT DEFAULT 'LOW_RISK',
    risk_factors JSONB DEFAULT '[]'::jsonb,
    consistency_assessment JSONB DEFAULT '{}'::jsonb,
    trade_match_status TEXT DEFAULT 'NOT_APPLICABLE',
    verification_boundary TEXT DEFAULT 'COOPERATIVE_ADMIN_REVIEW',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Also add columns to legacy/core public.kyc_documents table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'kyc_documents') THEN
        ALTER TABLE public.kyc_documents
        ADD COLUMN IF NOT EXISTS document_fingerprint TEXT,
        ADD COLUMN IF NOT EXISTS quality_assessment JSONB DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS risk_tier TEXT DEFAULT 'LOW_RISK',
        ADD COLUMN IF NOT EXISTS risk_factors JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS consistency_assessment JSONB DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS trade_match_status TEXT DEFAULT 'NOT_APPLICABLE',
        ADD COLUMN IF NOT EXISTS verification_boundary TEXT DEFAULT 'COOPERATIVE_ADMIN_REVIEW';

        CREATE INDEX IF NOT EXISTS idx_kyc_doc_fingerprint ON public.kyc_documents (document_fingerprint);
    END IF;
END $$;

-- 2. Add columns to pillar_kyc_documents if table already existed without them
ALTER TABLE public.pillar_kyc_documents
ADD COLUMN IF NOT EXISTS document_fingerprint TEXT,
ADD COLUMN IF NOT EXISTS quality_assessment JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS risk_tier TEXT DEFAULT 'LOW_RISK',
ADD COLUMN IF NOT EXISTS risk_factors JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS consistency_assessment JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS trade_match_status TEXT DEFAULT 'NOT_APPLICABLE',
ADD COLUMN IF NOT EXISTS verification_boundary TEXT DEFAULT 'COOPERATIVE_ADMIN_REVIEW';

-- 3. Index for instant duplicate detection across registered documents
CREATE INDEX IF NOT EXISTS idx_pillar_kyc_doc_fingerprint 
ON public.pillar_kyc_documents (document_fingerprint);

-- 4. Row Level Security: Ensure sensitive document intelligence is restricted to Admins
ALTER TABLE public.pillar_kyc_documents ENABLE ROW LEVEL SECURITY;

-- Admins have full access to inspect risk scores, fingerprints, and quality metrics
DROP POLICY IF EXISTS "Admins full access to kyc intelligence" ON public.pillar_kyc_documents;
CREATE POLICY "Admins full access to kyc intelligence"
ON public.pillar_kyc_documents
FOR ALL
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Pillars can read their own documents but NOT modify risk scores or audit notes
DROP POLICY IF EXISTS "Pillars can read own document status" ON public.pillar_kyc_documents;
CREATE POLICY "Pillars can read own document status"
ON public.pillar_kyc_documents
FOR SELECT
TO authenticated
USING (
    pillar_id = auth.uid()
);
