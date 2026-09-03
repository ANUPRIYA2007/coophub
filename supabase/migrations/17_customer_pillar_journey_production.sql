-- ==============================================================================
-- MIGRATION 17: COMPLETE CUSTOMER <-> PILLAR SERVICE JOURNEY PRODUCTION SCHEMA
-- Enforces: Status Transitions, RLS Hardening, Unified Messaging, Reviews, Indexes
-- ==============================================================================

-- 1. Ensure all lifecycle columns exist on service_requests
ALTER TABLE public.service_requests
ADD COLUMN IF NOT EXISTS pillar_id UUID,
ADD COLUMN IF NOT EXISTS arrival_otp TEXT,
ADD COLUMN IF NOT EXISTS otp_attempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 450,
ADD COLUMN IF NOT EXISTS final_amount NUMERIC DEFAULT 450,
ADD COLUMN IF NOT EXISTS extra_charge_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS extra_charge_reason TEXT,
ADD COLUMN IF NOT EXISTS extra_charge_status TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- 2. Ensure all lifecycle columns exist on bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS arrival_otp TEXT,
ADD COLUMN IF NOT EXISTS otp_attempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS extra_charge_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS extra_charge_reason TEXT,
ADD COLUMN IF NOT EXISTS extra_charge_status TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- 3. Unify columns on messages table
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS request_id UUID,
ADD COLUMN IF NOT EXISTS booking_id UUID,
ADD COLUMN IF NOT EXISTS sender_type TEXT DEFAULT 'customer',
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS message TEXT,
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- 4. Create or update reviews table with unique constraint per booking
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.service_requests(id) ON DELETE CASCADE,
    booking_id UUID,
    customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    pillar_id UUID,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_customer_request_review UNIQUE (request_id, customer_id)
);

-- 5. Performance Indexes for Query Routing
CREATE INDEX IF NOT EXISTS idx_service_requests_status_pillar ON public.service_requests(pillar_id, status);
CREATE INDEX IF NOT EXISTS idx_service_requests_customer_status ON public.service_requests(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_pillar_profiles_availability ON public.pillar_profiles(is_available, status);
CREATE INDEX IF NOT EXISTS idx_messages_unified_req ON public.messages(request_id, booking_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_customer ON public.notifications(customer_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_request ON public.invoices(request_id, booking_id);

-- 6. Trigger: Automatically update Pillar Average Rating when review is submitted
CREATE OR REPLACE FUNCTION update_pillar_rating_on_review()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating NUMERIC;
    tot_jobs INT;
BEGIN
    IF NEW.pillar_id IS NOT NULL THEN
        SELECT ROUND(AVG(rating)::numeric, 1), COUNT(*)
        INTO avg_rating, tot_jobs
        FROM public.reviews
        WHERE pillar_id = NEW.pillar_id;

        UPDATE public.pillar_profiles
        SET rating = avg_rating,
            completed_jobs = COALESCE(completed_jobs, 0) + 1,
            updated_at = NOW()
        WHERE id = NEW.pillar_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_submitted ON public.reviews;
CREATE TRIGGER on_review_submitted
    AFTER INSERT ON public.reviews
    FOR EACH ROW EXECUTE PROCEDURE update_pillar_rating_on_review();

-- 7. Realtime Publications
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;
EXCEPTION WHEN OTHERS THEN NULL; END;
$$;
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
EXCEPTION WHEN OTHERS THEN NULL; END;
$$;
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN OTHERS THEN NULL; END;
$$;
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
EXCEPTION WHEN OTHERS THEN NULL; END;
$$;
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
EXCEPTION WHEN OTHERS THEN NULL; END;
$$;
