-- ============================================================================
-- COOP HUB SUPER ADMIN V2 — PHASE 5A: ALL-INDIA 36 STATE/UT EXPANSION
-- Migration: 31_geography_36_states_expansion.sql
-- Expands geo_states from 18-state (old) to complete 36 State/UT foundation
-- Adds: type column (STATE | UNION_TERRITORY), status column, updated_at
-- ============================================================================

-- 1. Add missing columns to geo_states
ALTER TABLE public.geo_states ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'STATE'
    CHECK (type IN ('STATE', 'UNION_TERRITORY'));
ALTER TABLE public.geo_states ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'provisioning'));
ALTER TABLE public.geo_states ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Add updated_at to geo_zones if missing
ALTER TABLE public.geo_zones ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.geo_zones ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'inactive'));

-- 3. Update existing 18 seeded records with correct type and fix any name issues

-- South Zone existing records — all States
UPDATE public.geo_states SET type = 'STATE', status = 'active', updated_at = NOW()
    WHERE code IN ('TN', 'KL', 'KA', 'AP', 'TS');

-- North Zone existing records
-- DL was seeded as "Delhi NCR" — correct name is "Delhi"
UPDATE public.geo_states SET name = 'Delhi', type = 'UNION_TERRITORY', status = 'active', updated_at = NOW()
    WHERE code = 'DL';
UPDATE public.geo_states SET type = 'STATE', status = 'active', updated_at = NOW()
    WHERE code IN ('PB', 'HR', 'UP', 'UK');

-- West Zone existing records — RJ (Rajasthan) was incorrectly placed in West; spec puts it in North
-- We UPDATE zone assignment for RJ to NZ per the authoritative COOP HUB operational spec
UPDATE public.geo_states SET zone_code = 'NZ', type = 'STATE', status = 'active', updated_at = NOW()
    WHERE code = 'RJ';
-- MH, GJ, GA are West States
UPDATE public.geo_states SET type = 'STATE', status = 'active', updated_at = NOW()
    WHERE code IN ('MH', 'GJ', 'GA');

-- East Zone existing records — all States
UPDATE public.geo_states SET type = 'STATE', status = 'active', updated_at = NOW()
    WHERE code IN ('WB', 'OR', 'JH', 'AS');

-- 4. Insert the remaining 18 State/UT units to complete the 36-unit foundation

INSERT INTO public.geo_states (code, zone_code, name, capital, type, status) VALUES

    -- ── SOUTH ZONE ── 3 Union Territories
    ('AN', 'SZ', 'Andaman and Nicobar Islands', 'Port Blair', 'UNION_TERRITORY', 'active'),
    ('LD', 'SZ', 'Lakshadweep', 'Kavaratti', 'UNION_TERRITORY', 'active'),
    ('PY', 'SZ', 'Puducherry', 'Puducherry', 'UNION_TERRITORY', 'active'),

    -- ── NORTH ZONE ── 4 additional States
    ('BR', 'NZ', 'Bihar', 'Patna', 'STATE', 'active'),
    ('HP', 'NZ', 'Himachal Pradesh', 'Shimla', 'STATE', 'active'),

    -- ── NORTH ZONE ── 3 additional Union Territories
    ('CH', 'NZ', 'Chandigarh', 'Chandigarh', 'UNION_TERRITORY', 'active'),
    ('JK', 'NZ', 'Jammu and Kashmir', 'Srinagar / Jammu', 'UNION_TERRITORY', 'active'),
    ('LA', 'NZ', 'Ladakh', 'Leh', 'UNION_TERRITORY', 'active'),

    -- ── WEST ZONE ── 2 additional States
    ('CG', 'WZ', 'Chhattisgarh', 'Raipur', 'STATE', 'active'),
    ('MP', 'WZ', 'Madhya Pradesh', 'Bhopal', 'STATE', 'active'),

    -- ── WEST ZONE ── 1 Union Territory
    ('DD', 'WZ', 'Dadra and Nagar Haveli and Daman and Diu', 'Daman', 'UNION_TERRITORY', 'active'),

    -- ── EAST ZONE ── 7 additional States
    ('AR', 'EZ', 'Arunachal Pradesh', 'Itanagar', 'STATE', 'active'),
    ('MN', 'EZ', 'Manipur', 'Imphal', 'STATE', 'active'),
    ('ML', 'EZ', 'Meghalaya', 'Shillong', 'STATE', 'active'),
    ('MZ', 'EZ', 'Mizoram', 'Aizawl', 'STATE', 'active'),
    ('NL', 'EZ', 'Nagaland', 'Kohima', 'STATE', 'active'),
    ('SK', 'EZ', 'Sikkim', 'Gangtok', 'STATE', 'active'),
    ('TR', 'EZ', 'Tripura', 'Agartala', 'STATE', 'active')

ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    capital = EXCLUDED.capital,
    type = EXCLUDED.type,
    status = EXCLUDED.status,
    updated_at = NOW();

-- 5. Add full-text search index for geography search
CREATE INDEX IF NOT EXISTS idx_geo_states_name_search ON public.geo_states USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_geo_states_type ON public.geo_states(type);
CREATE INDEX IF NOT EXISTS idx_geo_states_status ON public.geo_states(status);
CREATE INDEX IF NOT EXISTS idx_geo_zones_status ON public.geo_zones(status);

-- 6. Verify counts (informational, will appear in migration logs)
DO $$
DECLARE
    v_total_zones INT;
    v_total_states INT;
    v_total_uts INT;
    v_total_units INT;
BEGIN
    SELECT COUNT(*) INTO v_total_zones FROM public.geo_zones;
    SELECT COUNT(*) INTO v_total_states FROM public.geo_states WHERE type = 'STATE';
    SELECT COUNT(*) INTO v_total_uts FROM public.geo_states WHERE type = 'UNION_TERRITORY';
    SELECT COUNT(*) INTO v_total_units FROM public.geo_states;

    RAISE NOTICE '=== Phase 5A Geography Foundation ===';
    RAISE NOTICE 'Total Zones: %', v_total_zones;
    RAISE NOTICE 'Total States: %', v_total_states;
    RAISE NOTICE 'Total Union Territories: %', v_total_uts;
    RAISE NOTICE 'Total State/UT Units: %', v_total_units;

    IF v_total_zones <> 4 THEN
        RAISE WARNING 'Expected 4 zones, got %', v_total_zones;
    END IF;
    IF v_total_units <> 36 THEN
        RAISE WARNING 'Expected 36 State/UT units, got %', v_total_units;
    END IF;
END $$;
