import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

import { chronosForecastService } from './src/services/ai/chronosForecastService.js';
import { workforceAllocationEngine } from './src/services/ai/workforceAllocationEngine.js';

async function verifyAIPipeline() {
    console.log("=== AI DEMAND FORECASTING & ALLOCATION PIPELINE VERIFICATION ===");
    console.log("1. FETCHING HISTORICAL DATA (Supabase -> chronosForecastService)");
    
    const records = await chronosForecastService.getHistoricalBookings({ horizon: '24h' });
    console.log(`- Retrieved ${records.length} valid historical records from Supabase.`);
    
    if (records.length === 0) {
        console.log("No historical data to test. The system will correctly fallback to zero predictions.");
        return;
    }
    
    const timeSeries = chronosForecastService.prepareTimeSeriesBuckets(records, '24h');
    console.log(`- Generated ${timeSeries.length} time-series buckets.`);

    console.log("\n2. EXECUTING CHRONOS INFERENCE (chronosForecastService -> ACTUAL MODEL)");
    const forecastResult = await chronosForecastService.runChronosInference(timeSeries, '24h');
    
    console.log(`- SUCCESS: ${forecastResult.success}`);
    console.log(`- ACTUAL FORECAST PROVIDER/MODEL: ${forecastResult.model}`);
    console.log(`- STATUS: ${forecastResult.status}`);
    
    // Calculate shortage to see if surge bonus gets activated
    const shortageResult = await chronosForecastService.calculateWorkforceShortage(forecastResult);
    console.log(`\n3. SHORTAGE DETECTION`);
    console.log(`- Detected Shortage: ${shortageResult.shortageCount} (Severity: ${shortageResult.severity})`);

    console.log("\n4. WORKFORCE ALLOCATION (workforceAllocationEngine -> Assignment Decision)");
    // Fetch a pending booking to test allocation
    const { data: pendingBookings } = await supabase
        .from('bookings')
        .select('*')
        .or('status.eq.pending,pillar_id.is.null')
        .limit(1);

    if (!pendingBookings || pendingBookings.length === 0) {
        console.log("No pending bookings to run allocation against. Creating a mock request.");
    }
    
    const targetBooking = pendingBookings?.[0] || {
        id: "TEST-123",
        service_name: "Electrician",
        service_address: "Adyar",
        lat: 13.0012, lng: 80.2565,
        is_shortage_zone: shortageResult.severity === 'critical',
        shortage_severity: shortageResult.severity
    };

    console.log(`- Target Booking: ${targetBooking.service_name} at ${targetBooking.service_address}`);
    console.log(`- Booking Shortage Status Fed to Engine: ${targetBooking.is_shortage_zone || false}`);

    const { eligible, approvedCerts } = await workforceAllocationEngine.getEligibleCandidates(targetBooking);
    console.log(`- Eligible Candidates Found: ${eligible.length}`);
    
    if (eligible.length > 0) {
        const scored = eligible.map(p => workforceAllocationEngine.scoreCandidate(p, targetBooking, approvedCerts))
                               .sort((a, b) => b.score - a.score);
                               
        const top = scored[0];
        console.log(`\n5. ACTUAL PILLAR ASSIGNMENT DECISION`);
        console.log(`- WINNING CANDIDATE: ${top.full_name} (${top.pillar_code})`);
        console.log(`- TOTAL SCORE: ${top.score}/100`);
        console.log(`- REASONS (PROVING SURGE INCLUSION):`);
        top.reasons.forEach(r => console.log(`  * ${r}`));
    }
}

verifyAIPipeline().catch(console.error);
