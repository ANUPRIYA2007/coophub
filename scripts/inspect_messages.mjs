import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testMessagesOnServiceRequest() {
  const reqId = '3ec653c4-08c5-493a-89aa-d25774fbb0f5';

  // Test inserting with booking_id: null, or with booking_id
  const res1 = await supabase.from('messages').insert({
    booking_id: null,
    sender_type: 'customer',
    message: 'Hello from customer for request ' + reqId
  }).select();

  console.log("Insert message (booking_id: null):", res1);
}

testMessagesOnServiceRequest();
