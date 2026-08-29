-- ============================================================
-- COOP HUB Migration 11: Add Application ID to Pillar Profiles
-- ============================================================

-- 1. Add application_id column to pillar_profiles if not present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'pillar_profiles' AND column_name = 'application_id'
    ) THEN
        ALTER TABLE public.pillar_profiles ADD COLUMN application_id TEXT;
        CREATE INDEX IF NOT EXISTS idx_pillar_profiles_app_id ON public.pillar_profiles(application_id);
    END IF;
END $$;

-- 2. Populate existing records with a default application ID format if null
UPDATE public.pillar_profiles
SET application_id = 'APP-2026-' || UPPER(SUBSTRING(id::text, 1, 6))
WHERE application_id IS NULL;
