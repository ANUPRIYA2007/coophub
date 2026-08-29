import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkSchema() {
  console.log("Checking profiles table...");
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('*')
    .limit(10);
  console.log("Profiles count:", profiles?.length, "Error:", pErr);
  if (profiles && profiles.length > 0) {
    console.log("Sample profile:", profiles[0]);
  }

  console.log("\nChecking bookings / service requests tables...");
  const { data: bookings, error: bErr } = await supabase.from('bookings').select('*').limit(5);
  console.log("Bookings count:", bookings?.length, "Error:", bErr);

  const { data: requests, error: rErr } = await supabase.from('service_requests').select('*').limit(5);
  console.log("Service requests count:", requests?.length, "Error:", rErr);

  const { data: custRequests, error: crErr } = await supabase.from('customer_requests').select('*').limit(5);
  console.log("Customer requests count:", custRequests?.length, "Error:", crErr);
}

checkSchema();
