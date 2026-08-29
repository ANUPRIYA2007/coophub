import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function inspectPillarAndOrders() {
  console.log("Checking Leo's pillar profile...");
  const { data: pillars } = await supabase
    .from('pillar_profiles')
    .select('id, user_id, full_name, pillar_code, main_services, status');
  console.log("Pillars:", pillars);

  const { data: sReqs } = await supabase
    .from('service_requests')
    .select('*')
    .order('created_at', { ascending: false });
  console.log("Service Requests count:", sReqs?.length);
  if (sReqs?.length > 0) {
    console.log("Latest Request:", sReqs[0]);
  }
}

inspectPillarAndOrders();
