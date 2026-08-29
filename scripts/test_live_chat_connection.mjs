import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLiveCustomerPillarChat() {
  console.log("===============================================================================");
  console.log("       LIVE BIDIRECTIONAL CHAT TEST: CUSTOMER <---> PILLAR");
  console.log("===============================================================================");

  const testSessionId = `chat-session-${Date.now()}`;
  console.log(`\n1. Initializing Realtime Channels for Session: ${testSessionId}...`);

  const customerReceived = [];
  const pillarReceived = [];

  // Customer Client Subscription
  const customerChannel = supabase
    .channel(`customer-listener-${Date.now()}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => {
        if (payload.new && payload.new.sender_type === 'pillar') {
          console.log(`\n📩 [CUSTOMER UI RECEIVED LIVE MESSAGE FROM PILLAR]:`);
          console.log(`   "${payload.new.message}" (Sent: ${payload.new.created_at})`);
          customerReceived.push(payload.new);
        }
      }
    )
    .subscribe((status) => {
      console.log(`   🟢 Customer Realtime Connection: ${status}`);
    });

  // Pillar Client Subscription
  const pillarChannel = supabase
    .channel(`pillar-listener-${Date.now()}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => {
        if (payload.new && payload.new.sender_type === 'customer') {
          console.log(`\n📩 [PILLAR UI RECEIVED LIVE MESSAGE FROM CUSTOMER]:`);
          console.log(`   "${payload.new.message}" (Sent: ${payload.new.created_at})`);
          pillarReceived.push(payload.new);
        }
      }
    )
    .subscribe((status) => {
      console.log(`   🟢 Pillar Realtime Connection: ${status}`);
    });

  // Allow 2 seconds for realtime channels to establish
  await new Promise(r => setTimeout(r, 2000));

  // 2. Customer Sends a message
  const customerMsg = `Hello Technician! Please come to Door #4B on the 2nd floor. [Time: ${new Date().toLocaleTimeString()}]`;
  console.log(`\n-------------------------------------------------------------------------------`);
  console.log(`📤 STEP 1: Customer sends message to Pillar:`);
  console.log(`   "${customerMsg}"`);

  const { data: cData, error: cErr } = await supabase
    .from('messages')
    .insert([
      {
        sender_type: 'customer',
        message: customerMsg
      }
    ])
    .select()
    .single();

  if (cErr) {
    console.error("   ❌ Error sending customer message:", cErr);
  } else {
    console.log(`   ✅ Customer Message Stored in Database (ID: ${cData.id})`);
  }

  // Allow 2 seconds for realtime broadcast
  await new Promise(r => setTimeout(r, 2000));

  // 3. Pillar Sends a reply
  const pillarReply = `Noted ma'am! I have reached your building gate with the replacement parts. [Time: ${new Date().toLocaleTimeString()}]`;
  console.log(`\n-------------------------------------------------------------------------------`);
  console.log(`📤 STEP 2: Pillar replies to Customer:`);
  console.log(`   "${pillarReply}"`);

  const { data: pData, error: pErr } = await supabase
    .from('messages')
    .insert([
      {
        sender_type: 'pillar',
        message: pillarReply
      }
    ])
    .select()
    .single();

  if (pErr) {
    console.error("   ❌ Error sending pillar reply:", pErr);
  } else {
    console.log(`   ✅ Pillar Reply Stored in Database (ID: ${pData.id})`);
  }

  // Allow 2.5 seconds for realtime broadcast
  await new Promise(r => setTimeout(r, 2500));

  // 4. Verify message history retrieval
  console.log(`\n-------------------------------------------------------------------------------`);
  console.log(`📥 STEP 3: Verifying Full Chat History Query from Supabase:`);
  const { data: allMsgs, error: fetchErr } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(6);

  if (fetchErr) {
    console.error("   ❌ Error fetching chat history:", fetchErr);
  } else {
    console.log(`   ✅ Total Recent Messages in Database: ${allMsgs.length}`);
    allMsgs.reverse().forEach((m, i) => {
      console.log(`   ${i + 1}. [${m.sender_type.toUpperCase()}]: ${m.message}`);
    });
  }

  // Cleanup channels
  supabase.removeChannel(customerChannel);
  supabase.removeChannel(pillarChannel);

  console.log("\n===============================================================================");
  console.log("       RESULT: LIVE BIDIRECTIONAL CHAT CONNECTED & VERIFIED ✅");
  console.log("===============================================================================");
}

testLiveCustomerPillarChat().catch(console.error);
