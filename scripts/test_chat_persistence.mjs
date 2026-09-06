import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testChat() {
  console.log("=== VERIFYING EXISTING CHAT FIX & DATABASE PERSISTENCE ===");

  // 1. Get an existing service request
  const { data: reqs, error: reqErr } = await supabase
    .from('service_requests')
    .select('id, customer_id, pillar_id')
    .order('created_at', { ascending: false })
    .limit(1);

  if (reqErr || !reqs || reqs.length === 0) {
    console.error("No service request found to test:", reqErr);
    process.exit(1);
  }

  const requestId = reqs[0].id;
  console.log("Using service_request id:", requestId);

  // 2. Set up realtime listener
  let realtimeReceivedCustomer = false;
  let realtimeReceivedPillar = false;

  const channel = supabase
    .channel(`test-chat-${requestId}-${Date.now()}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
      if (!payload.new) return;
      if (payload.new.request_id === requestId) {
        console.log(`⚡ Realtime message received: [${payload.new.sender_type}] "${payload.new.message}"`);
        if (payload.new.sender_type === 'customer') realtimeReceivedCustomer = true;
        if (payload.new.sender_type === 'pillar') realtimeReceivedPillar = true;
      }
    })
    .subscribe();

  // Wait for subscription to establish
  await new Promise(r => setTimeout(r, 1500));

  // 3. Customer sends a message
  const custMsgText = `Customer message test at ${Date.now()}`;
  console.log("Sending customer message:", custMsgText);

  const { data: custInsert, error: custErr } = await supabase
    .from('messages')
    .insert({
      request_id: requestId,
      booking_id: null,
      sender_type: 'customer',
      message: custMsgText,
      content: custMsgText,
      message_type: 'TEXT',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (custErr) {
    console.error("❌ Customer message insert failed:", custErr);
    process.exit(1);
  }
  console.log("✓ Customer message inserted into database with ID:", custInsert.id);

  await new Promise(r => setTimeout(r, 1500));

  // 4. Pillar sends a reply
  const pillarMsgText = `Pillar reply test at ${Date.now()}`;
  console.log("Sending pillar message:", pillarMsgText);

  const { data: pillarInsert, error: pillarErr } = await supabase
    .from('messages')
    .insert({
      request_id: requestId,
      booking_id: null,
      sender_type: 'pillar',
      message: pillarMsgText,
      content: pillarMsgText,
      message_type: 'TEXT',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (pillarErr) {
    console.error("❌ Pillar message insert failed:", pillarErr);
    process.exit(1);
  }
  console.log("✓ Pillar message inserted into database with ID:", pillarInsert.id);

  await new Promise(r => setTimeout(r, 2000));

  // 5. Query messages for this request
  const { data: allMsgs, error: fetchErr } = await supabase
    .from('messages')
    .select('*')
    .or(`request_id.eq.${requestId},booking_id.eq.${requestId}`)
    .order('created_at', { ascending: true });

  console.log("Fetched total messages for request from database:", allMsgs?.length);
  const hasCust = allMsgs?.some(m => m.id === custInsert.id);
  const hasPillar = allMsgs?.some(m => m.id === pillarInsert.id);

  console.log("Customer message persisted in DB:", hasCust ? "PASS" : "FAIL");
  console.log("Pillar message persisted in DB:", hasPillar ? "PASS" : "FAIL");
  console.log("Realtime Customer event received:", realtimeReceivedCustomer ? "PASS" : "FAIL");
  console.log("Realtime Pillar event received:", realtimeReceivedPillar ? "PASS" : "FAIL");

  channel.unsubscribe();

  if (hasCust && hasPillar) {
    console.log("\n>>> ALL CHAT DATABASE PERSISTENCE TESTS PASSED! <<<");
    process.exit(0);
  } else {
    console.error("\n>>> CHAT TESTS FAILED <<<");
    process.exit(1);
  }
}

testChat();
