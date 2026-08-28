-- ============================================================
-- COOP HUB MIGRATION 07: PILLAR PROFILE EXTENSIONS
-- Adds dedicated fields for custom_role, area, and pincode
-- ============================================================

ALTER TABLE public.pillar_profiles 
ADD COLUMN IF NOT EXISTS custom_role TEXT;

ALTER TABLE public.pillar_profiles 
ADD COLUMN IF NOT EXISTS area TEXT;

ALTER TABLE public.pillar_profiles 
ADD COLUMN IF NOT EXISTS pincode TEXT;

-- Create helper index for location-based and pincode queries
CREATE INDEX IF NOT EXISTS idx_pillar_profiles_pincode ON public.pillar_profiles(pincode);
CREATE INDEX IF NOT EXISTS idx_pillar_profiles_area ON public.pillar_profiles(area);
