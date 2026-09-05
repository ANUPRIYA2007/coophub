/**
 * COOP HUB Phase 5A — Geography Acceptance Tests
 * Tests the geography API endpoints and database foundation.
 *
 * Run: node scripts/test_geography_phase5a.mjs
 *
 * Prerequisites:
 * - Backend server running on port 5000 (npm run dev:backend)
 * - Migration 31 applied to Supabase
 */

const SERVER = 'http://localhost:5000';
const SUPER_ADMIN_EMAIL = 'superadmin@coophub.gov.in';

let passed = 0;
let failed = 0;
const results = [];

function assert(condition, testName, details = '') {
    if (condition) {
        passed++;
        results.push({ status: 'PASS', test: testName });
        console.log(`  ✅ PASS: ${testName}`);
    } else {
        failed++;
        results.push({ status: 'FAIL', test: testName, details });
        console.log(`  ❌ FAIL: ${testName}${details ? ' — ' + details : ''}`);
    }
}

async function apiGet(path, expectStatus = 200) {
    const res = await fetch(`${SERVER}${path}`, {
        headers: {
            'X-Admin-Email': SUPER_ADMIN_EMAIL,
            'Content-Type': 'application/json'
        }
    });
    return { status: res.status, data: res.status !== 204 ? await res.json().catch(() => null) : null };
}

async function apiGetNoAuth(path) {
    const res = await fetch(`${SERVER}${path}`, {
        headers: { 'Content-Type': 'application/json' }
    });
    return { status: res.status, data: await res.json().catch(() => null) };
}

async function apiGetAsNormalAdmin(path) {
    const res = await fetch(`${SERVER}${path}`, {
        headers: {
            'X-Admin-Email': 'admin@coophub.in',
            'Content-Type': 'application/json'
        }
    });
    return { status: res.status, data: await res.json().catch(() => null) };
}

console.log('\n═══════════════════════════════════════════════════════════');
console.log(' COOP HUB Phase 5A — Geography Acceptance Tests');
console.log('═══════════════════════════════════════════════════════════\n');

// ── Section 1: Server health ──────────────────────────────────────────────────
console.log('📡 Section 1: Server Connectivity');
try {
    const health = await apiGet('/api/health');
    assert(health.status === 200, 'Backend server is running', `status=${health.status}`);
} catch (e) {
    assert(false, 'Backend server is running', e.message);
    console.log('\n⚠️  Cannot reach backend. Make sure npm run dev:backend is running.\n');
    process.exit(1);
}

// ── Section 2: Super Admin authorization ─────────────────────────────────────
console.log('\n🔐 Section 2: Authorization');
{
    const superAdminAccess = await apiGet('/api/admin/geography/summary');
    assert(superAdminAccess.status === 200, 'Super Admin can access geography summary');

    const normalAdminBlock = await apiGetAsNormalAdmin('/api/admin/geography/summary');
    assert(normalAdminBlock.status === 403, 'Normal Admin gets HTTP 403 on geography summary');

    const noAuthBlock = await apiGetNoAuth('/api/admin/geography/summary');
    assert(noAuthBlock.status === 403, 'Unauthenticated request gets HTTP 403');
}

// ── Section 3: Geography summary ─────────────────────────────────────────────
console.log('\n🗺️  Section 3: Geography Summary API');
{
    const { data: s } = await apiGet('/api/admin/geography/summary');
    assert(s !== null, 'Summary endpoint returns data');
    assert(typeof s?.total_zones === 'number', 'Summary has total_zones (number)');
    assert(typeof s?.total_states === 'number', 'Summary has total_states (number)');
    assert(typeof s?.total_union_territories === 'number', 'Summary has total_union_territories (number)');
    assert(typeof s?.total_units === 'number', 'Summary has total_units (number)');
    assert(typeof s?.total_districts === 'number', 'Summary has total_districts (number)');
    assert(typeof s?.total_cooperatives === 'number', 'Summary has total_cooperatives (number)');
}

