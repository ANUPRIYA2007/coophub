-- ============================================================================
-- COOP HUB SUPER ADMIN COMMAND CENTER V2 — AUTHORITATIVE DATABASE SCHEMA
-- Migration: 30_super_admin_v2_schema.sql
-- Covers: 5-Tier Geography Hierarchy, Admin Accounts, Scopes, Enforcement & Audit Log Extensions
-- ============================================================================

-- 1. Ensure Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Safely Update profiles Table Role Constraint (Preserving Legacy 'admin' Role)
DO $$
BEGIN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
        CHECK (role IN (
            'customer', 'pillar', 'admin', 
            'SUPER_ADMIN', 'ZONE_ADMIN', 'STATE_ADMIN', 
            'DISTRICT_ADMIN', 'COOPERATIVE_ADMIN', 'OPERATIONS_ADMIN'
        ));
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

-- 3. Create Authoritative 5-Tier Geographic Hierarchy Schema (India > Zone > State > District > Cooperative)

-- 3a. National Zones Table
CREATE TABLE IF NOT EXISTS public.geo_zones (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3b. States Table
CREATE TABLE IF NOT EXISTS public.geo_states (
    code TEXT PRIMARY KEY,
    zone_code TEXT NOT NULL REFERENCES public.geo_zones(code) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    capital TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3c. Districts Table
CREATE TABLE IF NOT EXISTS public.geo_districts (
    code TEXT PRIMARY KEY,
    state_code TEXT NOT NULL REFERENCES public.geo_states(code) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3d. Cooperative Societies Table
CREATE TABLE IF NOT EXISTS public.geo_cooperatives (
    code TEXT PRIMARY KEY,
    district_code TEXT NOT NULL REFERENCES public.geo_districts(code) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    registration_number TEXT UNIQUE,
    verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Admin Accounts Table (Tied to Auth User UUID & Profile)
CREATE TABLE IF NOT EXISTS public.admin_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    admin_code TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ZONE_ADMIN', 'STATE_ADMIN', 'DISTRICT_ADMIN', 'COOPERATIVE_ADMIN', 'OPERATIONS_ADMIN', 'admin')),
    clearance TEXT DEFAULT 'Level 3 Regional',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'restricted', 'blocked', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Admin Geographic Scopes Table
CREATE TABLE IF NOT EXISTS public.admin_scopes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.admin_accounts(id) ON DELETE CASCADE,
    level TEXT NOT NULL CHECK (level IN ('GLOBAL', 'ZONE', 'STATE', 'DISTRICT', 'COOPERATIVE')),
    entity_code TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT admin_scopes_unique UNIQUE (admin_id, level, entity_code)
);

-- 6. Create Admin Enforcement Actions Table
CREATE TABLE IF NOT EXISTS public.admin_enforcement_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_admin_id UUID NOT NULL REFERENCES public.admin_accounts(id) ON DELETE CASCADE,
    issuer_id UUID REFERENCES public.admin_accounts(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('WARN', 'RESTRICT', 'BLOCK', 'REMOVE_ACCESS')),
    reason TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Safely Extend Existing admin_audit_logs Table (No Recreation)
ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS correlation_id TEXT;

-- 8. Authoritative Seed Data (ONLY Official Verified National Zones & States — NO FAKE DISTRICTS / COOPS)
INSERT INTO public.geo_zones (code, name, description) VALUES
    ('SZ', 'South Zone', 'Southern Regional Sector (TN, KL, KA, AP, TS)'),
    ('NZ', 'North Zone', 'Northern Regional Sector (DL, PB, HR, UP, UK)'),
    ('WZ', 'West Zone', 'Western Regional Sector (MH, GJ, RJ, GA)'),
    ('EZ', 'East Zone', 'Eastern Regional Sector (WB, OR, JH, AS)')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.geo_states (code, zone_code, name, capital) VALUES
    ('TN', 'SZ', 'Tamil Nadu', 'Chennai'),
    ('KL', 'SZ', 'Kerala', 'Thiruvananthapuram'),
    ('KA', 'SZ', 'Karnataka', 'Bengaluru'),
    ('AP', 'SZ', 'Andhra Pradesh', 'Amaravati'),
    ('TS', 'SZ', 'Telangana', 'Hyderabad'),
    ('DL', 'NZ', 'Delhi NCR', 'New Delhi'),
    ('PB', 'NZ', 'Punjab', 'Chandigarh'),
    ('HR', 'NZ', 'Haryana', 'Chandigarh'),
    ('UP', 'NZ', 'Uttar Pradesh', 'Lucknow'),
    ('UK', 'NZ', 'Uttarakhand', 'Dehradun'),
    ('MH', 'WZ', 'Maharashtra', 'Mumbai'),
    ('GJ', 'WZ', 'Gujarat', 'Gandhinagar'),
    ('RJ', 'WZ', 'Rajasthan', 'Jaipur'),
    ('GA', 'WZ', 'Goa', 'Panaji'),
    ('WB', 'EZ', 'West Bengal', 'Kolkata'),
    ('OR', 'EZ', 'Odisha', 'Bhubaneswar'),
    ('JH', 'EZ', 'Jharkhand', 'Ranchi'),
    ('AS', 'EZ', 'Assam', 'Dispur')
ON CONFLICT (code) DO NOTHING;

-- 9. Create Indexes for High Performance Search & Governance Queries
CREATE INDEX IF NOT EXISTS idx_geo_states_zone ON public.geo_states(zone_code);
CREATE INDEX IF NOT EXISTS idx_geo_districts_state ON public.geo_districts(state_code);
CREATE INDEX IF NOT EXISTS idx_geo_cooperatives_district ON public.geo_cooperatives(district_code);
CREATE INDEX IF NOT EXISTS idx_admin_accounts_email ON public.admin_accounts(email);
CREATE INDEX IF NOT EXISTS idx_admin_accounts_code ON public.admin_accounts(admin_code);
CREATE INDEX IF NOT EXISTS idx_admin_scopes_admin ON public.admin_scopes(admin_id, level);
CREATE INDEX IF NOT EXISTS idx_admin_enforcement_target ON public.admin_enforcement_actions(target_admin_id);

-- 10. Enable Row Level Security (RLS) & Scope Policies
ALTER TABLE public.geo_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geo_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geo_districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geo_cooperatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_enforcement_actions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Public read geo_zones" ON public.geo_zones;
    CREATE POLICY "Public read geo_zones" ON public.geo_zones FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public read geo_states" ON public.geo_states;
    CREATE POLICY "Public read geo_states" ON public.geo_states FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public read geo_districts" ON public.geo_districts;
    CREATE POLICY "Public read geo_districts" ON public.geo_districts FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public read geo_cooperatives" ON public.geo_cooperatives;
    CREATE POLICY "Public read geo_cooperatives" ON public.geo_cooperatives FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Full access admin_accounts" ON public.admin_accounts;
    CREATE POLICY "Full access admin_accounts" ON public.admin_accounts FOR ALL USING (true);

    DROP POLICY IF EXISTS "Full access admin_scopes" ON public.admin_scopes;
    CREATE POLICY "Full access admin_scopes" ON public.admin_scopes FOR ALL USING (true);

    DROP POLICY IF EXISTS "Full access admin_enforcement" ON public.admin_enforcement_actions;
    CREATE POLICY "Full access admin_enforcement" ON public.admin_enforcement_actions FOR ALL USING (true);
END $$;
