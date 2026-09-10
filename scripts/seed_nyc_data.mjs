import { supabase } from '../src/lib/supabase.js';
import fetch from 'node-fetch';

const NYC_311_API = "https://data.cityofnewyork.us/resource/erm2-nwe9.json?$limit=5000&$order=created_date DESC";

// Mapping dictionary for identifying relevant public categories and transforming them to COOP HUB services
const SERVICE_MAPPINGS = {
  "Electric": "Electrician",
  "Street Light Condition": "Electrician",
  "Plumbing": "Plumber",
  "Water System": "Plumber",
  "Sewer": "Plumber",
  "Heating": "AC/HVAC technician",
  "Boiler": "AC/HVAC technician",
  "Air Quality": "AC/HVAC technician",
  "Noise - Residential": "Excluded",
  "Illegal Parking": "Excluded"
};

async function seedNYCData() {
  const args = process.argv.slice(2);
  const isCleanup = args.includes("--cleanup");

  if (isCleanup) {
    console.log("\n=======================================================");
    console.log("  COOP HUB: CLEANUP NYC TEST DATA");
    console.log("=======================================================\n");
    console.log("Identifying test records safely via [TEST_SEED] marker...");
    
    // Safely delete only the test records
    const { data: recordsToDelete, error: countErr } = await supabase
      .from('service_requests')
      .select('id')
      .like('customer_description', '%[TEST_SEED]%');
      
    if (countErr) {
      console.error("Error finding test records:", countErr.message);
      process.exit(1);
    }
    
    const deleteCount = recordsToDelete ? recordsToDelete.length : 0;
    console.log(`Found ${deleteCount} seeded test records.`);
    
    if (deleteCount > 0) {
      const { error: delErr } = await supabase
        .from('service_requests')
        .delete()
        .like('customer_description', '%[TEST_SEED]%');
        
      if (delErr) {
        console.error("Cleanup failed:", delErr.message);
      } else {
        console.log(`Successfully deleted ${deleteCount} test records. Genuine data was untouched.`);
      }
    }
    
    process.exit(0);
  }

  console.log("\n=======================================================");
  console.log("  COOP HUB: SEED NYC 311 HISTORICAL DATA FOR CHRONOS-2");
  console.log("=======================================================\n");
  console.log(`SOURCE DATASET: ${NYC_311_API}`);
  
  try {
    const res = await fetch(NYC_311_API);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    
    console.log(`\n1. Downloaded ${data.length} recent records from NYC 311.`);
    
    const validRecords = [];
    let excludedCount = 0;
    const mappingStats = {};
    const locationStats = {};
    let minDate = new Date();
    let maxDate = new Date(0);
    
    let { data: existingCustomers } = await supabase
      .from('profiles')
      .select('id, full_name, mobile')
      .eq('role', 'customer')
      .limit(1);

    let customerData = existingCustomers && existingCustomers.length > 0 ? existingCustomers[0] : null;

    if (!customerData) {
      console.log("No valid customers found. Creating a dummy NYC Test User via Auth...");
      const dummyEmail = `nyctestuser${Math.floor(Math.random()*10000)}@coophub.test`;
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: dummyEmail,
        password: "password123",
        options: {
          data: {
            full_name: "NYC Test User",
            mobile: "+10000000000",
            role: "customer"
          }
        }
      });
      
      if (authErr || !authData.user) {
        console.error("Failed to create dummy auth user:", authErr?.message);
        process.exit(1);
      }
      
      customerData = {
        id: authData.user.id,
        full_name: "NYC Test User",
        mobile: "+10000000000"
      };
    }
    
    const SERVICE_UUIDS = {
      "Electrician": "a0000000-0000-0000-0000-000000000001",
      "Plumber": "a0000000-0000-0000-0000-000000000002",
      "AC/HVAC technician": "a0000000-0000-0000-0000-000000000003"
    };
    
    data.forEach(item => {
      const agency = item.agency_name || "";
      const complaintType = item.complaint_type || "";
      const descriptor = item.descriptor || "";
      const borough = item.borough || "Unknown";
      const createdDateStr = item.created_date;
      
      let mappedService = null;
      let mappedSubService = complaintType;
      
      // Attempt to map category
      for (const [key, val] of Object.entries(SERVICE_MAPPINGS)) {
        if (complaintType.includes(key) || descriptor.includes(key)) {
          if (val === "Excluded") {
            mappedService = "Excluded";
          } else {
            mappedService = val;
            mappedSubService = `${complaintType} - ${descriptor}`;
          }
          break;
        }
      }
      
      if (!mappedService || mappedService === "Excluded") {
        excludedCount++;
        return;
      }
      
      // Ensure we have a valid timestamp
      if (!createdDateStr) return;
      const createdDate = new Date(createdDateStr);
      if (createdDate < minDate) minDate = createdDate;
      if (createdDate > maxDate) maxDate = createdDate;
      
      // Data Isolation formatting
      const isolatedAddress = `${borough} (NYC TEST DATA)`;
      const isolatedSubService = `${mappedSubService} [TEST_SEED]`; // Adding marker here to isolate
      
      mappingStats[mappedService] = (mappingStats[mappedService] || 0) + 1;
      locationStats[isolatedAddress] = (locationStats[isolatedAddress] || 0) + 1;
      
      validRecords.push({
        service_id: SERVICE_UUIDS[mappedService],
        customer_id: customerData.id,
        area: isolatedAddress,
        customer_description: isolatedSubService, // Store the marker in customer_description
        created_at: createdDate.toISOString(),
        preferred_date: createdDate.toISOString(),
        status: "completed"
      });
    });
    
    console.log(`\n2. Filtered and Transformed Data:`);
    console.log(`   - Retained ${validRecords.length} records mapped to COOP HUB services.`);
    console.log(`   - Excluded ${excludedCount} unmapped or unrelated records.`);
    console.log(`   - Date Range: ${minDate.toISOString()} to ${maxDate.toISOString()}`);
    
    console.log(`\n3. Service Mappings:`);
    Object.entries(mappingStats).forEach(([service, count]) => {
      console.log(`   - ${service}: ${count} records`);
    });
    
    console.log(`\n4. Geographic Distribution:`);
    Object.entries(locationStats).forEach(([loc, count]) => {
      console.log(`   - ${loc}: ${count} records`);
    });
    
    console.log("\n5. Inserting to Supabase (Staging / Test Isolation)...");
    
    // Batch insert
    const batchSize = 100;
    let inserted = 0;
    
    for (let i = 0; i < validRecords.length; i += batchSize) {
      const batch = validRecords.slice(i, i + batchSize);
      const { error } = await supabase.from('service_requests').insert(batch);
      
      if (error) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, error.message);
        break;
      }
      inserted += batch.length;
      process.stdout.write(`\r   - Inserted ${inserted} / ${validRecords.length} records`);
    }
    
    console.log(`\n\n✓ Successfully seeded ${inserted} test records into Supabase.`);
    console.log(`\nTo safely clean up these records later, run:\nnode scripts/seed_nyc_data.mjs --cleanup`);
    
  } catch (err) {
    console.error("\n❌ SEEDING FAILED:", err.message);
  } finally {
    process.exit(0);
  }
}

seedNYCData();