// ── Section 4: Zone data ──────────────────────────────────────────────────────
console.log('\n🌐 Section 4: Zones API');
let zones = [];
{
    const { data: z } = await apiGet('/api/admin/geography/zones');
    zones = z?.zones || [];
    assert(zones.length === 4, `4 zones loaded from DB (got ${zones.length})`);

    const zoneCodes = zones.map(z => z.code).sort();
    assert(JSON.stringify(zoneCodes) === JSON.stringify(['EZ', 'NZ', 'SZ', 'WZ']),
        'Zone codes are SZ, NZ, WZ, EZ');

    assert(zones.every(z => typeof z.state_count === 'number'), 'All zones have state_count');
    assert(zones.every(z => typeof z.ut_count === 'number'), 'All zones have ut_count');
    assert(zones.every(z => typeof z.total_units === 'number'), 'All zones have total_units');
}

// ── Section 5: State/UT counts ────────────────────────────────────────────────
console.log('\n📊 Section 5: State/UT Counts');
{
    const { data: summary } = await apiGet('/api/admin/geography/summary');

    assert(summary?.total_states === 28, `Total states = 28 (got ${summary?.total_states})`);
    assert(summary?.total_union_territories === 8, `Total UTs = 8 (got ${summary?.total_union_territories})`);
    assert(summary?.total_units === 36, `Total State/UT units = 36 (got ${summary?.total_units})`);
}

// ── Section 6: Zone-specific counts ──────────────────────────────────────────
console.log('\n🗃️  Section 6: Zone Distribution');
{
    const SZ = zones.find(z => z.code === 'SZ');
    const NZ = zones.find(z => z.code === 'NZ');
    const WZ = zones.find(z => z.code === 'WZ');
    const EZ = zones.find(z => z.code === 'EZ');

    assert(SZ?.total_units === 8, `South Zone has 8 units (got ${SZ?.total_units})`);
    assert(NZ?.total_units === 11, `North Zone has 11 units (got ${NZ?.total_units})`);
    assert(WZ?.total_units === 6, `West Zone has 6 units (got ${WZ?.total_units})`);
    assert(EZ?.total_units === 11, `East Zone has 11 units (got ${EZ?.total_units})`);

    // No old 18-state cap
    const totalUnits = zones.reduce((sum, z) => sum + (z.total_units || 0), 0);
    assert(totalUnits > 18, `No 18-state cap — total units > 18 (got ${totalUnits})`);
}

// ── Section 7: Zone drill-down ────────────────────────────────────────────────
console.log('\n🔍 Section 7: Zone Drill-Down API');
{
    const { data: southData } = await apiGet('/api/admin/geography/zones/SZ/states');
    assert(southData?.zone?.code === 'SZ', 'South Zone detail returned');

    const southAll = [...(southData?.states || []), ...(southData?.union_territories || [])];
    assert(southAll.length === 8, `South Zone has 8 State/UT records (got ${southAll.length})`);
    assert(southData?.state_count === 5, `South has 5 States (got ${southData?.state_count})`);
    assert(southData?.ut_count === 3, `South has 3 UTs (got ${southData?.ut_count})`);

    const southNames = southAll.map(s => s.name);
    assert(southNames.includes('Tamil Nadu'), 'South contains Tamil Nadu');
    assert(southNames.includes('Kerala'), 'South contains Kerala');
    assert(southNames.includes('Puducherry'), 'South contains Puducherry (UT)');
    assert(southNames.includes('Andaman and Nicobar Islands'), 'South contains Andaman and Nicobar Islands (UT)');
}

{
    const { data: northData } = await apiGet('/api/admin/geography/zones/NZ/states');
    const northAll = [...(northData?.states || []), ...(northData?.union_territories || [])];
    assert(northAll.length === 11, `North Zone has 11 State/UT records (got ${northAll.length})`);

    const northNames = northAll.map(s => s.name);
    assert(northNames.includes('Bihar'), 'North contains Bihar');
    assert(northNames.includes('Rajasthan'), 'North contains Rajasthan (moved from West)');
    assert(northNames.includes('Delhi'), 'North contains Delhi (UT)');
    assert(northNames.includes('Ladakh'), 'North contains Ladakh (UT)');
}

{
    const { data: westData } = await apiGet('/api/admin/geography/zones/WZ/states');
    const westAll = [...(westData?.states || []), ...(westData?.union_territories || [])];
    assert(westAll.length === 6, `West Zone has 6 State/UT records (got ${westAll.length})`);

    const westNames = westAll.map(s => s.name);
    assert(westNames.includes('Chhattisgarh'), 'West contains Chhattisgarh');
    assert(!westNames.includes('Rajasthan'), 'West does NOT contain Rajasthan (moved to North)');
    assert(westNames.includes('Dadra and Nagar Haveli and Daman and Diu'), 'West contains Dadra UT');
}

