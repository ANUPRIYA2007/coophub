import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkAllSchemas() {
  const { data: sReq } = await supabase.from('service_requests').select('*').limit(1);
  console.log("service_requests columns:", Object.keys(sReq?.[0] || {}));

  const { data: bData } = await supabase.from('bookings').select('*').limit(1);
  console.log("bookings columns:", Object.keys(bData?.[0] || {}));

  const { data: iData } = await supabase.from('invoices').select('*').limit(1);
  console.log("invoices columns:", Object.keys(iData?.[0] || {}));
}

checkAllSchemas();
