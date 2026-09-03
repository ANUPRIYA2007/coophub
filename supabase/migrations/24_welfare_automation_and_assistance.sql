-- ==============================================================================
-- Migration 24: Welfare Automation, Idempotency & Assistance Workflow
-- ==============================================================================

-- 1. Create welfare_assistance_requests table for tracking Pillar scheme assistance
CREATE TABLE IF NOT EXISTS public.welfare_assistance_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pillar_id UUID NOT NULL REFERENCES public.pillar_profiles(id) ON DELETE CASCADE,
    scheme_id UUID NOT NULL REFERENCES public.welfare_schemes(id) ON DELETE CASCADE,
    scheme_code TEXT NOT NULL,
    status TEXT DEFAULT 'requested' CHECK (status IN ('draft', 'requested', 'under_review', 'documents_required', 'submitted', 'approved', 'rejected', 'completed')),
    submitted_documents JSONB DEFAULT '[]'::jsonb,
    missing_documents JSONB DEFAULT '[]'::jsonb,
    admin_notes TEXT,
    rejection_reason TEXT,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add Unique Partial Index on pf_contributions for strict database idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_pf_contributions_booking 
ON public.pf_contributions(booking_id) 
WHERE booking_id IS NOT NULL;

-- 3. Extend admin_settings with configurable PF contribution rates
ALTER TABLE public.admin_settings
ADD COLUMN IF NOT EXISTS pf_contribution_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS pf_pillar_rate NUMERIC(5, 2) DEFAULT 2.50,
ADD COLUMN IF NOT EXISTS pf_coop_match_rate NUMERIC(5, 2) DEFAULT 2.50;

-- 4. High-performance indexes for welfare queries
CREATE INDEX IF NOT EXISTS idx_welfare_assist_pillar ON public.welfare_assistance_requests(pillar_id, status);
CREATE INDEX IF NOT EXISTS idx_welfare_assist_scheme ON public.welfare_assistance_requests(scheme_id);
CREATE INDEX IF NOT EXISTS idx_pf_contributions_month ON public.pf_contributions(period_month);

-- 5. Row Level Security (RLS) Policies
ALTER TABLE public.welfare_assistance_requests ENABLE ROW LEVEL SECURITY;

-- Pillar can only view and create own assistance requests
DROP POLICY IF EXISTS "Pillars view own assistance requests" ON public.welfare_assistance_requests;
CREATE POLICY "Pillars view own assistance requests"
ON public.welfare_assistance_requests FOR SELECT
TO authenticated
USING (
    pillar_id = auth.uid()
    OR
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
    )
);

DROP POLICY IF EXISTS "Pillars insert own assistance requests" ON public.welfare_assistance_requests;
CREATE POLICY "Pillars insert own assistance requests"
ON public.welfare_assistance_requests FOR INSERT
TO authenticated
WITH CHECK (
    pillar_id = auth.uid()
    OR
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
    )
);

DROP POLICY IF EXISTS "Admin full access on assistance requests" ON public.welfare_assistance_requests;
CREATE POLICY "Admin full access on assistance requests"
ON public.welfare_assistance_requests FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
    )
);

-- 6. Realtime Publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'welfare_assistance_requests'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.welfare_assistance_requests;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'pf_contributions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.pf_contributions;
    END IF;
END $$;
