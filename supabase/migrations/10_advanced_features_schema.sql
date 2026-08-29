-- ==============================================================================
-- COOP HUB MIGRATION 10: ADVANCED AI FORECASTING, WORKFORCE MATCHING,
-- SKILL CERTIFICATIONS, EMERGENCY WORKFLOW & PAYMENT ENHANCEMENTS
-- ==============================================================================

-- 1. Skill Certifications Table (Independent from Identity KYC)
CREATE TABLE IF NOT EXISTS public.skill_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pillar_id UUID REFERENCES public.pillar_profiles(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    certificate_name TEXT NOT NULL,
    issuing_organization TEXT NOT NULL,
    certificate_number TEXT,
    issue_date DATE,
    expiry_date DATE,
    document_url TEXT NOT NULL,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'under_review', 'approved', 'rejected', 'expired')),
    rejection_reason TEXT,
    verified_by UUID,
    verified_at TIMESTAMPTZ,
    ocr_extracted_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Demand Forecasts Cache / Snapshot Table
CREATE TABLE IF NOT EXISTS public.demand_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area TEXT NOT NULL,
    pincode TEXT,
    service_name TEXT NOT NULL,
    sub_service_name TEXT,
    forecast_level TEXT DEFAULT 'MEDIUM' CHECK (forecast_level IN ('LOW', 'MEDIUM', 'HIGH')),
    expected_peak_hours TEXT,
    confidence_score NUMERIC(4,2) DEFAULT 0.85,
    predicted_count INTEGER DEFAULT 5,
    shortage_indicator BOOLEAN DEFAULT FALSE,
    ai_provider TEXT DEFAULT 'Deterministic Engine',
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Extend bookings & service_requests tables with matching and emergency fields
ALTER TABLE public.bookings
    ADD COLUMN IF NOT EXISTS is_emergency BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS priority_status TEXT DEFAULT 'normal' CHECK (priority_status IN ('normal', 'high', 'emergency')),
    ADD COLUMN IF NOT EXISTS emergency_timestamp TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS matching_score NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS matching_reasons JSONB,
    ADD COLUMN IF NOT EXISTS payment_gateway_ref TEXT,
    ADD COLUMN IF NOT EXISTS invoice_id UUID,
    ADD COLUMN IF NOT EXISTS receipt_url TEXT;

ALTER TABLE public.service_requests
    ADD COLUMN IF NOT EXISTS is_emergency BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS priority_status TEXT DEFAULT 'normal',
    ADD COLUMN IF NOT EXISTS emergency_timestamp TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS matching_score NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS matching_reasons JSONB,
    ADD COLUMN IF NOT EXISTS payment_gateway_ref TEXT,
    ADD COLUMN IF NOT EXISTS invoice_id UUID;

-- 4. Extend pillar_profiles for certified skills array cache
ALTER TABLE public.pillar_profiles
    ADD COLUMN IF NOT EXISTS certified_skills TEXT[] DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN IF NOT EXISTS emergency_available BOOLEAN DEFAULT TRUE;

-- 5. Indexes for fast geospatial and demand matching queries
CREATE INDEX IF NOT EXISTS idx_skill_certifications_pillar_id ON public.skill_certifications(pillar_id);
CREATE INDEX IF NOT EXISTS idx_skill_certifications_status ON public.skill_certifications(verification_status);
CREATE INDEX IF NOT EXISTS idx_demand_forecasts_area_service ON public.demand_forecasts(area, service_name);
CREATE INDEX IF NOT EXISTS idx_bookings_emergency ON public.bookings(is_emergency, status);
CREATE INDEX IF NOT EXISTS idx_service_requests_emergency ON public.service_requests(is_emergency, status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at DESC);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.skill_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_forecasts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_certifications' AND policyname = 'Allow access to skill_certifications') THEN
        CREATE POLICY "Allow access to skill_certifications" ON public.skill_certifications FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'demand_forecasts' AND policyname = 'Allow access to demand_forecasts') THEN
        CREATE POLICY "Allow access to demand_forecasts" ON public.demand_forecasts FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 7. Add to Realtime Publication
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.skill_certifications;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.demand_forecasts;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;
