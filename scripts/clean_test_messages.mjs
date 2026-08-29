import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function cleanTestMessages() {
  const { data: msgs } = await supabase.from('messages').select('*');
  console.log("Existing messages in DB:", msgs?.length);
  msgs?.forEach(m => console.log(`ID: ${m.id} | booking_id: ${m.booking_id} | message: ${m.message}`));

  // Clean test messages that don't belong to actual bookings or have null booking_id
  const { error: delErr } = await supabase
    .from('messages')
    .delete()
    .is('booking_id', null);
  
  console.log("Deleted null booking_id messages, error:", delErr);
}

cleanTestMessages();
