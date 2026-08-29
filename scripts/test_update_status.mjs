import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testUpdateStatus() {
  const { data, error } = await supabase
    .from('service_requests')
    .update({ status: 'arrived' })
    .eq('id', 'f5435222-7b1b-4da2-85d3-80ce5b717dd9')
    .select();

  console.log("Update status result:", data, "Error:", error);
}

testUpdateStatus();
