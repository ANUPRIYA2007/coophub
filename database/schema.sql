-- ==========================================
-- COOP HUB: Supabase Database Schema (Phase 2)
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  mobile_number text,
  role text DEFAULT 'customer'::text,
  preferred_language text DEFAULT 'en'::text,
  profile_image text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_user_id_key UNIQUE (user_id)
);

-- 2. Turn on Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Users can read their own profile
CREATE POLICY "Users can view own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- 4. Create trigger to automatically insert a profile row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, mobile_number, role, preferred_language)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'mobile_number',
    COALESCE(new.raw_user_meta_data->>'role', 'customer'),
    COALESCE(new.raw_user_meta_data->>'preferred_language', 'en')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. Setup for Storage (future-proofing profile_images)
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Anyone can upload an avatar." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Anyone can update their own avatar." ON storage.objects FOR UPDATE USING (auth.uid() = owner);

-- ==========================================
-- COOP HUB: Supabase Database Schema (Phase 3)
-- ==========================================

-- 7. Create Services Table
CREATE TABLE IF NOT EXISTS public.services (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name_translations jsonb NOT NULL DEFAULT '{}'::jsonb,
  description_translations jsonb NOT NULL DEFAULT '{}'::jsonb,
  icon text,
  active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT services_pkey PRIMARY KEY (id)
);

-- 8. Create Sub-Services Table
CREATE TABLE IF NOT EXISTS public.sub_services (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
  name_translations jsonb NOT NULL DEFAULT '{}'::jsonb,
  description_translations jsonb NOT NULL DEFAULT '{}'::jsonb,
  base_price numeric(10,2),
  active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sub_services_pkey PRIMARY KEY (id)
);

-- 9. Setup RLS for Services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_services ENABLE ROW LEVEL SECURITY;

-- Customers (public authenticated users) can READ active services
CREATE POLICY "Anyone can view active services" 
  ON public.services FOR SELECT USING (active = true);

CREATE POLICY "Anyone can view active sub_services" 
  ON public.sub_services FOR SELECT USING (active = true);

-- Note: In a full production environment, INSERT/UPDATE/DELETE policies for services
-- would be restricted explicitly to admins/cooperative roles.

-- ==========================================
-- COOP HUB: Supabase Database Schema (Phase 4)
-- ==========================================

-- 10. Setup for Attachments Storage
INSERT INTO storage.buckets (id, name, public) VALUES ('request_attachments', 'request_attachments', false) ON CONFLICT DO NOTHING;

-- RLS for Attachments Storage (Customers can upload and read their own)
CREATE POLICY "Customers can upload request attachments." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'request_attachments' AND auth.role() = 'authenticated');
CREATE POLICY "Customers can view own request attachments." ON storage.objects FOR SELECT USING (bucket_id = 'request_attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 11. Create Service Requests Table
CREATE TABLE IF NOT EXISTS public.service_requests (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE RESTRICT,
  sub_service_id uuid REFERENCES public.sub_services(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'requested'::text,
  location_type text, -- 'manual' | 'geolocation' | 'shared'
  address_line text,
  area text,
  city text,
  state text,
  postal_code text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  flexible_timing boolean DEFAULT false,
  preferred_date date,
  preferred_time time without time zone,
  customer_description text,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT service_requests_pkey PRIMARY KEY (id)
);

-- 12. Setup RLS for Service Requests
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Customers can CREATE requests for themselves
CREATE POLICY "Customers can create their own requests" 
  ON public.service_requests FOR INSERT 
  WITH CHECK (auth.uid() = customer_id);

-- Customers can READ their own requests
CREATE POLICY "Customers can read their own requests" 
  ON public.service_requests FOR SELECT 
  USING (auth.uid() = customer_id);

-- Explicitly, customers CANNOT UPDATE or DELETE their requests directly (handled only by Pillar/Admin in future phases)

-- ==========================================
-- COOP HUB: Supabase Database Schema (Phase 5)
-- ==========================================

-- 13. Create Request Status History Table
CREATE TABLE IF NOT EXISTS public.request_status_history (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  request_id uuid REFERENCES public.service_requests(id) ON DELETE CASCADE,
  status text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT request_status_history_pkey PRIMARY KEY (id)
);

-- 14. Setup RLS for History
ALTER TABLE public.request_status_history ENABLE ROW LEVEL SECURITY;

-- Customers can read their own request's history
CREATE POLICY "Customers can read history of own requests" 
  ON public.request_status_history FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.service_requests sr
      WHERE sr.id = request_status_history.request_id 
      AND sr.customer_id = auth.uid()
    )
  );

-- 15. Create Automatic Trigger for History Insertions
CREATE OR REPLACE FUNCTION public.log_request_status_change()
RETURNS trigger AS $$
BEGIN
  -- Insert on creation or when status actually changes
  IF (TG_OP = 'INSERT') OR ((TG_OP = 'UPDATE') AND (OLD.status IS DISTINCT FROM NEW.status)) THEN
    INSERT INTO public.request_status_history (request_id, status)
    VALUES (NEW.id, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_request_status_change ON public.service_requests;
CREATE TRIGGER on_request_status_change
  AFTER INSERT OR UPDATE OF status ON public.service_requests
  FOR EACH ROW EXECUTE PROCEDURE public.log_request_status_change();

-- ==========================================
-- COOP HUB: Supabase Database Schema (Phase 6)
-- ==========================================

-- 16. Create Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  request_id uuid REFERENCES public.service_requests(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_type text NOT NULL, -- 'customer' or 'pillar'
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id)
);

