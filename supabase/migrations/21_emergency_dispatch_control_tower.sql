-- ==============================================================================
-- Migration 21: Real-Time Operations + Emergency Dispatch Control Tower Schema
-- ==============================================================================

-- 1. Extend service_requests with emergency dispatch lifecycle fields
ALTER TABLE public.service_requests
ADD COLUMN IF NOT EXISTS is_emergency BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS priority_level TEXT DEFAULT 'NORMAL',
ADD COLUMN IF NOT EXISTS emergency_reason TEXT,
ADD COLUMN IF NOT EXISTS emergency_created_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS emergency_response_deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS dispatch_status TEXT DEFAULT 'NONE',
ADD COLUMN IF NOT EXISTS dispatch_attempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_offered_pillar_id UUID,
ADD COLUMN IF NOT EXISTS offer_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS escalation_reason TEXT;

-- 2. Extend bookings to match service_requests emergency attributes
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS is_emergency BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS priority_level TEXT DEFAULT 'NORMAL',
ADD COLUMN IF NOT EXISTS emergency_reason TEXT,
ADD COLUMN IF NOT EXISTS emergency_created_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS dispatch_status TEXT DEFAULT 'NONE';

-- 3. Create emergency_dispatch_logs table for auditable dispatch tracking
CREATE TABLE IF NOT EXISTS public.emergency_dispatch_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.service_requests(id) ON DELETE CASCADE,
    pillar_id UUID,
    event_type TEXT NOT NULL, -- 'OFFERED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'EN_ROUTE', 'ARRIVED', 'ESCALATED', 'MANUAL_REASSIGNED'
    distance_km NUMERIC(6,2),
    eta_minutes INT,
    actor_id UUID,
    actor_role TEXT DEFAULT 'system',
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Indexes for fast geospatial, status, and emergency dispatch queries
CREATE INDEX IF NOT EXISTS idx_service_requests_dispatch_status 
ON public.service_requests (dispatch_status, is_emergency);

CREATE INDEX IF NOT EXISTS idx_service_requests_offered_pillar 
ON public.service_requests (current_offered_pillar_id, offer_expires_at);

CREATE INDEX IF NOT EXISTS idx_emergency_logs_request_id 
ON public.emergency_dispatch_logs (request_id, created_at DESC);

-- 5. Row Level Security for emergency_dispatch_logs
ALTER TABLE public.emergency_dispatch_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full access to emergency logs" ON public.emergency_dispatch_logs;
CREATE POLICY "Admins full access to emergency logs"
ON public.emergency_dispatch_logs
FOR ALL
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Pillars can view own emergency offers" ON public.emergency_dispatch_logs;
CREATE POLICY "Pillars can view own emergency offers"
ON public.emergency_dispatch_logs
FOR SELECT
TO authenticated
USING (
    pillar_id = auth.uid()
);

-- 6. Add emergency_dispatch_logs to Supabase Realtime publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'emergency_dispatch_logs'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_dispatch_logs;
    END IF;
END $$;
