-- ==============================================================================
-- Migration 23: Financial Completion, Payout Lifecycle & Reconciliation
-- ==============================================================================

-- 1. Create refunds table for tracking refund requests and settlements
CREATE TABLE IF NOT EXISTS public.refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.service_requests(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
    customer_id UUID,
    amount NUMERIC(10, 2) NOT NULL,
    cancellation_fee NUMERIC(10, 2) DEFAULT 0.00,
    net_refund_amount NUMERIC(10, 2) NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed', 'cancelled')),
    gateway_refund_id TEXT,
    admin_notes TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Extend payout_requests table with audit fields and flexible status lifecycle
ALTER TABLE public.payout_requests
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_by TEXT,
ADD COLUMN IF NOT EXISTS disbursement_reference TEXT;

-- Drop and recreate status check constraint to support complete lifecycle
DO $$
BEGIN
    ALTER TABLE public.payout_requests DROP CONSTRAINT IF EXISTS payout_requests_status_check;
    ALTER TABLE public.payout_requests 
    ADD CONSTRAINT payout_requests_status_check 
    CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected', 'failed', 'cancelled'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 3. Extend admin_settings with configurable cancellation policy
ALTER TABLE public.admin_settings
ADD COLUMN IF NOT EXISTS cancellation_grace_minutes INT DEFAULT 15,
ADD COLUMN IF NOT EXISTS cancellation_fee_fixed NUMERIC(10, 2) DEFAULT 50.00;

-- 4. High-performance indexes for financial reconciliation
CREATE INDEX IF NOT EXISTS idx_refunds_req ON public.refunds (request_id);
CREATE INDEX IF NOT EXISTS idx_refunds_pay ON public.refunds (payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON public.refunds (status);
CREATE INDEX IF NOT EXISTS idx_payouts_pillar_status ON public.payout_requests (pillar_id, status);

-- 5. Row Level Security (RLS) Policies
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

-- Refunds RLS
DROP POLICY IF EXISTS "Customers view own refunds" ON public.refunds;
CREATE POLICY "Customers view own refunds"
ON public.refunds FOR SELECT
TO authenticated
USING (
    customer_id = auth.uid()
    OR
    EXISTS (
        SELECT 1 FROM public.service_requests sr
        WHERE sr.id = refunds.request_id AND sr.customer_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
    )
);

DROP POLICY IF EXISTS "Admin full access on refunds" ON public.refunds;
CREATE POLICY "Admin full access on refunds"
ON public.refunds FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
    )
);

-- Payout Requests RLS
DROP POLICY IF EXISTS "Pillars view and request own payouts" ON public.payout_requests;
CREATE POLICY "Pillars view and request own payouts"
ON public.payout_requests FOR SELECT
TO authenticated
USING (
    pillar_id = auth.uid()
    OR
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
    )
);

DROP POLICY IF EXISTS "Pillars insert own payouts" ON public.payout_requests;
CREATE POLICY "Pillars insert own payouts"
ON public.payout_requests FOR INSERT
TO authenticated
WITH CHECK (
    pillar_id = auth.uid()
    OR
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
        AND tablename = 'refunds'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.refunds;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'payout_requests'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.payout_requests;
    END IF;
END $$;
