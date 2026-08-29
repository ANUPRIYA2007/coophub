-- ============================================================
-- COOP HUB Migration 12: Broaden Pillar Status Check Constraint
-- ============================================================

-- 1. Drop existing status check constraint if present
ALTER TABLE public.pillar_profiles 
DROP CONSTRAINT IF EXISTS pillar_profiles_status_check;

-- 2. Re-create constraint allowing all cooperative workflow statuses
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
