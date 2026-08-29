import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://aqzkzaswckfoazpqeeti.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxemt6YXN3Y2tmb2F6cHFlZXRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3MzQ0MTcsImV4cCI6MjEwMzMxMDQxN30.i12_jN5wynPCnCpoh-0AO66Zi1fp1Mea-Do-mpzP8yw";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testPillarLogin() {
  const pillarId = "PIL-CHE-043";
  const password = "Test@12345";

  console.log("1. Looking up pillar by code:", pillarId);
  const { data: pillarMatch, error: matchErr } = await supabase
    .from("pillar_profiles")
    .select("id, email, status, pillar_code, full_name")
    .or(`pillar_code.eq.${pillarId},mobile.eq.${pillarId}`)
    .maybeSingle();

  console.log("Pillar match result:", { pillarMatch, matchErr });

  if (pillarMatch?.email) {
    console.log("2. Attempting signInWithPassword for resolved email:", pillarMatch.email);
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email: pillarMatch.email,
      password: password
    });

    console.log("Auth result:", {
      user: authData?.user?.email,
      session: !!authData?.session,
      error: authErr?.message
    });
  }
}

testPillarLogin();
