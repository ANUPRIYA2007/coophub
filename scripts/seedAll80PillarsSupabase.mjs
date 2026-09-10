import { createClient } from '@supabase/supabase-js';
import { PILLARS_ROSTER } from '../src/data/pillarsRoster.js';

const SUPABASE_URL = 'https://aqzkzaswckfoazpqeeti.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxemt6YXN3Y2tmb2F6cHFlZXRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3MzQ0MTcsImV4cCI6MjEwMzMxMDQxN30.i12_jN5wynPCnCpoh-0AO66Zi1fp1Mea-Do-mpzP8yw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function seedAllPillars() {
  console.log(`=======================================================`);
  console.log(`Syncing All ${PILLARS_ROSTER.length} Pillars with Supabase Database`);
  console.log(`=======================================================`);

  // 1. Fetch all existing profiles
  const { data: existingProfiles } = await supabase
    .from('pillar_profiles')
    .select('id, email, pillar_code');

  const existingMap = new Map();
  if (Array.isArray(existingProfiles)) {
    for (const p of existingProfiles) {
      if (p.pillar_code) existingMap.set(p.pillar_code.toUpperCase(), p.id);
      if (p.email) existingMap.set(p.email.toLowerCase(), p.id);
    }
  }

  console.log(`Existing profiles in DB: ${existingProfiles?.length || 0}`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < PILLARS_ROSTER.length; i++) {
    const pillar = PILLARS_ROSTER[i];
    const index = i + 1;
    const codeKey = pillar.pillar_code.toUpperCase();
    const emailKey = pillar.email.toLowerCase();

    let authUserId = existingMap.get(codeKey) || existingMap.get(emailKey);

    try {
      // If not yet in existingMap, call signUp to obtain or generate auth ID
      if (!authUserId) {
        let attempts = 0;
        while (attempts < 3 && !authUserId) {
          attempts++;
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: pillar.email,
            password: pillar.password,
            options: {
              data: {
                full_name: pillar.full_name,
                role: 'pillar',
                pillar_code: pillar.pillar_code
              }
            }
          });

          if (authData?.user?.id) {
            authUserId = authData.user.id;
          } else if (authError?.message?.toLowerCase().includes('rate limit')) {
            console.warn(`[${index}/${PILLARS_ROSTER.length}] Rate limit reached. Backing off 8 seconds...`);
            await sleep(8000);
          } else {
            console.warn(`[${index}/${PILLARS_ROSTER.length}] Auth note for ${pillar.pillar_code}:`, authError?.message);
            await sleep(2000);
          }
        }
      }

      if (!authUserId) {
        console.error(`[${index}/${PILLARS_ROSTER.length}] ❌ Failed to get Auth ID for ${pillar.pillar_code} (${pillar.email})`);
        errorCount++;
        continue;
      }

      // Upsert profile
      const profilePayload = {
        id: authUserId,
        pillar_id: pillar.pillar_code,
        pillar_code: pillar.pillar_code,
        full_name: pillar.full_name,
        email: pillar.email,
        mobile: pillar.mobile,
        main_services: pillar.main_services,
        sub_services: pillar.sub_services,
        custom_role: pillar.custom_role,
        area: pillar.area,
        pincode: pillar.pincode,
        service_area: pillar.service_area || [pillar.area, 'Chennai Metro'],
        avatar_url: pillar.avatar_url,
        rating: pillar.rating || 4.9,
        total_completed_jobs: pillar.completed_jobs || 45,
        experience_years: String(pillar.experience_years || '5'),
        status: 'verified',
        verification_status: 'verified',
        authoritative_verified: true,
        is_available: true,
        emergency_available: true,
        emergency_ready: true,
        lat: pillar.lat,
        lng: pillar.lng,
        current_lat: pillar.current_lat || pillar.lat,
        current_lng: pillar.current_lng || pillar.lng,
        gps_last_updated_at: new Date().toISOString()
      };

      const { error: profileErr } = await supabase
        .from('pillar_profiles')
        .upsert(profilePayload, { onConflict: 'id' });

      if (profileErr) {
        console.error(`[${index}/${PILLARS_ROSTER.length}] ❌ Upsert error for ${pillar.pillar_code}:`, profileErr.message);
        errorCount++;
      } else {
        console.log(`[${index}/${PILLARS_ROSTER.length}] ✅ OK: ${pillar.pillar_code} | ${pillar.full_name} | ${pillar.sub_services[0]} (${pillar.area})`);
        successCount++;
        existingMap.set(codeKey, authUserId);
        existingMap.set(emailKey, authUserId);
      }

      // 800ms pacing
      await sleep(800);

    } catch (err) {
      console.error(`[${index}/${PILLARS_ROSTER.length}] ❌ Exception for ${pillar.pillar_code}:`, err.message);
      errorCount++;
    }
  }

  console.log(`=======================================================`);
  console.log(`Seeding Finished: ${successCount} Successful, ${errorCount} Errors`);
  const { count } = await supabase.from('pillar_profiles').select('*', { count: 'exact', head: true });
  console.log(`Current total pillar_profiles in Supabase database: ${count}`);
  console.log(`=======================================================`);
}

seedAllPillars().catch(console.error);
