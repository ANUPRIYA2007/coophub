import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://aqzkzaswckfoazpqeeti.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxemt6YXN3Y2tmb2F6cHFlZXRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3MzQ0MTcsImV4cCI6MjEwMzMxMDQxN30.i12_jN5wynPCnCpoh-0AO66Zi1fp1Mea-Do-mpzP8yw";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testApproveLeo() {
  const pillarId = "b9031b2a-6048-479a-a600-50c871e14f24";
  console.log("Checking Leo profile:", pillarId);
  const { data: pillar, error } = await supabase
    .from('pillar_profiles')
    .select('*')
    .eq('id', pillarId)
    .single();

  console.log("Pillar data:", { pillar, error });

  if (pillar) {
    console.log("Testing update to status verified...");
    const { data: updateRes, error: updateErr } = await supabase
      .from('pillar_profiles')
      .update({
        status: 'verified',
        verification_status: 'verified',
        pillar_code: 'PIL-CHE-044',
        is_available: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', pillarId)
      .select()
      .single();

    console.log("Update result:", { updateRes, updateErr });
  }
}

testApproveLeo();
