import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function simulateOrderLifecycle() {
    const requestId = "REQ-8890";
    console.log(`Starting lifecycle simulation for ${requestId}`);
    
    // 1. Set to in_progress
    console.log("Setting to in_progress...");
    await supabase.from('service_requests').update({ status: 'in_progress' }).eq('id', requestId);
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // 2. Set to completed (Triggers "Service Completed" animation and Payment Pending)
    console.log("Setting to completed...");
    await supabase.from('service_requests').update({ status: 'completed' }).eq('id', requestId);
    
    // Also ensure invoice exists and is pending
    const { data: inv } = await supabase.from('invoices').select('id').eq('request_id', requestId).single();
    if (inv) {
        await supabase.from('invoices').update({ invoice_status: 'pending' }).eq('id', inv.id);
    }
    
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // 3. Set invoice to paid (Triggers "Payment Collected" and Finally Completed)
    console.log("Simulating Razorpay payment success (Invoice -> paid)...");
    if (inv) {
        await supabase.from('invoices').update({ invoice_status: 'paid' }).eq('id', inv.id);
    }
    
    console.log("Simulation finished.");
}

simulateOrderLifecycle().catch(console.error);
