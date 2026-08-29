import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkNotifications() {
  const { data, error } = await supabase.from('notifications').select('*').limit(10);
  console.log("Notifications error:", error);
  console.log("Notifications count:", data?.length);
  console.log("Sample notification row:", data?.[0]);
  data?.forEach(n => console.log("Row:", n));
}

checkNotifications();
