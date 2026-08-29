import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testQuery() {
  const { data: sReqs, error: sErr } = await supabase
    .from("service_requests")
    .select(`
      *,
      services (id, name, category, name_translations),
      sub_services (id, name, base_price, name_translations)
    `)
    .order("created_at", { ascending: false });

  console.log("Service requests query:", sReqs?.length, "records. Error:", sErr);
  if (sReqs) {
    sReqs.forEach(r => {
      console.log(`- Request #${r.id.slice(0, 8)} | Service: ${r.services?.name} | Sub: ${r.sub_services?.name} | Status: ${r.status}`);
    });
  }
}

testQuery();
