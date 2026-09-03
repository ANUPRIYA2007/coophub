-- ==============================================================================
-- Migration 19: Real AI Demand Forecasting & Workforce Allocation Cache
-- ==============================================================================

-- 1. Create table for persisting and caching calculated AI Demand Forecasts
CREATE TABLE IF NOT EXISTS public.ai_demand_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_category TEXT NOT NULL,
    locality TEXT NOT NULL,
    forecast_horizon TEXT NOT NULL DEFAULT '7d',
    historical_records_count INTEGER NOT NULL DEFAULT 0,
    predicted_demand INTEGER NOT NULL DEFAULT 0,
    expected_lower INTEGER DEFAULT 0,
    expected_upper INTEGER DEFAULT 0,
    available_capacity INTEGER NOT NULL DEFAULT 0,
    projected_gap INTEGER NOT NULL DEFAULT 0,
    model_used TEXT NOT NULL DEFAULT 'Amazon Chronos-2 (amazon/chronos-2)',
    ai_recommendation TEXT,
    breakdown JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 hour')
);

-- Index for fast lookup by service, area and horizon
CREATE INDEX IF NOT EXISTS idx_forecast_lookup 
ON public.ai_demand_forecasts (service_category, locality, forecast_horizon);

CREATE INDEX IF NOT EXISTS idx_forecast_expires 
ON public.ai_demand_forecasts (expires_at);

-- 2. Row Level Security for Forecasts Table
ALTER TABLE public.ai_demand_forecasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage demand forecasts" ON public.ai_demand_forecasts;
DROP POLICY IF EXISTS "Pillars can view non-sensitive demand forecasts" ON public.ai_demand_forecasts;

-- Admins have full access
CREATE POLICY "Admins can manage demand forecasts"
ON public.ai_demand_forecasts
FOR ALL
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Pillars can view zone demand trends
CREATE POLICY "Pillars can view non-sensitive demand forecasts"
ON public.ai_demand_forecasts
FOR SELECT
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'pillar')
);

-- 3. Ensure workforce_allocations table exists for audit tracking
CREATE TABLE IF NOT EXISTS public.workforce_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id TEXT,
    service_name TEXT,
    service_area TEXT,
    customer_id TEXT,
    allocated_pillar_id TEXT NOT NULL,
    allocation_status TEXT DEFAULT 'assigned',
    allocation_method TEXT DEFAULT 'AUTO_RECOMMENDATION',
    match_score NUMERIC DEFAULT 0,
    scoring_breakdown JSONB DEFAULT '{}'::jsonb,
    ai_recommendation TEXT,
    admin_override BOOLEAN DEFAULT FALSE,
    override_by TEXT,
    override_reason TEXT,
    reassigned_from_pillar_id TEXT,
    reassignment_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.workforce_allocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins access workforce allocations" ON public.workforce_allocations;

CREATE POLICY "Admins access workforce allocations"
ON public.workforce_allocations
FOR ALL
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
