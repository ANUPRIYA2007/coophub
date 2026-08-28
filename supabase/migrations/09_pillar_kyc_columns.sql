-- ==============================================================================
-- MIGRATION 09: ADD KYC & VERIFICATION EXTENSION COLUMNS TO PILLAR_PROFILES
-- ==============================================================================

ALTER TABLE public.pillar_profiles 
ADD COLUMN IF NOT EXISTS dob TEXT,
ADD COLUMN IF NOT EXISTS document_type TEXT,
ADD COLUMN IF NOT EXISTS document_number TEXT,
ADD COLUMN IF NOT EXISTS document_url TEXT,
ADD COLUMN IF NOT EXISTS ocr_data JSONB,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending_verification',
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