{
    const { data: eastData } = await apiGet('/api/admin/geography/zones/EZ/states');
    const eastAll = [...(eastData?.states || []), ...(eastData?.union_territories || [])];
    assert(eastAll.length === 11, `East Zone has 11 State/UT records (got ${eastAll.length})`);

    const eastNames = eastAll.map(s => s.name);
    assert(eastNames.includes('Arunachal Pradesh'), 'East contains Arunachal Pradesh');
    assert(eastNames.includes('Nagaland'), 'East contains Nagaland');
    assert(eastNames.includes('Sikkim'), 'East contains Sikkim');
}

// ── Section 8: State detail ───────────────────────────────────────────────────
console.log('\n📍 Section 8: State Detail API');
{
    const { data: tn } = await apiGet('/api/admin/geography/states/TN');
    assert(tn?.name === 'Tamil Nadu', 'Tamil Nadu detail returned');
    assert(tn?.type === 'STATE', 'Tamil Nadu type is STATE');
    assert(tn?.zone_code === 'SZ', 'Tamil Nadu is in South Zone');
    assert(typeof tn?.district_count === 'number', 'Tamil Nadu has district_count');

    const { data: dl } = await apiGet('/api/admin/geography/states/DL');
    assert(dl?.name === 'Delhi', 'Delhi detail returned');
    assert(dl?.type === 'UNION_TERRITORY', 'Delhi type is UNION_TERRITORY');

    const { data: notFound, status: nfStatus } = await apiGet('/api/admin/geography/states/XX');
    assert(nfStatus === 404, 'Invalid state code returns 404');
}

// ── Section 9: Districts (empty state check) ──────────────────────────────────
console.log('\n🏙️  Section 9: Districts API (Empty State Check)');
{
    const { data: tnDistricts } = await apiGet('/api/admin/geography/states/TN/districts');
    assert(Array.isArray(tnDistricts?.districts), 'Districts array returned for Tamil Nadu');
    assert(tnDistricts?.state?.code === 'TN', 'Districts response has parent state');
    // Districts should be empty (no fake data seeded)
    assert(tnDistricts?.districts?.length === 0, 'No fake districts seeded for Tamil Nadu (empty state correct)');
}

// ── Section 10: 403 isolation for Normal Admin ────────────────────────────────
console.log('\n🛡️  Section 10: Normal Admin Isolation');
{
    const routes = [
        '/api/admin/geography/summary',
        '/api/admin/geography/zones',
        '/api/admin/geography/zones/SZ/states',
        '/api/admin/geography/states/TN',
    ];

    for (const route of routes) {
        const { status } = await apiGetAsNormalAdmin(route);
        assert(status === 403, `Normal admin gets 403 on ${route}`);
    }
}

// ── Section 11: Search API ────────────────────────────────────────────────────
console.log('\n🔎 Section 11: Search API');
{
    const { data: searchRes } = await apiGet('/api/admin/geography/search?q=Tamil');
    assert(Array.isArray(searchRes?.results), 'Search returns results array');
    const tnResult = searchRes?.results?.find(r => r.name === 'Tamil Nadu');
    assert(tnResult !== undefined, 'Search for "Tamil" finds Tamil Nadu');

    const { data: emptySearch } = await apiGet('/api/admin/geography/search?q=XYZ99NotExist');
    assert(emptySearch?.results?.length === 0, 'Search for nonexistent returns empty results');

    const { status: searchBlock } = await apiGetAsNormalAdmin('/api/admin/geography/search?q=Tamil');
    assert(searchBlock === 403, 'Search is blocked for Normal Admin');
}

// ── Final Report ──────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════════════');
console.log(' PHASE 5A GEOGRAPHY TEST RESULTS');
console.log('═══════════════════════════════════════════════════════════');
console.log(`\n  ✅ PASSED: ${passed}`);
console.log(`  ❌ FAILED: ${failed}`);
console.log(`  📊 TOTAL:  ${passed + failed}`);

if (failed > 0) {
    console.log('\n  Failed tests:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
        console.log(`    ❌ ${r.test}${r.details ? ': ' + r.details : ''}`);
    });
}

console.log('\n═══════════════════════════════════════════════════════════\n');
process.exit(failed > 0 ? 1 : 0);
