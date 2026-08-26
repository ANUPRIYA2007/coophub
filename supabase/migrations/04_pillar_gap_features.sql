-- ============================================================
-- COOP HUB PILLAR PORTAL — GAP ANALYSIS SCHEMA UPDATE
-- Migration 04
-- Provides tables for Chat, Ratings, KYC, Payouts, and extends Profile/Booking.
-- ============================================================

-- 1. MESSAGES (Customer Chat)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id),
  sender_type TEXT CHECK (sender_type IN ('pillar', 'customer', 'admin')),
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow message access" ON public.messages FOR ALL USING (true);

-- Need to add public.messages to the realtime publication
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.bookings, public.pillar_profiles, public.support_tickets, public.messages;
COMMIT;
-- REPLICA IDENTITY FULL for detailed realtime payloads
ALTER TABLE public.messages REPLICA IDENTITY FULL;
CREATE INDEX IF NOT EXISTS idx_messages_booking_id ON public.messages(booking_id, created_at DESC);


-- 2. BOOKING REVIEWS (Ratings & Feedback)
CREATE TABLE IF NOT EXISTS public.booking_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  pillar_id UUID REFERENCES public.pillar_profiles(id),
  customer_id UUID REFERENCES auth.users(id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.booking_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow review access" ON public.booking_reviews FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_reviews_pillar_id ON public.booking_reviews(pillar_id, created_at DESC);


-- 3. KYC DOCUMENTS (Worker Certification)
CREATE TABLE IF NOT EXISTS public.kyc_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pillar_id UUID REFERENCES public.pillar_profiles(id) ON DELETE CASCADE,
  document_type TEXT CHECK (document_type IN ('aadhaar', 'pan', 'skill_certificate', 'address_proof', 'photo', 'police_clearance')),
  document_url TEXT NOT NULL,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  rejection_reason TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);

ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow KYC access" ON public.kyc_documents FOR ALL USING (true);


-- 4. PAYOUT REQUESTS (Digital Payments)
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pillar_id UUID REFERENCES public.pillar_profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payment_mode TEXT DEFAULT 'bank_transfer' CHECK (payment_mode IN ('bank_transfer', 'upi')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow payout request access" ON public.payout_requests FOR ALL USING (true);


-- 5. PILLAR PROFILES ALTERATIONS (Geolocation & Bank KYC)
ALTER TABLE public.pillar_profiles
  ADD COLUMN IF NOT EXISTS lat NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS lng NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS last_location_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bank_account_holder TEXT,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
  ADD COLUMN IF NOT EXISTS bank_ifsc TEXT,
  ADD COLUMN IF NOT EXISTS bank_upi_id TEXT,
  ADD COLUMN IF NOT EXISTS payout_status TEXT DEFAULT 'not_verified';


-- 6. BOOKINGS ALTERATIONS (Emergency & Invoice)
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS is_emergency BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS invoice_url TEXT,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
