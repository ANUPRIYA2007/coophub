/**
 * PHASE 5A — Direct SQL Execution via Supabase REST API
 * Uses the anon key + Supabase's pg-meta API to apply migration 31.
 * Alternatively uses pg connection if DATABASE_URL is available.
 * 
 * Run: node scripts/apply_migration_31_direct.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Project ref extracted from URL
const PROJECT_REF = SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

console.log('\n═══════════════════════════════════════════════════════');
console.log(' Phase 5A — Applying 36-State Foundation to Supabase');
console.log('═══════════════════════════════════════════════════════\n');
console.log('Project Ref:', PROJECT_REF);
console.log('Service Key:', SERVICE_KEY ? '✅ Available' : '❌ Not found — will use anon key');

// Use service key if available, otherwise anon key
const KEY = SERVICE_KEY || ANON_KEY;
const supabase = createClient(SUPABASE_URL, KEY);

// ─── Strategy 1: Try via Supabase pg-meta REST API (management endpoint) ─────
async function tryMgmtAPI(sql, description) {
    try {
        const res = await fetch(
            `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${KEY}`
                },
                body: JSON.stringify({ query: sql })
            }
        );
        const data = await res.json();
        if (res.ok) {
            console.log(`  ✅ ${description}`);
            return true;
        }
        console.log(`  ⚠️  Management API: ${JSON.stringify(data).slice(0, 120)}`);
        return false;
    } catch (e) {
        console.log(`  ⚠️  Management API error: ${e.message}`);
        return false;
    }
}

// ─── Strategy 2: Direct upsert via JS client (for non-DDL statements) ─────────
async function upsertStates(states) {
    console.log('\n📍 Upserting State/UT records via JS client...');
    let ok = 0, fail = 0;
    for (let i = 0; i < states.length; i += 6) {
        const batch = states.slice(i, i + 6);
        const { error } = await supabase.from('geo_states').upsert(batch, { onConflict: 'code' });
        if (error) {
            console.log(`  ❌ Batch ${Math.floor(i/6)+1} error: ${error.message}`);
            fail += batch.length;
        } else {
            ok += batch.length;
            console.log(`  ✅ Batch ${Math.floor(i/6)+1}: upserted ${batch.length} records`);
        }
    }
    return { ok, fail };
}

async function main() {
    // Check current state
    console.log('📊 Querying current database state...');
    const { data: zones } = await supabase.from('geo_zones').select('code, name').order('code');
    const { data: states } = await supabase.from('geo_states').select('code, name, zone_code, type').order('zone_code, name');
    const { data: districts } = await supabase.from('geo_districts').select('code');
    const { data: coops } = await supabase.from('geo_cooperatives').select('code');

    console.log(`  Zones: ${zones?.length ?? 'error'}`);
    console.log(`  States/UTs: ${states?.length ?? 'error'}`);
    console.log(`  Districts: ${districts?.length ?? 0}`);
    console.log(`  Cooperatives: ${coops?.length ?? 0}`);

    // Check if type column exists
    const hasTypeCol = states?.some(s => 'type' in s);
    console.log(`  type column exists: ${hasTypeCol ? 'YES' : 'NO — will use fallback'}`);

    // ── Step 1: Try DDL via management API ────────────────────────────────────
    console.log('\n🔧 Step 1: Applying DDL via Supabase Management API...');
    
    const ddlStatements = [
        ["ALTER TABLE public.geo_states ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'STATE'", "Add type column"],
        ["ALTER TABLE public.geo_states ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'", "Add status column"],
        ["ALTER TABLE public.geo_states ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()", "Add updated_at column"],
        ["ALTER TABLE public.geo_zones ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()", "Add zone updated_at"],
        ["ALTER TABLE public.geo_zones ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'", "Add zone status"],
        ["UPDATE public.geo_states SET type = 'STATE' WHERE code IN ('TN','KL','KA','AP','TS','PB','HR','UP','UK','MH','GJ','GA','WB','OR','JH','AS')", "Set type=STATE existing"],
        ["UPDATE public.geo_states SET type = 'UNION_TERRITORY', name = 'Delhi' WHERE code = 'DL'", "Set DL as UT"],
        ["UPDATE public.geo_states SET zone_code = 'NZ', type = 'STATE' WHERE code = 'RJ'", "Move RJ to NZ"],
        ["CREATE INDEX IF NOT EXISTS idx_geo_states_type ON public.geo_states(type)", "Create type index"],
    ];

    let mgmtWorked = false;
    for (const [sql, desc] of ddlStatements) {
        const ok = await tryMgmtAPI(sql, desc);
        if (ok) mgmtWorked = true;
    }

    // ── Step 2: Upsert all 36 records via JS client ───────────────────────────
    console.log('\n📍 Step 2: Upserting all 36 State/UT records...');
    
    const allStates = [
        // SOUTH ZONE - 5 States
        { code: 'TN', zone_code: 'SZ', name: 'Tamil Nadu', capital: 'Chennai' },
        { code: 'KL', zone_code: 'SZ', name: 'Kerala', capital: 'Thiruvananthapuram' },
        { code: 'KA', zone_code: 'SZ', name: 'Karnataka', capital: 'Bengaluru' },
        { code: 'AP', zone_code: 'SZ', name: 'Andhra Pradesh', capital: 'Amaravati' },
        { code: 'TS', zone_code: 'SZ', name: 'Telangana', capital: 'Hyderabad' },
        // SOUTH ZONE - 3 UTs
        { code: 'AN', zone_code: 'SZ', name: 'Andaman and Nicobar Islands', capital: 'Port Blair' },
        { code: 'LD', zone_code: 'SZ', name: 'Lakshadweep', capital: 'Kavaratti' },
        { code: 'PY', zone_code: 'SZ', name: 'Puducherry', capital: 'Puducherry' },
        // NORTH ZONE - 7 States
        { code: 'PB', zone_code: 'NZ', name: 'Punjab', capital: 'Chandigarh' },
        { code: 'HR', zone_code: 'NZ', name: 'Haryana', capital: 'Chandigarh' },
        { code: 'UP', zone_code: 'NZ', name: 'Uttar Pradesh', capital: 'Lucknow' },
        { code: 'UK', zone_code: 'NZ', name: 'Uttarakhand', capital: 'Dehradun' },
        { code: 'BR', zone_code: 'NZ', name: 'Bihar', capital: 'Patna' },
        { code: 'HP', zone_code: 'NZ', name: 'Himachal Pradesh', capital: 'Shimla' },
        { code: 'RJ', zone_code: 'NZ', name: 'Rajasthan', capital: 'Jaipur' },
        // NORTH ZONE - 4 UTs
        { code: 'DL', zone_code: 'NZ', name: 'Delhi', capital: 'New Delhi' },
        { code: 'CH', zone_code: 'NZ', name: 'Chandigarh', capital: 'Chandigarh' },
        { code: 'JK', zone_code: 'NZ', name: 'Jammu and Kashmir', capital: 'Srinagar / Jammu' },
        { code: 'LA', zone_code: 'NZ', name: 'Ladakh', capital: 'Leh' },
        // WEST ZONE - 5 States
        { code: 'MH', zone_code: 'WZ', name: 'Maharashtra', capital: 'Mumbai' },
        { code: 'GJ', zone_code: 'WZ', name: 'Gujarat', capital: 'Gandhinagar' },
        { code: 'GA', zone_code: 'WZ', name: 'Goa', capital: 'Panaji' },
        { code: 'CG', zone_code: 'WZ', name: 'Chhattisgarh', capital: 'Raipur' },
        { code: 'MP', zone_code: 'WZ', name: 'Madhya Pradesh', capital: 'Bhopal' },
        // WEST ZONE - 1 UT
        { code: 'DD', zone_code: 'WZ', name: 'Dadra and Nagar Haveli and Daman and Diu', capital: 'Daman' },
        // EAST ZONE - 11 States
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

    const { ok, fail } = await upsertStates(allStates);
    console.log(`  Records upserted: ${ok}, failed: ${fail}`);

    // ── Step 3: Verify final counts ───────────────────────────────────────────
    console.log('\n📊 Step 3: Verifying final database state...');
    const { data: finalStates } = await supabase.from('geo_states').select('code, name, zone_code, type').order('zone_code, name');
    const { data: finalZones } = await supabase.from('geo_zones').select('code, name');

    const total = finalStates?.length ?? 0;
    const byZone = {};
    const byType = { STATE: 0, UNION_TERRITORY: 0, UNKNOWN: 0 };
    
    (finalStates || []).forEach(s => {
        byZone[s.zone_code] = (byZone[s.zone_code] || 0) + 1;
        if (s.type === 'STATE') byType.STATE++;
        else if (s.type === 'UNION_TERRITORY') byType.UNION_TERRITORY++;
        else byType.UNKNOWN++;
    });

    console.log(`\n  Zones in DB: ${finalZones?.length}`);
    console.log(`  Total State/UT records: ${total}`);
    console.log(`  By zone: SZ=${byZone.SZ||0}, NZ=${byZone.NZ||0}, WZ=${byZone.WZ||0}, EZ=${byZone.EZ||0}`);
    console.log(`  By type: STATE=${byType.STATE}, UT=${byType.UNION_TERRITORY}, UNKNOWN=${byType.UNKNOWN}`);

    if (total === 36) {
        console.log('\n  ✅ 36 State/UT units confirmed in database');
    } else {
        console.log(`\n  ⚠️  Expected 36, got ${total}`);
    }

    if (byType.UNKNOWN > 0) {
        console.log(`\n  ⚠️  ${byType.UNKNOWN} records have no type (DDL not applied yet)`);
        console.log('  ACTION REQUIRED: Apply DDL manually in Supabase Dashboard > SQL Editor:');
        console.log('\n  -- Paste this in Supabase SQL Editor:');
        console.log("  ALTER TABLE public.geo_states ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'STATE';");
        console.log("  UPDATE public.geo_states SET type = 'STATE' WHERE type IS NULL OR type = '';");
        console.log("  UPDATE public.geo_states SET type = 'UNION_TERRITORY' WHERE code IN ('AN','LD','PY','DL','CH','JK','LA','DD');");
        console.log("  ALTER TABLE public.geo_states ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';");
    }

    // Print full state list
    console.log('\n  Full State/UT list in DB:');
    (finalStates || []).forEach(s => {
        const typeStr = s.type ? s.type : 'NO_TYPE';
        console.log(`    ${s.zone_code} | ${s.code} | ${s.name} | ${typeStr}`);
    });

    console.log('\n═══════════════════════════════════════════════════════\n');
}

main().catch(console.error);
