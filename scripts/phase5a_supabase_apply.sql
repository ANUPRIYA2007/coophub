-- ============================================================================
-- PHASE 5A: Apply directly in Supabase Dashboard > SQL Editor
-- Run this ONCE to complete the 36-state/UT geographic foundation
-- ============================================================================

-- Step 1: Add type, status, updated_at columns to geo_states
ALTER TABLE public.geo_states ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'STATE';
ALTER TABLE public.geo_states ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.geo_states ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.geo_zones ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.geo_zones ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Step 2: Update existing 18 records with correct types
UPDATE public.geo_states SET type = 'STATE' WHERE code IN ('TN','KL','KA','AP','TS','PB','HR','UP','UK','MH','GJ','GA','WB','OR','JH','AS');
UPDATE public.geo_states SET type = 'UNION_TERRITORY', name = 'Delhi' WHERE code = 'DL';
-- Move Rajasthan from West to North (per spec)
UPDATE public.geo_states SET zone_code = 'NZ', type = 'STATE' WHERE code = 'RJ';

-- Step 3: Insert 18 new records (completes 36 total)
INSERT INTO public.geo_states (code, zone_code, name, capital, type, status) VALUES
  -- South UTs
  ('AN','SZ','Andaman and Nicobar Islands','Port Blair','UNION_TERRITORY','active'),
  ('LD','SZ','Lakshadweep','Kavaratti','UNION_TERRITORY','active'),
  ('PY','SZ','Puducherry','Puducherry','UNION_TERRITORY','active'),
  -- North States
  ('BR','NZ','Bihar','Patna','STATE','active'),
  ('HP','NZ','Himachal Pradesh','Shimla','STATE','active'),
  -- North UTs
  ('CH','NZ','Chandigarh','Chandigarh','UNION_TERRITORY','active'),
  ('JK','NZ','Jammu and Kashmir','Srinagar / Jammu','UNION_TERRITORY','active'),
  ('LA','NZ','Ladakh','Leh','UNION_TERRITORY','active'),
  -- West States
  ('CG','WZ','Chhattisgarh','Raipur','STATE','active'),
  ('MP','WZ','Madhya Pradesh','Bhopal','STATE','active'),
  -- West UT
  ('DD','WZ','Dadra and Nagar Haveli and Daman and Diu','Daman','UNION_TERRITORY','active'),
  -- East States
  ('AR','EZ','Arunachal Pradesh','Itanagar','STATE','active'),
  ('MN','EZ','Manipur','Imphal','STATE','active'),
  ('ML','EZ','Meghalaya','Shillong','STATE','active'),
  ('MZ','EZ','Mizoram','Aizawl','STATE','active'),
  ('NL','EZ','Nagaland','Kohima','STATE','active'),
  ('SK','EZ','Sikkim','Gangtok','STATE','active'),
  ('TR','EZ','Tripura','Agartala','STATE','active')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name, capital = EXCLUDED.capital,
  type = EXCLUDED.type, status = EXCLUDED.status, zone_code = EXCLUDED.zone_code,
  updated_at = NOW();

-- Step 4: Add search index
CREATE INDEX IF NOT EXISTS idx_geo_states_type ON public.geo_states(type);
CREATE INDEX IF NOT EXISTS idx_geo_states_status ON public.geo_states(status);

-- Step 5: Verification
DO $$
DECLARE v_states INT; v_uts INT; v_total INT;
BEGIN
  SELECT COUNT(*) INTO v_states FROM geo_states WHERE type = 'STATE';
  SELECT COUNT(*) INTO v_uts FROM geo_states WHERE type = 'UNION_TERRITORY';
  SELECT COUNT(*) INTO v_total FROM geo_states;
  RAISE NOTICE 'States: %, UTs: %, Total: %', v_states, v_uts, v_total;
  IF v_total <> 36 THEN RAISE WARNING 'Expected 36, got %', v_total; END IF;
END $$;
