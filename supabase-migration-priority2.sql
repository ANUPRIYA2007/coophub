-- SQL Migration for Customer Lifecycle Priority 2
-- Safely creates tables and columns without mock data.

-- 1. Create Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES public.service_requests(id) ON DELETE CASCADE,
    invoice_number VARCHAR NOT NULL,
    invoice_status VARCHAR NOT NULL DEFAULT 'pending',
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR DEFAULT 'INR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES public.service_requests(id) ON DELETE CASCADE,
    payment_status VARCHAR NOT NULL DEFAULT 'pending',
    payment_method VARCHAR,
    amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Update Service Requests with Lifecycle Columns safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_requests' AND column_name = 'arrival_otp') THEN
        ALTER TABLE public.service_requests ADD COLUMN arrival_otp VARCHAR(6);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_requests' AND column_name = 'extra_charge_reason') THEN
        ALTER TABLE public.service_requests ADD COLUMN extra_charge_reason TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_requests' AND column_name = 'extra_charge_amount') THEN
        ALTER TABLE public.service_requests ADD COLUMN extra_charge_amount NUMERIC(10,2) DEFAULT 0.00;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_requests' AND column_name = 'extra_charge_status') THEN
        ALTER TABLE public.service_requests ADD COLUMN extra_charge_status VARCHAR DEFAULT 'none'; -- none, pending, accepted, rejected
    END IF;
END $$;

-- 4. Secure OTP Auto-Generation Trigger for "arrived" status
CREATE OR REPLACE FUNCTION generate_arrival_otp()
RETURNS trigger AS $$
BEGIN
    IF NEW.status = 'arrived' AND (OLD.status IS DISTINCT FROM 'arrived') THEN
        -- Generate random 4-digit OTP
        NEW.arrival_otp := lpad(floor(random() * 10000)::text, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_arrival_otp ON public.service_requests;
CREATE TRIGGER trigger_generate_arrival_otp
BEFORE UPDATE ON public.service_requests
FOR EACH ROW
EXECUTE FUNCTION generate_arrival_otp();

-- 5. Preserve Global RLS Policies for Customer Secure Access
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customers can view own invoices" ON public.invoices;
CREATE POLICY "Customers can view own invoices" ON public.invoices FOR SELECT USING (
    request_id IN (SELECT id FROM public.service_requests WHERE customer_id = auth.uid())
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customers can view own payments" ON public.payments;
CREATE POLICY "Customers can view own payments" ON public.payments FOR SELECT USING (
    request_id IN (SELECT id FROM public.service_requests WHERE customer_id = auth.uid())
);
