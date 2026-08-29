-- ============================================================================
-- COOP HUB MIGRATION 15: AI-Assisted Workforce Allocation & Audit Trail
-- ============================================================================

-- 1. Create workforce_allocations table
CREATE TABLE IF NOT EXISTS public.workforce_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    request_id UUID,
    service_name TEXT NOT NULL,
    service_area TEXT,
    customer_id UUID,
    allocated_pillar_id UUID REFERENCES public.pillar_profiles(id),
    allocation_status TEXT DEFAULT 'assigned' CHECK (allocation_status IN ('pending', 'assigned', 'accepted', 'rejected', 'reassigned', 'completed', 'cancelled')),
    allocation_method TEXT DEFAULT 'AI_AUTOMATIC' CHECK (allocation_method IN ('AI_AUTOMATIC', 'MANUAL_DISPATCH', 'ADMIN_OVERRIDE', 'AUTO_REALLOCATION')),
    match_score NUMERIC(5, 2) DEFAULT 0.0,
    scoring_breakdown JSONB DEFAULT '{}'::jsonb,
    ai_recommendation TEXT,
    ai_reasoning_model TEXT DEFAULT 'NVIDIA-NIM/Llama-3.2',
    candidates_considered JSONB DEFAULT '[]'::jsonb,
    reassigned_from_pillar_id UUID REFERENCES public.pillar_profiles(id),
    reassignment_reason TEXT,
    admin_override BOOLEAN DEFAULT FALSE,
    override_by UUID,
    override_reason TEXT,
    allocated_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add active_jobs_count and live GPS timestamps to pillar_profiles if not present
ALTER TABLE public.pillar_profiles ADD COLUMN IF NOT EXISTS active_jobs_count INTEGER DEFAULT 0;
ALTER TABLE public.pillar_profiles ADD COLUMN IF NOT EXISTS gps_last_updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.pillar_profiles ADD COLUMN IF NOT EXISTS emergency_ready BOOLEAN DEFAULT TRUE;
ALTER TABLE public.pillar_profiles ADD COLUMN IF NOT EXISTS total_completed_jobs INTEGER DEFAULT 0;
ALTER TABLE public.pillar_profiles ADD COLUMN IF NOT EXISTS lifetime_earnings NUMERIC(12, 2) DEFAULT 0.00;

-- 3. Indexes for fast geospatial and allocation queries
CREATE INDEX IF NOT EXISTS idx_workforce_alloc_booking ON public.workforce_allocations(booking_id);
CREATE INDEX IF NOT EXISTS idx_workforce_alloc_pillar ON public.workforce_allocations(allocated_pillar_id);
CREATE INDEX IF NOT EXISTS idx_workforce_alloc_status ON public.workforce_allocations(allocation_status);
CREATE INDEX IF NOT EXISTS idx_pillar_availability ON public.pillar_profiles(is_available, status);

-- 4. Row Level Security Policies
ALTER TABLE public.workforce_allocations ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "Admins full access to workforce allocations"
    ON public.workforce_allocations
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Pillars can read their own allocations
CREATE POLICY "Pillars can view their own allocations"
    ON public.workforce_allocations
    FOR SELECT
    TO authenticated
    USING (allocated_pillar_id = auth.uid());

-- Customers can view allocations for their bookings
CREATE POLICY "Customers can view their booking allocations"
    ON public.workforce_allocations
    FOR SELECT
    TO authenticated
    USING (customer_id = auth.uid());

-- Public anon service role read for real-time dispatch
CREATE POLICY "Public read for dispatch synchronization"
    ON public.workforce_allocations
    FOR SELECT
    TO anon
    USING (true);
