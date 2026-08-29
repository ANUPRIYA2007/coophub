-- ==============================================================================
-- MIGRATION 14: SERVICE REQUESTS ENHANCEMENTS & REALTIME PUBLICATION
-- ==============================================================================

-- 1. Add missing workflow columns to service_requests table
ALTER TABLE public.service_requests 
ADD COLUMN IF NOT EXISTS pillar_id UUID,
ADD COLUMN IF NOT EXISTS arrival_otp TEXT,
ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 450,
ADD COLUMN IF NOT EXISTS final_amount NUMERIC DEFAULT 450,
ADD COLUMN IF NOT EXISTS extra_charge_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS extra_charge_reason TEXT,
ADD COLUMN IF NOT EXISTS extra_charge_status TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- 2. Add booking_id column to messages table if not present
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS booking_id UUID,
ADD COLUMN IF NOT EXISTS sender_type TEXT,
ADD COLUMN IF NOT EXISTS content TEXT;

-- 3. Ensure invoices table exists and has proper structure
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID,
    booking_id UUID,
    invoice_number TEXT UNIQUE,
    customer_id UUID,
    pillar_id UUID,
    base_amount NUMERIC DEFAULT 450,
    extra_charges NUMERIC DEFAULT 0,
    tax_amount NUMERIC DEFAULT 0,
    total_amount NUMERIC DEFAULT 450,
    currency TEXT DEFAULT 'INR',
    invoice_status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable Supabase Realtime for instant live status updates across all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
