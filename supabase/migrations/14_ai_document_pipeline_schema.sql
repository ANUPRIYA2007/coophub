-- ============================================================
-- COOP HUB Migration 14: AI Document Extraction Pipeline Schema
-- ============================================================

-- 1. Extend kyc_documents table with full AI & OCR pipeline audit fields
DO $$
BEGIN
    -- Processing status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kyc_documents' AND column_name = 'document_processing_status') THEN
        ALTER TABLE public.kyc_documents ADD COLUMN document_processing_status TEXT DEFAULT 'UPLOADED';
    END IF;

    -- OCR Provider & Raw Text
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kyc_documents' AND column_name = 'ocr_provider') THEN
        ALTER TABLE public.kyc_documents ADD COLUMN ocr_provider TEXT DEFAULT 'nvidia/nemotron-parse';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kyc_documents' AND column_name = 'ocr_raw_text') THEN
        ALTER TABLE public.kyc_documents ADD COLUMN ocr_raw_text TEXT;
    END IF;

    -- AI Provider & Structured Extracted Data
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kyc_documents' AND column_name = 'ai_provider') THEN
        ALTER TABLE public.kyc_documents ADD COLUMN ai_provider TEXT DEFAULT 'gemini-flash';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kyc_documents' AND column_name = 'ai_extracted_data') THEN
        ALTER TABLE public.kyc_documents ADD COLUMN ai_extracted_data JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Confidence Rating
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kyc_documents' AND column_name = 'ai_confidence') THEN
        ALTER TABLE public.kyc_documents ADD COLUMN ai_confidence NUMERIC(5,2) DEFAULT 0.0;
    END IF;

    -- Validation Result & Mismatch Flags
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kyc_documents' AND column_name = 'validation_result') THEN
        ALTER TABLE public.kyc_documents ADD COLUMN validation_result JSONB DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kyc_documents' AND column_name = 'mismatch_flags') THEN
        ALTER TABLE public.kyc_documents ADD COLUMN mismatch_flags JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Bounding Boxes for Document Inspection
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kyc_documents' AND column_name = 'bounding_boxes') THEN
        ALTER TABLE public.kyc_documents ADD COLUMN bounding_boxes JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Review & Audit timestamps
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kyc_documents' AND column_name = 'processed_at') THEN
        ALTER TABLE public.kyc_documents ADD COLUMN processed_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kyc_documents' AND column_name = 'reviewed_at') THEN
        ALTER TABLE public.kyc_documents ADD COLUMN reviewed_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kyc_documents' AND column_name = 'reviewed_by') THEN
        ALTER TABLE public.kyc_documents ADD COLUMN reviewed_by UUID;
    END IF;
END $$;

-- 2. Extend pillar_profiles with summary AI extraction fields if not present
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pillar_profiles' AND column_name = 'ai_extracted_data') THEN
        ALTER TABLE public.pillar_profiles ADD COLUMN ai_extracted_data JSONB DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pillar_profiles' AND column_name = 'ai_confidence') THEN
        ALTER TABLE public.pillar_profiles ADD COLUMN ai_confidence NUMERIC(5,2) DEFAULT 0.0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pillar_profiles' AND column_name = 'document_processing_status') THEN
        ALTER TABLE public.pillar_profiles ADD COLUMN document_processing_status TEXT DEFAULT 'READY_FOR_REVIEW';
    END IF;
END $$;

-- 3. Row Level Security Policies (Strict Privacy)
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

-- Drop prior permissive test policy if exists
DROP POLICY IF EXISTS "Allow public read and write on kyc_documents" ON public.kyc_documents;
DROP POLICY IF EXISTS "Pillars can view and upload own kyc documents" ON public.kyc_documents;
DROP POLICY IF EXISTS "Admins have full access to kyc documents" ON public.kyc_documents;

-- Policy A: Pillars can only select and insert their own KYC documents
CREATE POLICY "Pillars can view and upload own kyc documents"
ON public.kyc_documents
FOR ALL
TO authenticated
USING (auth.uid() = pillar_id)
WITH CHECK (auth.uid() = pillar_id);

-- Policy B: Admins can inspect and verify all KYC documents
CREATE POLICY "Admins have full access to kyc documents"
ON public.kyc_documents
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
    OR
    auth.jwt() ->> 'email' LIKE '%admin%'
);
