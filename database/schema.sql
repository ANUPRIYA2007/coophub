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

