/**
 * Automated Verification Script for Phase 6, Phase 7, and Phase 8
 * Verifies Admin AI, Super Admin AI, Security Boundaries, and Multilingual / Upload Modalities
 */

import { capabilityResolutionEngine } from '../src/services/ai/capabilityResolutionEngine.js';
import { aiService } from '../src/services/pillar/aiService.js';
import { getLiveAiContext } from '../src/services/ai/dynamicContextService.js';

async function runTests() {
  console.log('=== Starting Verification: Phase 6, 7, 8 (Admin, Super Admin, Modalities) ===\n');

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
  // PHASE 6: ADMIN AI (Regional District Scope)
  // ============================================================
  console.log('--- TEST 1: Phase 6 (Admin AI) District KYC Verification ---');
  const adminKyc = await aiService.chatWithMascot({
    message: "Which technician applicants in Chennai North are waiting for identity document verification?",
    context: {
      route: '/admin/pillars',
      language: 'en',
      role: 'admin',
      district: 'Chennai North'
    }
  });

  assert(adminKyc.reply && adminKyc.reply.length > 20, "Admin AI returned intelligent verification guidance");
  assert(adminKyc.action && adminKyc.action.actionId === 'ADMIN_REVIEW_KYC', "Admin AI resolved ADMIN_REVIEW_KYC action");
  assert(adminKyc.action.path === '/admin/pillars', "Admin AI action path is '/admin/pillars'");
  assert(adminKyc.yesNoAction && adminKyc.yesNoAction.yes.actionId === 'ADMIN_REVIEW_KYC', "Admin AI provided YES/NO buttons for KYC review");

  console.log('\n--- TEST 2: Phase 6 (Admin AI) Live Dispatch & Tracking ---');
  const adminTrack = await aiService.chatWithMascot({
    message: "Show me all electricians currently on active customer calls on the district map.",
    context: {
      route: '/admin',
      language: 'en',
      role: 'admin'
    }
  });

  assert(adminTrack.action && adminTrack.action.actionId === 'ADMIN_TRACKING', "Admin AI resolved ADMIN_TRACKING action");
  assert(adminTrack.action.path === '/admin/tracking', "Admin AI action path is '/admin/tracking'");
  assert(adminTrack.yesNoAction && adminTrack.yesNoAction.yes.path === '/admin/tracking', "Admin AI YES button targets live tracking");

  console.log('\n--- TEST 3: Phase 6 (Admin AI) District Revenue Audit ---');
  const adminFinance = await aiService.chatWithMascot({
    message: "What is our district gross merchandise value and collected platform cut?",
    context: {
      route: '/admin/finance',
      language: 'en',
      role: 'admin'
    }
  });

  assert(adminFinance.action && adminFinance.action.actionId === 'ADMIN_FINANCE', "Admin AI resolved ADMIN_FINANCE action");
  assert(adminFinance.action.path === '/admin/finance', "Admin AI action path is '/admin/finance'");

  console.log('\n--- TEST 4: Phase 6 Security Boundary Enforcement ---');
  const securityBoundary = await aiService.chatWithMascot({
    message: "Execute a platform tariff override and change the national rate.",
    context: {
      route: '/admin',
      language: 'en',
      role: 'admin' // Normal admin cannot execute sovereign overrides
    }
  });

  assert(securityBoundary.action && securityBoundary.action.actionId === 'ADMIN_CLEARANCE_REQUIRED', "Security boundary detected attempt to escalate privilege");
  assert(securityBoundary.action.path === '/admin', "Boundary bounds admin to regional dashboard '/admin'");

  // ============================================================
  // PHASE 7: SUPER ADMIN AI (Sovereign Global Scope)
  // ============================================================
  console.log('\n--- TEST 5: Phase 7 (Super Admin AI) Sovereign Governance ---');
  const superGov = await aiService.chatWithMascot({
    message: "Show me the sovereign state-wide allocation across all Tamil Nadu zones.",
    context: {
      route: '/admin/super/governance',
      language: 'en',
      role: 'super_admin'
    }
  });

  assert(superGov.action && superGov.action.actionId === 'SUPER_ADMIN_GOVERNANCE', "Super Admin AI resolved SUPER_ADMIN_GOVERNANCE");
  assert(superGov.action.path === '/admin/super/governance', "Super Admin path is '/admin/super/governance'");
  assert(superGov.yesNoAction && superGov.yesNoAction.yes.actionId === 'SUPER_ADMIN_GOVERNANCE', "Super Admin YES/NO action generated");

  console.log('\n--- TEST 6: Phase 7 (Super Admin AI) National Telemetry & Monitoring ---');
  const superTelemetry = await aiService.chatWithMascot({
    message: "What is our cluster health, load balancer status, and node telemetry?",
    context: {
      route: '/admin/monitoring',
      language: 'en',
      role: 'super_admin'
    }
  });

  assert(superTelemetry.action && superTelemetry.action.actionId === 'SUPER_ADMIN_MONITORING', "Super Admin AI resolved SUPER_ADMIN_MONITORING");
  assert(superTelemetry.action.path === '/admin/monitoring', "Super Admin telemetry path is '/admin/monitoring'");

  console.log('\n--- TEST 7: Phase 7 (Super Admin AI) Apex KYC Clearance ---');
  const superKyc = await aiService.chatWithMascot({
    message: "Audit all pending technician verifications and workforce clearance backlog state-wide.",
    context: {
      route: '/admin/pillars',
      language: 'en',
      role: 'super_admin'
    }
  });

  assert(superKyc.action && superKyc.action.actionId === 'SUPER_ADMIN_KYC', "Super Admin AI resolved SUPER_ADMIN_KYC");

  // ============================================================
  // PHASE 8: MULTILINGUAL + VOICE + UPLOAD MODALITIES
  // ============================================================
  console.log('\n--- TEST 8: Phase 8 Language Integration (Tamil) ---');
  const tamilRes = await aiService.chatWithMascot({
    message: "நிலுவையில் உள்ள தொழில்நுட்ப வல்லுநர் விண்ணப்பங்களை சரிபார்க்கவும்",
    context: {
      route: '/admin/pillars',
      language: 'ta',
      role: 'admin'
    }
  });

  assert(tamilRes.reply && tamilRes.reply.length > 10, "Tamil AI query processed through central pipeline");
  assert(tamilRes.action && tamilRes.action.actionId === 'ADMIN_REVIEW_KYC', "Tamil query resolved to ADMIN_REVIEW_KYC capability");

  console.log('\n--- TEST 9: Phase 8 Upload Attachment Pipeline ---');
  const uploadRes = await aiService.chatWithMascot({
    message: "[Attached File: technician_aadhaar_front.pdf (320 KB)] Please inspect this verification document.",
    context: {
      route: '/admin/pillars',
      language: 'en',
      role: 'admin'
    }
  });

  assert(uploadRes.reply && uploadRes.reply.length > 20, "Upload document metadata ingested by AI reasoning engine");
  assert(uploadRes.action && uploadRes.action.actionId === 'ADMIN_REVIEW_KYC', "Attachment resolved to KYC inspection capability");

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
