-- ============================================================
-- COOP HUB PHASE 6: SUPER ADMIN COMMUNICATIONS
-- Migration 33
-- Extends the existing messages table for direct Admin-to-Admin chat.
-- ============================================================

BEGIN;

-- Extend the existing messages table to support direct user-to-user messaging
-- without requiring a booking_id
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS receiver_id UUID,
ADD COLUMN IF NOT EXISTS receiver_type TEXT CHECK (receiver_type IN ('pillar', 'customer', 'admin'));

COMMIT;
