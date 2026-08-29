import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://aqzkzaswckfoazpqeeti.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxemt6YXN3Y2tmb2F6cHFlZXRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3MzQ0MTcsImV4cCI6MjEwMzMxMDQxN30.i12_jN5wynPCnCpoh-0AO66Zi1fp1Mea-Do-mpzP8yw";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testApprove() {
  const pillarId = "df2604a2-a1de-45a9-92ac-da0d61da3434";
  console.log("Checking pillar:", pillarId);
  const { data: pillar, error: fetchErr } = await supabase
    .from('pillar_profiles')
    .select('*')
    .eq('id', pillarId)
    .single();

  if (fetchErr) {
    console.error("Fetch error:", fetchErr);
    return;
  }
  console.log("Current pillar profile:", {
    id: pillar.id,
    full_name: pillar.full_name,
    status: pillar.status,
    pillar_code: pillar.pillar_code,
    verification_status: pillar.verification_status
  });

  // Try updating with status 'verified' and pillar_code
  const testCode = "PIL-CHE-043";
  const { data: updateData, error: updateErr } = await supabase
    .from('pillar_profiles')
    .update({
      status: 'verified',
      pillar_code: testCode,
      is_available: true
    })
    .eq('id', pillarId)
    .select();

  console.log("Update result:", { updateData, updateErr });
}

testApprove();
