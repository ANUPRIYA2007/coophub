-- ==============================================================================
-- COOP HUB: Migration 34 - Add Service ID & Sub-Service ID to Bookings Table
-- Ensures each booking transaction is explicitly linked to the Service Catalog
-- and contains both Order/Booking ID and Service ID for end-to-end order management.
-- ==============================================================================

-- 1. Add service_id column if not already present
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id) ON DELETE SET NULL;

-- 2. Add sub_service_id column if not already present
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS sub_service_id UUID REFERENCES public.sub_services(id) ON DELETE SET NULL;

-- 3. Create index on service_id for fast analytics and joins
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON public.bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_sub_service_id ON public.bookings(sub_service_id);

-- 4. Backfill existing bookings with service_id from matching service_requests (if any)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'service_requests'
    ) THEN
        UPDATE public.bookings b
        SET 
            service_id = r.service_id,
            sub_service_id = r.sub_service_id
        FROM public.service_requests r
        WHERE b.id = r.id AND b.service_id IS NULL AND r.service_id IS NOT NULL;
    END IF;
END $$;
