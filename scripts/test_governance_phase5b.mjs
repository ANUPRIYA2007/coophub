// scripts/test_governance_phase5b.mjs
// Comprehensive Phase 5B Governance & Access Verification Suite
import http from 'http';

const BASE_URL = 'http://localhost:5000';
const SUPER_ADMIN_HEADERS = {
  'Content-Type': 'application/json',
  'X-Admin-Email': 'superadmin@coophub.gov.in',
  'X-Admin-Id': 'SA-000001'
};
const NORMAL_ADMIN_HEADERS = {
  'Content-Type': 'application/json',
  'X-Admin-Email': 'admin@coophub.in'
};

let passedCount = 0;
let failedCount = 0;
const results = [];

function assert(condition, message) {
  if (condition) {
    passedCount++;
    results.push({ status: 'PASS', message });
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failedCount++;
    results.push({ status: 'FAIL', message });
    console.error(`  ❌ FAIL: ${message}`);
  }
}

async function request(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = { raw: data };
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', (err) => reject(err));
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runGovernanceTests() {
  console.log('======================================================================');
  console.log('🏛️  PHASE 5B: SUPER ADMIN GOVERNANCE & ACCESS VERIFICATION SUITE');
  console.log('======================================================================\n');

  // TEST SUITE 1: Security & RBAC Enforcement (Normal Admin vs Super Admin)
  console.log('--- SUITE 1: Authoritative RBAC Isolation ---');
  {
    const resNoAuth = await request('GET', '/api/admin/governance/admins');
    assert(resNoAuth.status === 403, 'Unauthenticated request to /api/admin/governance/admins rejected with 403');
    assert(resNoAuth.body?.code === 'SUPER_ADMIN_REQUIRED', 'Error code is SUPER_ADMIN_REQUIRED');

    const resNormalAuth = await request('GET', '/api/admin/governance/admins', NORMAL_ADMIN_HEADERS);
    assert(resNormalAuth.status === 403, 'Normal Admin token cannot access Super Admin governance admins endpoint (403)');

    // Forged arbitrary header tests
    const resForgedAdmin = await request('GET', '/api/admin/governance/admins', {
      'Content-Type': 'application/json',
      'X-Admin-Email': 'attacker@forged-identity.org'
    });
    assert(resForgedAdmin.status === 403, 'Forged arbitrary admin email rejected with 403');

    // Forged invalid Bearer token
    const resForgedBearer = await request('GET', '/api/admin/governance/admins', {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer forged.fake.jwt.token'
    });
    assert(resForgedBearer.status === 403, 'Forged invalid Bearer JWT rejected with 403');

    const resZonesNoAuth = await request('GET', '/api/admin/governance/zones');
    assert(resZonesNoAuth.status === 403, 'Unauthenticated request to /api/admin/governance/zones rejected with 403');

    const resPermsNoAuth = await request('GET', '/api/admin/governance/permissions');
    assert(resPermsNoAuth.status === 403, 'Unauthenticated request to /api/admin/governance/permissions rejected with 403');

    const resEnforceNoAuth = await request('POST', '/api/admin/governance/admins/test/enforce', {}, { action: 'SUSPEND' });
    assert(resEnforceNoAuth.status === 403, 'Unauthenticated enforcement action rejected with 403');

    const resSuperAuth = await request('GET', '/api/admin/governance/admins', SUPER_ADMIN_HEADERS);
    assert(resSuperAuth.status === 200, 'Authoritative Super Admin request receives 200 OK');
    assert(Array.isArray(resSuperAuth.body?.data), 'Response body contains array of admin accounts');
  }

  // TEST SUITE 2: Apex Admin Directory & Seeded Super Admin Identity
  console.log('\n--- SUITE 2: Admin Directory & Seeded Super Admin Verification ---');
  let superAdminId = null;
  {
    const res = await request('GET', '/api/admin/governance/admins', SUPER_ADMIN_HEADERS);
    const admins = res.body?.data || [];
    assert(admins.length >= 1, `Admins directory contains at least 1 record (found: ${admins.length})`);

    const apex = admins.find(a => a.admin_code === 'SA-000001' || a.email === 'superadmin@coophub.gov.in');
    assert(Boolean(apex), 'Apex administrator SA-000001 (superadmin@coophub.gov.in) exists');
    if (apex) {
      superAdminId = apex.id;
      assert(apex.role === 'SUPER_ADMIN', `Apex administrator role is SUPER_ADMIN (found: ${apex.role})`);
      assert(apex.is_active === true, 'Apex administrator is_active is true');
      assert(apex.clearance_level === 5, `Apex clearance_level is 5 (found: ${apex.clearance_level})`);
      assert(Array.isArray(apex.scopes) && apex.scopes.some(s => s.scope_type === 'GLOBAL'), 'Apex has GLOBAL scope');
    }

    // Filter by role
    const resRoleFilter = await request('GET', '/api/admin/governance/admins?role=SUPER_ADMIN', SUPER_ADMIN_HEADERS);
    assert(resRoleFilter.status === 200, 'Role filter query succeeds');
    assert(resRoleFilter.body?.data?.every(a => a.role === 'SUPER_ADMIN'), 'Role filter returned only SUPER_ADMIN records');

    // Search by query
    const resSearch = await request('GET', '/api/admin/governance/admins?search=superadmin', SUPER_ADMIN_HEADERS);
    assert(resSearch.status === 200, 'Search query succeeds');
    assert(resSearch.body?.data?.some(a => a.email === 'superadmin@coophub.gov.in'), 'Search found superadmin email');
  }

  // TEST SUITE 3: Subordinate Admin Creation & Downward Scope Constraints
  console.log('\n--- SUITE 3: Subordinate Admin Creation & Scope Flow ---');
  let createdZoneAdminId = null;
  const testEmail = `zone.director.${Date.now()}@coophub.gov.in`;
  const testCode = `ZA-${Math.floor(100000 + Math.random() * 900000)}`;

  {
    // Rule: Cannot create another SUPER_ADMIN via governance API
    const resForbiddenSuper = await request('POST', '/api/admin/governance/admins', SUPER_ADMIN_HEADERS, {
      admin_code: 'SA-999999',
      email: 'illegal.super@coophub.gov.in',
      full_name: 'Illegal Super Admin',
      role: 'SUPER_ADMIN',
      primary_zone: 'SZ'
    });
    assert(resForbiddenSuper.status === 400, 'Creating another SUPER_ADMIN is rejected with 400');
    assert(resForbiddenSuper.body?.code === 'SUPER_ADMIN_CREATION_PROHIBITED', 'Error code is SUPER_ADMIN_CREATION_PROHIBITED');

    // Rule: Missing required fields
    const resMissing = await request('POST', '/api/admin/governance/admins', SUPER_ADMIN_HEADERS, {
      full_name: 'Incomplete Admin'
    });
    assert(resMissing.status === 400, 'Creation with missing fields rejected with 400');

    // Rule: Invalid scope entity (invalid zone code)
    const resInvalidScope = await request('POST', '/api/admin/governance/admins', SUPER_ADMIN_HEADERS, {
      admin_code: 'ZA-999998',
      email: 'bad.zone@coophub.gov.in',
      full_name: 'Bad Zone Admin',
      role: 'ZONE_ADMIN',
      primary_zone: 'NON_EXISTENT_ZONE'
    });
    assert(resInvalidScope.status === 400, 'Admin creation with invalid zone code rejected with 400');

    // Success: Create valid ZONE_ADMIN for South Zone (SZ)
    const resValid = await request('POST', '/api/admin/governance/admins', SUPER_ADMIN_HEADERS, {
      admin_code: testCode,
      email: testEmail,
      full_name: 'Zonal Director South',
      phone_number: '+91 98765 43210',
      designation: 'Zonal Director',
      department: 'Zonal Command Center',
      role: 'ZONE_ADMIN',
      primary_zone: 'SZ',
      scopes: [{ scope_type: 'ZONE', entity_code: 'SZ', is_primary: true }]
    });
    assert(resValid.status === 201, `Valid ZONE_ADMIN created with 201 Created (ID: ${resValid.body?.data?.id})`);
    assert(resValid.body?.data?.admin_code === testCode, 'Created admin has correct admin_code');
    assert(resValid.body?.data?.role === 'ZONE_ADMIN', 'Created admin role is ZONE_ADMIN');
    assert(resValid.body?.data?.clearance_level === 4, 'ZONE_ADMIN automatically assigned clearance_level 4');
    createdZoneAdminId = resValid.body?.data?.id;

    // Duplicate email or code test
    const resDup = await request('POST', '/api/admin/governance/admins', SUPER_ADMIN_HEADERS, {
      admin_code: testCode,
      email: testEmail,
      full_name: 'Duplicate Admin',
      role: 'ZONE_ADMIN',
      primary_zone: 'SZ'
    });
    assert(resDup.status === 400, 'Duplicate admin_code/email rejected with 400');
    assert(resDup.body?.code === 'ADMIN_EXISTS', 'Duplicate error code is ADMIN_EXISTS');
  }

  // TEST SUITE 4: Admin Dossier Retrieval
  console.log('\n--- SUITE 4: Admin Dossier & Scope Inspection ---');
  {
    const resDossier = await request('GET', `/api/admin/governance/admins/${createdZoneAdminId}`, SUPER_ADMIN_HEADERS);
    assert(resDossier.status === 200, `Admin dossier for ${createdZoneAdminId} returns 200 OK`);
    assert(resDossier.body?.data?.id === createdZoneAdminId, 'Dossier matches requested admin ID');
    assert(Array.isArray(resDossier.body?.data?.scopes), 'Dossier includes scopes array');
    assert(resDossier.body?.data?.scopes.some(s => s.entity_code === 'SZ'), 'Dossier contains South Zone (SZ) scope');
    assert(Array.isArray(resDossier.body?.data?.enforcement_history), 'Dossier includes enforcement_history array');
    assert(Array.isArray(resDossier.body?.data?.audit_logs), 'Dossier includes audit_logs array');

    // Non-existent admin ID returns 404
    const res404 = await request('GET', '/api/admin/governance/admins/00000000-0000-0000-0000-000000000000', SUPER_ADMIN_HEADERS);
    assert(res404.status === 404, 'Non-existent admin ID returns 404 Not Found');
  }

  // TEST SUITE 5: Enforcement Actions & Safety Controls
  console.log('\n--- SUITE 5: Enforcement Guardrails & Action Pipeline ---');
  {
    // Rule: Cannot enforce actions against Super Admin
    if (superAdminId) {
      const resEnforceSuper = await request('POST', `/api/admin/governance/admins/${superAdminId}/enforce`, SUPER_ADMIN_HEADERS, {
        action: 'SUSPEND',
        reason: 'Attempted suspension of Apex Super Admin'
      });
      assert(resEnforceSuper.status === 403, 'Enforcement against SUPER_ADMIN is prohibited (403 Forbidden)');
      assert(resEnforceSuper.body?.code === 'CANNOT_ENFORCE_SUPER_ADMIN', 'Error code is CANNOT_ENFORCE_SUPER_ADMIN');
    }

    // Invalid action type
    const resInvalidAction = await request('POST', `/api/admin/governance/admins/${createdZoneAdminId}/enforce`, SUPER_ADMIN_HEADERS, {
      action: 'SELF_DESTRUCT',
      reason: 'Invalid action test'
    });
    assert(resInvalidAction.status === 400, 'Invalid action type rejected with 400');

    // Missing reason
    const resNoReason = await request('POST', `/api/admin/governance/admins/${createdZoneAdminId}/enforce`, SUPER_ADMIN_HEADERS, {
      action: 'SUSPEND'
    });
    assert(resNoReason.status === 400, 'Enforcement without mandatory reason rejected with 400');

    // Action 1: WARN subordinate admin
    const resWarn = await request('POST', `/api/admin/governance/admins/${createdZoneAdminId}/enforce`, SUPER_ADMIN_HEADERS, {
      action: 'WARN',
      reason: 'Initial compliance warning issued regarding zonal latency'
    });
    assert(resWarn.status === 200, 'WARN action successfully applied (200 OK)');
    assert(Boolean(resWarn.body?.action_record?.id), 'Enforcement record ID returned');
    assert(Boolean(resWarn.body?.action_record?.correlation_id), 'Enforcement action tracked with correlation ID');

    // Action 2: SUSPEND subordinate admin
    const resSuspend = await request('POST', `/api/admin/governance/admins/${createdZoneAdminId}/enforce`, SUPER_ADMIN_HEADERS, {
      action: 'SUSPEND',
      reason: 'Security audit hold on zonal access credentials'
    });
    assert(resSuspend.status === 200, 'SUSPEND action successfully applied');
    assert(resSuspend.body?.action_record?.action_type === 'SUSPEND', 'Action type recorded as SUSPEND');

    // Verify admin status changed to suspended
    const resSuspendedDossier = await request('GET', `/api/admin/governance/admins/${createdZoneAdminId}`, SUPER_ADMIN_HEADERS);
    assert(resSuspendedDossier.body?.data?.is_active === false, 'Suspended admin is_active is now false');
    assert(resSuspendedDossier.body?.data?.enforcement_history?.length >= 2, 'Enforcement history records multiple actions');

    // Action 3: REINSTATE subordinate admin
    const resReinstate = await request('POST', `/api/admin/governance/admins/${createdZoneAdminId}/enforce`, SUPER_ADMIN_HEADERS, {
      action: 'REINSTATE',
      reason: 'Compliance audit cleared; full zonal clearance reinstated'
    });
    assert(resReinstate.status === 200, 'REINSTATE action successfully applied');

    const resReinstatedDossier = await request('GET', `/api/admin/governance/admins/${createdZoneAdminId}`, SUPER_ADMIN_HEADERS);
    assert(resReinstatedDossier.body?.data?.is_active === true, 'Reinstated admin is_active is now true');

    // Action 4: RESTRICT subordinate admin
    const resRestrict = await request('POST', `/api/admin/governance/admins/${createdZoneAdminId}/enforce`, SUPER_ADMIN_HEADERS, {
      action: 'RESTRICT',
      reason: 'Temporary capability restriction pending procedural review'
    });
    assert(resRestrict.status === 200, 'RESTRICT action successfully applied (200 OK)');
    assert(resRestrict.body?.new_status === 'restricted', 'Target admin new_status is restricted');

    // Action 5: BLOCK subordinate admin
    const resBlock = await request('POST', `/api/admin/governance/admins/${createdZoneAdminId}/enforce`, SUPER_ADMIN_HEADERS, {
      action: 'BLOCK',
      reason: 'Critical security violation: access credential blocked'
    });
    assert(resBlock.status === 200, 'BLOCK action successfully applied (200 OK)');
    assert(resBlock.body?.new_status === 'blocked', 'Target admin new_status is blocked');

    // Re-activate for subsequent tests
    await request('POST', `/api/admin/governance/admins/${createdZoneAdminId}/enforce`, SUPER_ADMIN_HEADERS, {
      action: 'REINSTATE',
      reason: 'Reinstated for operational test continuity'
    });
  }

  // TEST SUITE 6: Zone Management & Multi-Zone Assignments
  console.log('\n--- SUITE 6: Zonal Sector Command & Assignments ---');
  {
    const resZones = await request('GET', '/api/admin/governance/zones', SUPER_ADMIN_HEADERS);
    assert(resZones.status === 200, 'GET /api/admin/governance/zones returns 200 OK');
    const zones = resZones.body?.data || [];
    assert(zones.length === 4, `Operational zones count is exactly 4 (found: ${zones.length})`);

    const zoneCodes = zones.map(z => z.zone_code).sort();
    assert(JSON.stringify(zoneCodes) === JSON.stringify(['EZ', 'NZ', 'SZ', 'WZ']), 'Zones are EZ, NZ, SZ, WZ');

    // Verify state & UT distribution across the 4 zones (total = 36)
    const totalStates = zones.reduce((sum, z) => sum + (z.state_count || 0), 0);
    const totalUTs = zones.reduce((sum, z) => sum + (z.ut_count || 0), 0);
    assert(totalStates === 28, `Total states across zones equals 28 (found: ${totalStates})`);
    assert(totalUTs === 8, `Total UTs across zones equals 8 (found: ${totalUTs})`);
    assert(totalStates + totalUTs === 36, `Total States + UTs equals 36 (found: ${totalStates + totalUTs})`);

    // Verify assigned admins array is present
    const szZone = zones.find(z => z.zone_code === 'SZ');
    assert(Array.isArray(szZone?.assigned_admins), 'Zone object contains assigned_admins array');

    // Multi-zone assignment
    const resAssign = await request('POST', '/api/admin/governance/zones/assign', SUPER_ADMIN_HEADERS, {
      admin_id: createdZoneAdminId,
      zone_codes: ['SZ', 'WZ'],
      primary_zone: 'SZ',
      reason: 'Dual-zone supervisory assignment for South & West'
    });
    assert(resAssign.status === 200, 'Multi-zone assignment for SZ & WZ succeeded (200 OK)');
    assert(Array.isArray(resAssign.body?.data), 'Updated scopes array returned');
    assert(resAssign.body?.data?.length === 2, `Admin now holds 2 zonal scopes (found: ${resAssign.body?.data?.length})`);
  }

  // TEST SUITE 7: Access & Permissions Capability Matrix
  console.log('\n--- SUITE 7: Capability Matrix & Scope Inheritance ---');
  {
    const resPerms = await request('GET', '/api/admin/governance/permissions', SUPER_ADMIN_HEADERS);
    assert(resPerms.status === 200, 'GET /api/admin/governance/permissions returns 200 OK');

    const matrix = resPerms.body?.matrix || [];
    assert(matrix.length === 6, `Matrix contains 6 roles (found: ${matrix.length})`);

    const expectedRoles = ['SUPER_ADMIN', 'ZONE_ADMIN', 'STATE_ADMIN', 'DISTRICT_ADMIN', 'COOPERATIVE_ADMIN', 'OPERATIONS_ADMIN'];
    const matrixRoles = matrix.map(m => m.role);
    const allRolesPresent = expectedRoles.every(r => matrixRoles.includes(r));
    assert(allRolesPresent, 'All 6 administrative roles present in matrix');

    const resources = resPerms.body?.resources || [];
    assert(resources.length === 14, `System defines exactly 14 resources (found: ${resources.length})`);

    const actions = resPerms.body?.actions || [];
    assert(actions.length === 9, `System defines exactly 9 actions (found: ${actions.length})`);

    // Verify Super Admin has '*' action across all resources
    const superAdminRow = matrix.find(m => m.role === 'SUPER_ADMIN');
    assert(superAdminRow?.permissions?.['*']?.includes('*'), 'SUPER_ADMIN has universal wildcard action ["*"]');
    assert(superAdminRow?.clearance_level === 5, 'SUPER_ADMIN clearance level is 5');

    // Verify hierarchy order
    const hierarchy = resPerms.body?.hierarchy || [];
    assert(hierarchy.length === 6, 'Hierarchy defines 6 downward scope tiers');
    assert(hierarchy[0].role === 'SUPER_ADMIN', 'Tier 1 is SUPER_ADMIN (Apex)');
    assert(hierarchy[5].role === 'OPERATIONS_ADMIN', 'Tier 6 is OPERATIONS_ADMIN');
  }

  // TEST SUITE 8: Immutable Enforcement History & Audit Trail
  console.log('\n--- SUITE 8: Enforcement History & Correlation Audit ---');
  {
    const resHistory = await request('GET', '/api/admin/governance/enforcement/history', SUPER_ADMIN_HEADERS);
    assert(resHistory.status === 200, 'GET /api/admin/governance/enforcement/history returns 200 OK');

    const history = resHistory.body?.data || [];
    assert(history.length >= 3, `Enforcement audit history records at least 3 actions (found: ${history.length})`);

    // Verify fields in recent enforcement records
    const recent = history[0];
    assert(Boolean(recent?.action_type), 'Enforcement entry has action_type');
    assert(Boolean(recent?.reason), 'Enforcement entry has reason');
    assert(Boolean(recent?.target_admin_name || recent?.target_admin_id), 'Enforcement entry identifies target admin');
    assert(Boolean(recent?.enacted_by_name || recent?.enacted_by), 'Enforcement entry identifies enacting admin');
    assert(Boolean(recent?.correlation_id), 'Enforcement entry includes correlation_id');
  }

  // CLEANUP: Clean up disposable test admin to prevent junk records
  if (createdZoneAdminId) {
    try {
      const dotenv = await import('dotenv');
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      const { createClient } = await import('@supabase/supabase-js');
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      dotenv.config({ path: path.join(__dirname, '../.env') });
      const client = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

      await client.from('admin_enforcement_actions').delete().eq('target_admin_id', createdZoneAdminId);
      await client.from('admin_scopes').delete().eq('admin_id', createdZoneAdminId);
      await client.from('admin_audit_logs').delete().eq('entity_id', createdZoneAdminId);
      await client.from('admin_accounts').delete().eq('id', createdZoneAdminId);
      console.log(`\n🧹 Cleaned up disposable test administrator (${createdZoneAdminId})`);
    } catch (cleanupErr) {
      console.warn('Cleanup warning:', cleanupErr.message);
    }
  }

  // SUMMARY REPORT
  console.log('\n======================================================================');
  console.log(`📊 PHASE 5B VERIFICATION COMPLETE: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('======================================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runGovernanceTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
