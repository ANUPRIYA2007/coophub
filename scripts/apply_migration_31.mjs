/**
 * COOP HUB Phase 5A — Apply Migration 31 via Supabase RPC
 * Runs the SQL from migration 31 directly using the Supabase service role client.
 * 
 * Run: node scripts/apply_migration_31.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl ? '✅ Found' : '❌ MISSING');
console.log('Supabase Key:', supabaseKey ? '✅ Found' : '❌ MISSING');

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// We'll execute each block separately using rpc('exec_sql') or direct queries
// Since Supabase JS client doesn't support raw DDL, we use the REST API with service key

async function execSQL(sql, description) {
    console.log(`\n  Executing: ${description}...`);
    try {
        const { data, error } = await supabase.rpc('exec', { sql });
        if (error) {
            // Try via postgrest directly
            console.log(`  ⚠️  RPC not available (${error.message}), trying direct insert...`);
            return false;
        }
        console.log(`  ✅ Done`);
        return true;
    } catch (e) {
        console.log(`  ⚠️  ${e.message}`);
        return false;
    }
}

async function main() {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log(' Phase 5A — Apply Migration 31 (36-State Foundation)');
    console.log('═══════════════════════════════════════════════════════\n');

    // Step 1: Check current state
    console.log('📊 Current Database State:');
    const { data: zones } = await supabase.from('geo_zones').select('code, name');
    const { data: states } = await supabase.from('geo_states').select('code, name, zone_code');
    console.log(`  Zones: ${zones?.length ?? 0} (expect 4)`);
    console.log(`  States: ${states?.length ?? 0} (expect 18 existing, goal: 36)`);

    // Step 2: Try upsert of new states using JS client (no DDL needed for INSERT/UPDATE)
    console.log('\n📍 Upserting 36 State/UT records...');

    const allStates = [
        // SOUTH ZONE
        { code: 'TN', zone_code: 'SZ', name: 'Tamil Nadu', capital: 'Chennai' },
        { code: 'KL', zone_code: 'SZ', name: 'Kerala', capital: 'Thiruvananthapuram' },
        { code: 'KA', zone_code: 'SZ', name: 'Karnataka', capital: 'Bengaluru' },
        { code: 'AP', zone_code: 'SZ', name: 'Andhra Pradesh', capital: 'Amaravati' },
        { code: 'TS', zone_code: 'SZ', name: 'Telangana', capital: 'Hyderabad' },
        { code: 'AN', zone_code: 'SZ', name: 'Andaman and Nicobar Islands', capital: 'Port Blair' },
        { code: 'LD', zone_code: 'SZ', name: 'Lakshadweep', capital: 'Kavaratti' },
        { code: 'PY', zone_code: 'SZ', name: 'Puducherry', capital: 'Puducherry' },
        // NORTH ZONE
        { code: 'PB', zone_code: 'NZ', name: 'Punjab', capital: 'Chandigarh' },
        { code: 'HR', zone_code: 'NZ', name: 'Haryana', capital: 'Chandigarh' },
        { code: 'UP', zone_code: 'NZ', name: 'Uttar Pradesh', capital: 'Lucknow' },
        { code: 'UK', zone_code: 'NZ', name: 'Uttarakhand', capital: 'Dehradun' },
        { code: 'BR', zone_code: 'NZ', name: 'Bihar', capital: 'Patna' },
        { code: 'HP', zone_code: 'NZ', name: 'Himachal Pradesh', capital: 'Shimla' },
        { code: 'RJ', zone_code: 'NZ', name: 'Rajasthan', capital: 'Jaipur' },
        { code: 'DL', zone_code: 'NZ', name: 'Delhi', capital: 'New Delhi' },
        { code: 'CH', zone_code: 'NZ', name: 'Chandigarh', capital: 'Chandigarh' },
        { code: 'JK', zone_code: 'NZ', name: 'Jammu and Kashmir', capital: 'Srinagar / Jammu' },
        { code: 'LA', zone_code: 'NZ', name: 'Ladakh', capital: 'Leh' },
        // WEST ZONE
        { code: 'MH', zone_code: 'WZ', name: 'Maharashtra', capital: 'Mumbai' },
        { code: 'GJ', zone_code: 'WZ', name: 'Gujarat', capital: 'Gandhinagar' },
        { code: 'GA', zone_code: 'WZ', name: 'Goa', capital: 'Panaji' },
        { code: 'CG', zone_code: 'WZ', name: 'Chhattisgarh', capital: 'Raipur' },
        { code: 'MP', zone_code: 'WZ', name: 'Madhya Pradesh', capital: 'Bhopal' },
        { code: 'DD', zone_code: 'WZ', name: 'Dadra and Nagar Haveli and Daman and Diu', capital: 'Daman' },
        // EAST ZONE
        { code: 'WB', zone_code: 'EZ', name: 'West Bengal', capital: 'Kolkata' },
        { code: 'OR', zone_code: 'EZ', name: 'Odisha', capital: 'Bhubaneswar' },
        { code: 'JH', zone_code: 'EZ', name: 'Jharkhand', capital: 'Ranchi' },
        { code: 'AS', zone_code: 'EZ', name: 'Assam', capital: 'Dispur' },
        { code: 'AR', zone_code: 'EZ', name: 'Arunachal Pradesh', capital: 'Itanagar' },
        { code: 'MN', zone_code: 'EZ', name: 'Manipur', capital: 'Imphal' },
        { code: 'ML', zone_code: 'EZ', name: 'Meghalaya', capital: 'Shillong' },
        { code: 'MZ', zone_code: 'EZ', name: 'Mizoram', capital: 'Aizawl' },
        { code: 'NL', zone_code: 'EZ', name: 'Nagaland', capital: 'Kohima' },
        { code: 'SK', zone_code: 'EZ', name: 'Sikkim', capital: 'Gangtok' },
        { code: 'TR', zone_code: 'EZ', name: 'Tripura', capital: 'Agartala' },
    ];

    // Upsert in batches of 10
    let upsertSuccess = 0;
    let upsertFail = 0;
    for (let i = 0; i < allStates.length; i += 10) {
        const batch = allStates.slice(i, i + 10);
        const { error } = await supabase.from('geo_states').upsert(batch, { onConflict: 'code' });
        if (error) {
            console.log(`  ❌ Batch ${Math.floor(i/10)+1} failed: ${error.message}`);
            upsertFail += batch.length;
        } else {
            upsertSuccess += batch.length;
            console.log(`  ✅ Batch ${Math.floor(i/10)+1}: ${batch.length} records upserted`);
        }
    }

    // Step 3: Verify final counts
    console.log('\n📊 Final State:');
    const { data: finalZones } = await supabase.from('geo_zones').select('code');
    const { data: finalStates } = await supabase.from('geo_states').select('code');
    console.log(`  Zones: ${finalZones?.length ?? 0} (expect 4)`);
    console.log(`  State/UT records: ${finalStates?.length ?? 0} (expect 36)`);

    if (finalStates?.length === 36) {
        console.log('\n  ✅ SUCCESS: 36 State/UT units in database');
    } else {
        console.log(`\n  ⚠️  Got ${finalStates?.length} records. Check if type column exists.`);
        console.log('  ℹ️  To add the type column, apply migration 31 in Supabase Dashboard:');
        console.log('      supabase/migrations/31_geography_36_states_expansion.sql');
    }

    // Note about type column
    console.log('\n  ⚠️  NOTE: The "type" column (STATE/UNION_TERRITORY) requires DDL.');
    console.log('  ℹ️  Apply this in Supabase Dashboard > SQL Editor:');
    console.log('      ALTER TABLE geo_states ADD COLUMN IF NOT EXISTS type TEXT DEFAULT \'STATE\';');
    console.log('      UPDATE geo_states SET type = \'UNION_TERRITORY\' WHERE code IN');
    console.log('        (\'AN\',\'LD\',\'PY\',\'DL\',\'CH\',\'JK\',\'LA\',\'DD\');');

    console.log('\n═══════════════════════════════════════════════════════\n');
}

main().catch(console.error);
