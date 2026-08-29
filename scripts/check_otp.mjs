import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkOtpInDb() {
  const { data, error } = await supabase
    .from('service_requests')
    .select('*')
    .limit(1);

  console.log("Service requests columns:", Object.keys(data?.[0] || {}));
  console.log("Sample row:", data?.[0]);
}

checkOtpInDb();
