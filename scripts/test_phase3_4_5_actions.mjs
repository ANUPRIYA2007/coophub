/**
 * Automated Verification Script for Phase 3, Phase 4, and Phase 5
 * Verifies Hero AI, Customer Chat AI, and Pillar AI with live Dynamic Context and Capability Resolution
 */

import { capabilityResolutionEngine } from '../src/services/ai/capabilityResolutionEngine.js';
import { aiService } from '../src/services/pillar/aiService.js';

async function runTests() {
  console.log('=== Starting Verification: Phase 3, 4, 5 (Zero Hardcoding) ===\n');

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

  // TEST 1: Phase 3 (Hero AI) — Unseen electrical hazard query
  console.log('--- TEST 1: Phase 3 (Hero AI) Action & YES/NO Capability ---');
  const heroRes = await aiService.chatWithMascot({
    message: "My ceiling fan stopped spinning and there is a burning electrical smell coming from the regulator.",
    context: {
      route: '/home',
      language: 'en',
      role: 'customer'
    }
  });

  assert(heroRes.reply && heroRes.reply.length > 20, "Hero AI returned intelligent reasoning reply");
  assert(heroRes.action && heroRes.action.path === '/services', "Hero AI resolved action path to '/services'");
  assert(heroRes.yesNoAction && heroRes.yesNoAction.yes && heroRes.yesNoAction.no, "Hero AI generated actionable YES/NO buttons");
  assert(heroRes.yesNoAction.yes.path === '/services', "Hero AI YES button points to '/services'");
  console.log('Hero AI Reply snippet:', heroRes.reply.slice(0, 100) + '...');
  console.log('Hero AI Action:', heroRes.action);
  console.log('Hero AI Yes/No Action:', heroRes.yesNoAction);

  // TEST 2: Phase 4 (Customer Chat AI) — Unseen live tracking query with dynamic active request
  console.log('\n--- TEST 2: Phase 4 (Customer Chat AI) Live Tracking with Active Context ---');
  const customerRes = await aiService.chatWithMascot({
    message: "Where is the electrician right now? Is he on his way?",
    context: {
      route: '/requests',
      language: 'en',
      role: 'customer',
      request: { id: 'f5435222-live-tracking', service: 'Electrician' }
    }
  });

  assert(customerRes.reply && customerRes.reply.length > 20, "Customer Chat AI returned intelligent tracking response");
  assert(customerRes.action && customerRes.action.path.includes('f5435222'), "Customer Chat AI dynamically bound active request ID into action path");
  assert(customerRes.yesNoAction && customerRes.yesNoAction.yes.path.includes('f5435222'), "Customer Chat AI YES button targets active booking tracking");
  console.log('Customer Chat AI Action:', customerRes.action);
  console.log('Customer Chat AI Yes/No Action:', customerRes.yesNoAction);

  // TEST 3: Phase 5 (Pillar AI) — Technician equipment / order management
  console.log('\n--- TEST 3: Phase 5 (Pillar AI) Technician Workflow & Orders ---');
  const pillarRes = await aiService.chatWithMascot({
    message: "I am ready for my morning dispatch. Which orders do I need to attend first?",
    context: {
      route: '/dashboard',
      language: 'en',
      role: 'pillar',
      pillarId: 'PIL-CHE-089'
    }
  });

  assert(pillarRes.reply && pillarRes.reply.length > 20, "Pillar AI provided technician guidance");
  assert(pillarRes.action && pillarRes.action.path === '/dashboard/orders', "Pillar AI action routed to '/dashboard/orders'");
  assert(pillarRes.yesNoAction && pillarRes.yesNoAction.yes.path === '/dashboard/orders', "Pillar AI YES button points to technician orders");
  console.log('Pillar AI Action:', pillarRes.action);
  console.log('Pillar AI Yes/No Action:', pillarRes.yesNoAction);

  // TEST 4: Phase 5 (Pillar AI) — Technician cash collection
  console.log('\n--- TEST 4: Phase 5 (Pillar AI) Hand Cash Collection Capability ---');
  const cashRes = await aiService.chatWithMascot({
    message: "The customer paid 350 rupees in hand cash after finishing the sink pipe replacement.",
    context: {
      route: '/dashboard/orders',
      language: 'en',
      role: 'pillar'
    }
  });

  assert(cashRes.action && cashRes.action.actionId === 'COLLECT_HAND_CASH', "Pillar AI identified COLLECT_HAND_CASH capability");
  assert(cashRes.yesNoAction && cashRes.yesNoAction.yes.actionId === 'COLLECT_HAND_CASH', "Pillar AI provided YES confirmation for cash collection");
  console.log('Cash Collection Action:', cashRes.action);

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
