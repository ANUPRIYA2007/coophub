import fs from 'fs';
import { PILLARS_ROSTER } from '../src/data/pillarsRoster.js';

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function escapeArray(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return "'{}'::text[]";
  const inner = arr.map(item => `"${String(item).replace(/"/g, '\\"')}"`).join(',');
  return `'${inner}'::text[]`;
}

let sql = `-- ==============================================================================
-- COOP HUB: 80 Dedicated Certified Pillars Master Seed Script
-- 1 Dedicated Specialist per Sub-Service across all 16 Main Services
-- Run this script in the Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------------------------
-- 1. Insert/Sync Pillars into auth.users (Credentials: email / Pillar@2026!)
-- ------------------------------------------------------------------------------
`;

for (const p of PILLARS_ROSTER) {
  const meta = JSON.stringify({
    full_name: p.full_name,
    role: 'pillar',
    pillar_code: p.pillar_code,
    phone: p.mobile
  });

  sql += `
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  ${escapeSql(p.id)},
  'authenticated',
  'authenticated',
  ${escapeSql(p.email)},
  crypt(${escapeSql(p.password)}, gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  ${escapeSql(meta)}::jsonb,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = NOW(),
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = NOW();
`;
}

sql += `
-- Ensure all @coophub.in emails are confirmed
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email LIKE '%@coophub.in' AND email_confirmed_at IS NULL;

-- ------------------------------------------------------------------------------
-- 2. Insert/Upsert Pillars into public.pillar_profiles
-- ------------------------------------------------------------------------------
`;

for (const p of PILLARS_ROSTER) {
  const serviceArea = p.service_area || [p.area, 'Chennai Metro'];
  
  sql += `
INSERT INTO public.pillar_profiles (
  id,
  pillar_id,
  pillar_code,
  full_name,
  email,
  mobile,
  main_services,
  sub_services,
  custom_role,
  area,
  pincode,
  service_area,
  avatar_url,
  rating,
  total_completed_jobs,
  experience_years,
  status,
  verification_status,
  authoritative_verified,
  is_available,
  emergency_available,
  emergency_ready,
  current_lat,
  current_lng,
  lat,
  lng,
  gps_last_updated_at,
  updated_at
) VALUES (
  ${escapeSql(p.id)},
  ${escapeSql(p.pillar_code)},
  ${escapeSql(p.pillar_code)},
  ${escapeSql(p.full_name)},
  ${escapeSql(p.email)},
  ${escapeSql(p.mobile)},
  ${escapeArray(p.main_services)},
  ${escapeArray(p.sub_services)},
  ${escapeSql(p.custom_role)},
  ${escapeSql(p.area)},
  ${escapeSql(p.pincode)},
  ${escapeArray(serviceArea)},
  ${escapeSql(p.avatar_url)},
  ${p.rating || 4.9},
  ${p.completed_jobs || 45},
  ${escapeSql(String(p.experience_years || '5'))},
  'verified',
  'verified',
  true,
  true,
  true,
  true,
  ${p.lat},
  ${p.lng},
  ${p.lat},
  ${p.lng},
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  pillar_id = EXCLUDED.pillar_id,
  pillar_code = EXCLUDED.pillar_code,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  mobile = EXCLUDED.mobile,
  main_services = EXCLUDED.main_services,
  sub_services = EXCLUDED.sub_services,
  custom_role = EXCLUDED.custom_role,
  area = EXCLUDED.area,
  pincode = EXCLUDED.pincode,
  service_area = EXCLUDED.service_area,
  avatar_url = EXCLUDED.avatar_url,
  rating = EXCLUDED.rating,
  total_completed_jobs = EXCLUDED.total_completed_jobs,
  experience_years = EXCLUDED.experience_years,
  status = 'verified',
  verification_status = 'verified',
  authoritative_verified = true,
  is_available = true,
  emergency_available = true,
  emergency_ready = true,
  current_lat = EXCLUDED.current_lat,
  current_lng = EXCLUDED.current_lng,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  gps_last_updated_at = NOW(),
  updated_at = NOW();
`;
}

sql += `
-- Summary Verification Query
SELECT count(*) as total_pillars_count, count(DISTINCT id) as unique_pillars FROM public.pillar_profiles;
`;

fs.writeFileSync('supabase_seed_80_pillars.sql', sql, 'utf-8');
console.log('Successfully generated supabase_seed_80_pillars.sql with', PILLARS_ROSTER.length, 'pillars!');
