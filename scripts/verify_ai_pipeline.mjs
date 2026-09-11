import { chronosForecastService } from '../src/services/ai/chronosForecastService.js';
import { workforceAllocationEngine } from '../src/services/ai/workforceAllocationEngine.js';
import { matchingService } from '../src/services/ai/matchingService.js';
import { supabase } from '../src/lib/supabase.js';

async function verifyAIPipeline() {
  console.log("\n=======================================================");
  console.log("  COOP HUB: AI DEMAND FORECASTING & WORKER ALLOCATION");
  console.log("  REAL DATA VERIFICATION SCRIPT");
  console.log("=======================================================\n");

  const testParams = {
    area: "BROOKLYN (NYC TEST DATA)",
    service: "Electrician",
    timeRange: "7d"
  };

  try {
    console.log("1. Fetching Historical Service Requests...");
    const historicalRecords = await chronosForecastService.getHistoricalBookings(testParams);
    console.log(`✓ Found ${historicalRecords.length} historical records for ${testParams.service} in ${testParams.area}.`);

    if (historicalRecords.length === 0) {
      console.log("\n⚠️ INSUFFICIENT HISTORICAL DATA: Cannot run real Chronos-2 forecast.");
      console.log("Continuing to test the deterministic fallback & worker recommendation using fallback logic.");
    }

    console.log("\n2. Preparing Time-Series Demand Data...");
    const timeSeries = chronosForecastService.prepareTimeSeriesBuckets(historicalRecords, testParams.timeRange);
    console.log(`✓ Created ${timeSeries.length} time-series buckets.`);

    console.log("\n3. Testing Chronos-2 Forecasting Integration...");
    const forecastResult = await chronosForecastService.getDemandForecast(testParams);
    
    console.log(`✓ Model Used: ${forecastResult.model_used}`);
    console.log(`✓ Status: ${forecastResult.status}`);
    
    if (forecastResult.status === "INSUFFICIENT_DATA") {
      console.log("⚠️ NOTICE: Primary Chronos-2 Model unavailable. Executed fallback model.");
    } else {
      console.log("✓ CHRONOS-2: SUCCESS");
    }
    console.log(`✓ Predicted Demand: ${forecastResult.predicted_demand} orders over ${testParams.timeRange}.`);

    console.log("\n4. Detecting Peak Hours & Classifying Demand...");
    const peak = forecastResult.peak_window;
    console.log(`✓ Peak Window: ${peak.start} to ${peak.end} (+${peak.expectedDemandIncrease}% increase)`);

    console.log("\n5. Testing Worker Recommendation & Availability Engine...");
    // Keep worker recommendation real
    const dummyRequest = {
      service_name: "Electrician",
      service_address: "Guindy", // Match real pillars to a real area for recommendation test
      lat: 13.0067,
      lng: 80.2025,
      is_emergency: false
    };

    const { eligible, totalChecked, approvedCerts } = await workforceAllocationEngine.getEligibleCandidates(dummyRequest);
    console.log(`✓ Checked ${totalChecked} total verified pillars.`);
    console.log(`✓ Found ${eligible.length} eligible workers based on skill and availability.`);

    if (eligible.length > 0) {
      console.log("\n6. Ranking Workers (Matching Service) - COORDINATE TESTS...");

      const testCases = [
        { name: "Test A: Missing Customer Coordinates (Should bypass proximity)", req: { ...dummyRequest, lat: undefined, lng: undefined, latitude: undefined, longitude: undefined } },
        { name: "Test B: Valid Nearby Customer Coordinates (Guindy)", req: { ...dummyRequest, lat: 13.0070, lng: 80.2030 } },
        { name: "Test C: Valid Farther Customer Coordinates (Adyar)", req: { ...dummyRequest, lat: 13.0012, lng: 80.2565 } }
      ];

      for (const tc of testCases) {
        console.log(`\n--- ${tc.name} ---`);
        const matchResult = await matchingService.matchWorkforceForRequest(tc.req);
        
        const rankedCandidates = matchResult.rankedCandidates || matchResult.candidates || [];
        console.log(`✓ Ranked ${rankedCandidates.length} candidates.`);
        
        const bestMatch = matchResult.bestMatch;
        if (bestMatch) {
          console.log(`🏆 TOP RECOMMENDED WORKER:`);
          console.log(`   Name: ${bestMatch.fullName}`);
          console.log(`   Score: ${bestMatch.matchScore}/100`);
          console.log(`   Distance: ${bestMatch.distanceKm !== null ? bestMatch.distanceKm + ' km' : 'Unavailable'}`);
          console.log(`   Reasons for Match:`);
          bestMatch.reasons.forEach(r => console.log(`     - ${r}`));
        } else {
            console.log(`⚠️ No best match found for test case.`);
        }
      }
      
    } else {
      console.log("\n⚠️ No eligible workers found for the requested service and area. Cannot test worker recommendation logic fully.");
    }

    console.log("\n=======================================================");
    console.log("  VERIFICATION COMPLETE");
    console.log("=======================================================\n");

  } catch (error) {
    console.error("\n❌ ERROR RUNNING VERIFICATION SCRIPT:");
    console.error(error);
  } finally {
    process.exit(0);
  }
}

verifyAIPipeline();
