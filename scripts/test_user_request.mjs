import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testFetchUserRequest() {
  const reqId = 'f5435222-7b1b-4da2-85d3-80ce5b717dd9';
  console.log("Fetching request:", reqId);

  const { data, error } = await supabase
    .from('service_requests')
    .select(`
      *,
      services (id, name_translations),
      sub_services (id, name_translations)
    `)
    .eq('id', reqId)
    .maybeSingle();

  console.log("Result:", data, error);
}

testFetchUserRequest();
