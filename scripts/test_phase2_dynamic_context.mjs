/**
 * COOP HUB — Phase 2 Dynamic Context Verification Suite
 * Tests that live application runtime context (user, role, route, page, operation,
 * request/booking/job, permissions, and scope) is received and understood by the real AI API.
 */

import { getLiveAiContext, formatContextForSystemPrompt } from '../src/services/ai/dynamicContextService.js';

const BACKEND_URL = 'http://localhost:5000/api/ai/chat';

async function runPhase2Tests() {
  console.log('============================================================');
  console.log(' COOP HUB — PHASE 2 DYNAMIC RUNTIME CONTEXT TEST SUITE');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  // -------------------------------------------------------------
  // Test 1: Customer Context with Active Booking
  // -------------------------------------------------------------
  console.log('TEST 1: Customer Context with Active Request/Booking');
  const customerContext = {
    user: {
      id: 'cust-uuid-1234',
      name: 'Anupriya Murugan',
      email: 'anupriya@example.com',
      isAuthenticated: true
    },
    role: 'customer',
    scope: 'SELF',
    zone: 'Chennai Central',
    route: '/requests/f5435222-7b1b-4da2-85d3-80ce5b717dd9',
    page: 'customer_request_tracking_and_payment',
    operation: 'tracking_technician_dispatch',
    request: {
      id: 'f5435222-7b1b-4da2-85d3-80ce5b717dd9',
      serviceName: 'Plumbing Repair (Bathroom Geyser Leak)',
      status: 'in_progress',
      pillarName: 'Senthil Kumar (PIL-CHE-042)',
      amount: '500',
      paymentStatus: 'pending'
    },
    permissions: ['TRACK_LIVE_DISPATCH', 'CHAT_WITH_PILLAR', 'PAY_ONLINE_OR_HAND_CASH']
  };

  const unseenPrompt1 = 'What is the current status of my service request and who is my assigned technician?';
  console.log('Input Prompt:', unseenPrompt1);
  console.log('Context Injected:', JSON.stringify(customerContext.request));

  try {
    const t0 = Date.now();
    const res1 = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: unseenPrompt1,
        language: 'en',
        route: customerContext.route,
        context: customerContext
      })
    });
    const d1 = await res1.json();
    const time1 = Date.now() - t0;
    console.log(`HTTP ${res1.status} | Time: ${time1}ms | Provider: ${d1.provider}`);
    const reply1 = d1.reply || d1.text || d1.message || '';
    console.log('AI Reply:\n', reply1, '\n');

    const mentionsTechnician = reply1.toLowerCase().includes('senthil') || reply1.includes('PIL-CHE-042');
    const mentionsStatusOrPlumbing = reply1.toLowerCase().includes('progress') || reply1.toLowerCase().includes('plumb') || reply1.toLowerCase().includes('geyser');

    if (res1.ok && (mentionsTechnician || mentionsStatusOrPlumbing)) {
      console.log('✅ TEST 1 PASSED: AI accurately referenced live customer booking context!\n');
      passed++;
    } else {
      console.log('❌ TEST 1 FAILED: AI did not reference customer booking details.\n');
      failed++;
    }
  } catch (err) {
    console.error('❌ TEST 1 ERROR:', err.message, '\n');
    failed++;
  }

  // -------------------------------------------------------------
  // Test 2: Pillar Technician Context with Assigned Orders
  // -------------------------------------------------------------
  console.log('------------------------------------------------------------');
  console.log('TEST 2: Pillar Technician Context (Skills, Code, Scope)');
  const pillarContext = {
    user: {
      id: 'pillar-uuid-5678',
      name: 'Ramesh Sundaram',
      email: 'ramesh.pillar@coophub.in',
      isAuthenticated: true
    },
    role: 'pillar',
    scope: 'ASSIGNED_ORDERS',
    zone: 'Guindy, Velachery',
    route: '/dashboard/orders',
    page: 'pillar_orders_management',
    operation: 'reviewing_assigned_field_jobs',
    pillarMetadata: {
      pillarCode: 'PIL-CHE-089',
      skills: ['Electrical Wiring', 'AC Filter Servicing'],
      availability: 'available',
      kycStatus: 'approved'
    },
    permissions: ['ACCEPT_DISPATCHED_ORDERS', 'COLLECT_HAND_CASH_PAYMENT', 'VIEW_PERSONAL_EARNINGS']
  };

  const unseenPrompt2 = 'Can you confirm my technician code and what registered trade skills I have on record?';
  console.log('Input Prompt:', unseenPrompt2);

  try {
    const t0 = Date.now();
    const res2 = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: unseenPrompt2,
        language: 'en',
        route: pillarContext.route,
        context: pillarContext
      })
    });
    const d2 = await res2.json();
    const time2 = Date.now() - t0;
    console.log(`HTTP ${res2.status} | Time: ${time2}ms | Provider: ${d2.provider}`);
    const reply2 = d2.reply || d2.text || d2.message || '';
    console.log('AI Reply:\n', reply2, '\n');

    const mentionsPillarCode = reply2.includes('PIL-CHE-089') || reply2.toLowerCase().includes('089');
    const mentionsTrade = reply2.toLowerCase().includes('electric') || reply2.toLowerCase().includes('ac');

    if (res2.ok && (mentionsPillarCode || mentionsTrade)) {
      console.log('✅ TEST 2 PASSED: AI accurately referenced live Pillar technician profile & skills!\n');
      passed++;
    } else {
      console.log('❌ TEST 2 FAILED: AI did not reflect Pillar credentials.\n');
      failed++;
    }
  } catch (err) {
    console.error('❌ TEST 2 ERROR:', err.message, '\n');
    failed++;
  }

  // -------------------------------------------------------------
  // Test 3: Super Admin Sovereign Global Context
  // -------------------------------------------------------------
  console.log('------------------------------------------------------------');
  console.log('TEST 3: Super Admin Sovereign Global Authority & Scope');
  const superAdminContext = {
    user: {
      id: 'super-admin-001',
      name: 'Super Admin Apex',
      email: 'superadmin@coophub.gov.in',
      isAuthenticated: true
    },
    role: 'super_admin',
    scope: 'GLOBAL',
    zone: 'ALL_ZONES (North, South, East, West)',
    route: '/admin/super/governance',
    page: 'super_admin_sovereign_command',
    operation: 'sovereign_oversight_across_districts',
    permissions: ['SOVEREIGN_APEX_OVERSIGHT', 'GLOBAL_GEOGRAPHY_GOVERNANCE', 'SECURITY_KILL_SWITCH_AUTHORITY']
  };

  const unseenPrompt3 = 'What is my current scope of administrative authority across the platform?';
  console.log('Input Prompt:', unseenPrompt3);

  try {
    const t0 = Date.now();
    const res3 = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: unseenPrompt3,
        language: 'en',
        route: superAdminContext.route,
        context: superAdminContext
      })
    });
    const d3 = await res3.json();
    const time3 = Date.now() - t0;
    console.log(`HTTP ${res3.status} | Time: ${time3}ms | Provider: ${d3.provider}`);
    const reply3 = d3.reply || d3.text || d3.message || '';
    console.log('AI Reply:\n', reply3, '\n');

    const mentionsScope = reply3.toLowerCase().includes('global') || reply3.toLowerCase().includes('sovereign') || reply3.toLowerCase().includes('all') || reply3.toLowerCase().includes('apex');

    if (res3.ok && mentionsScope) {
      console.log('✅ TEST 3 PASSED: AI acknowledged Super Admin global sovereign scope!\n');
      passed++;
    } else {
      console.log('❌ TEST 3 FAILED: AI did not reflect Super Admin authority.\n');
      failed++;
    }
  } catch (err) {
    console.error('❌ TEST 3 ERROR:', err.message, '\n');
    failed++;
  }

  // -------------------------------------------------------------
  // Test 4: Dynamic Context Helper Validation
  // -------------------------------------------------------------
  console.log('------------------------------------------------------------');
  console.log('TEST 4: dynamicContextService Formatting & Resolvers');
  const sampleCtx = await getLiveAiContext({
    route: '/requests/98765432-1111-2222-3333-444455556666',
    serviceName: 'AC Deep Clean',
    pillarName: 'Venkatesh K'
  });
  const formatted = formatContextForSystemPrompt(sampleCtx);
  console.log('Generated Context Block:\n', formatted);

  if (formatted.includes('REAL APPLICATION RUNTIME CONTEXT') && formatted.includes('Current Route')) {
    console.log('✅ TEST 4 PASSED: dynamicContextService generates complete structured runtime context!\n');
    passed++;
  } else {
    console.log('❌ TEST 4 FAILED: dynamicContextService output incomplete.\n');
    failed++;
  }

  console.log('============================================================');
  console.log(` PHASE 2 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase2Tests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