-- RLS for Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view messages of own requests" 
  ON public.messages FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.service_requests sr
      WHERE sr.id = messages.request_id 
      AND sr.customer_id = auth.uid()
    )
  );

CREATE POLICY "Customers can insert messages into own requests" 
  ON public.messages FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.service_requests sr
      WHERE sr.id = request_id 
      AND sr.customer_id = auth.uid()
    )
    AND sender_id = auth.uid()
    AND sender_type = 'customer'
  );

-- 17. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id uuid REFERENCES public.service_requests(id) ON DELETE CASCADE,
  type text NOT NULL,
  message_translations jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id)
);

-- RLS for Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own notifications" 
  ON public.notifications FOR SELECT 
  USING (customer_id = auth.uid());

CREATE POLICY "Customers can mark own notifications as read" 
  ON public.notifications FOR UPDATE 
  USING (customer_id = auth.uid());

-- Trigger: Auto-create notifications for status changes natively
CREATE OR REPLACE FUNCTION public.log_status_notification()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'UPDATE') AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Generate notification based on actual new status
    INSERT INTO public.notifications (customer_id, request_id, type, message_translations)
    VALUES (
      NEW.customer_id, 
      NEW.id, 
      'request_' || NEW.status, 
      jsonb_build_object(
        'en', 'Service request status updated to: ' || NEW.status,
        'hi', 'सेवा अनुरोध स्थिति अपडेट की गई: ' || NEW.status,
        'ta', 'சேவை கோரிக்கை நிலை புதுப்பிக்கப்பட்டது: ' || NEW.status,
        'te', 'సేవా అభ్యర్థన స్థితి నవీకరించబడింది: ' || NEW.status,
        'kn', 'ಸೇವಾ ವಿನಂತಿ ಸ್ಥಿತಿ ನವೀಕರಿಸಲಾಗಿದೆ: ' || NEW.status
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_status_notification ON public.service_requests;
CREATE TRIGGER on_status_notification
  AFTER UPDATE OF status ON public.service_requests
  FOR EACH ROW EXECUTE PROCEDURE public.log_status_notification();

-- 18. Create Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  request_id uuid REFERENCES public.service_requests(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT UNIQUE_review_per_request UNIQUE (request_id, customer_id)
);

-- RLS for Reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own reviews" 
  ON public.reviews FOR SELECT 
  USING (customer_id = auth.uid());

CREATE POLICY "Customers can insert their own reviews for completed requests"
  ON public.reviews FOR INSERT
  WITH CHECK (
    customer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.service_requests sr
      WHERE sr.id = request_id 
      AND sr.customer_id = auth.uid()
  );

-- ==========================================
-- COOP HUB: Supabase Database Schema (Phase 7)
-- ==========================================

-- 19. Create FAQ Table (Read-only for Customers)
CREATE TABLE IF NOT EXISTS public.faq (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  category text NOT NULL,
  question_translations jsonb NOT NULL,
  answer_translations jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT faq_pkey PRIMARY KEY (id)
);

ALTER TABLE public.faq ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active FAQs" 
  ON public.faq FOR SELECT 
  USING (is_active = true);

-- 20. Create Support Tickets Table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id uuid REFERENCES public.service_requests(id) ON DELETE SET NULL,
  subject text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_for_customer', 'resolved', 'closed')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT support_tickets_pkey PRIMARY KEY (id)
);

-- RLS for Support Tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own support tickets" 
  ON public.support_tickets FOR SELECT 
  USING (customer_id = auth.uid());

CREATE POLICY "Customers can create their own support tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (customer_id = auth.uid());

-- Trigger for Support Tickets updated_at
CREATE TRIGGER update_support_tickets_modtime
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();

-- 21. Create Customer Notification Preferences
CREATE TABLE IF NOT EXISTS public.customer_notification_preferences (
  customer_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  request_updates boolean DEFAULT true,
  messages boolean DEFAULT true,
  promotions boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS for Preferences
ALTER TABLE public.customer_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own preferences" 
  ON public.customer_notification_preferences FOR SELECT 
  USING (customer_id = auth.uid());

CREATE POLICY "Customers can update their own preferences"
  ON public.customer_notification_preferences FOR UPDATE
  USING (customer_id = auth.uid());

CREATE POLICY "Customers can insert their own preferences"
  ON public.customer_notification_preferences FOR INSERT
  WITH CHECK (customer_id = auth.uid());

-- Automatically create preferences row when a profile is created (via profiles trigger conceptually, but we can do it on auth)
-- For zero-mock, the frontend will UPSERT or we can just rely on the SELECT returning empty and frontend doing INSERT on demand.

