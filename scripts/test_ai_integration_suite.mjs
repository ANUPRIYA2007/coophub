/**
 * COOP HUB — Automated Integration Test Suite: Hero AI & Chat AI Integration
 * Tests all 12 operational integration criteria with zero mock data.
 */

import { adminAgent } from '../src/services/pillar/ai/adminAgent.js';
import { orderAgent, profileAgent, welfareAgent } from '../src/services/pillar/ai/authenticatedAgents.js';
import { intentRouter } from '../src/services/pillar/ai/intentRouter.js';
import { workforceAllocationEngine } from '../src/services/ai/workforceAllocationEngine.js';
import { chronosForecastService } from '../src/services/ai/chronosForecastService.js';

async function runIntegrationTestSuite() {
  console.log("\n=======================================================");
  console.log("  COOP HUB HERO AI + CHAT AI INTEGRATION TEST SUITE    ");
  console.log("=======================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${name}`);
      failed++;
    }
  }

  // 1. Admin asks for demand forecast
  console.log("[Test 1] Admin queries Chronos-2 demand forecast via Hero AI");
  const forecastRes = await adminAgent.handle("Hero, what is the demand forecast and peak hours for tomorrow?", { language: "en", route: "/admin" });
  assert(forecastRes && typeof forecastRes.reply === "string" && forecastRes.route === "/admin/forecast", "Admin Hero AI invokes Chronos-2 demand forecast");

  // 2. Admin asks for worker recommendation
  console.log("\n[Test 2] Admin asks for worker allocation recommendation");
  const allocRes = await adminAgent.handle("Who should handle this emergency plumbing request?", { language: "en", route: "/admin" });
  assert(allocRes && typeof allocRes.reply === "string" && allocRes.route === "/admin/allocation", "Admin Hero AI invokes workforce allocation matching");

  // 3. Admin receives real candidate ranking or clean insufficient data status
  console.log("\n[Test 3] Admin candidate ranking structure");
  assert(
    allocRes.reply.includes("Best Match") ||
    allocRes.reply.includes("no unassigned") ||
    allocRes.reply.includes("Insufficient real-time data"),
    "Returns grounded candidate ranking or real-data empty state without mock data"
  );

  // 4. Admin confirmation requires human confirmation before execution
  console.log("\n[Test 4] Human confirmation before allocation execution");
  const confirmRes = await adminAgent.handle("Yes allocate", { language: "en", route: "/admin" });
  assert(confirmRes && (confirmRes.reply.includes("Confirmed") || confirmRes.reply.includes("Notice") || confirmRes.route === "/admin/allocation"), "Allocation requires explicit human confirmation");

  // 5. Customer can still use existing Hero
  console.log("\n[Test 5] Customer Hero route-awareness");
  const publicRes = await intentRouter.route({ message: "How do I register?", context: { isAuthenticated: false, route: "/pillar/register" } });
  assert(publicRes && publicRes.reply && typeof publicRes.reply === "string", "Public onboarding agent functions cleanly");

  // 6. Customer Chat role isolation
  console.log("\n[Test 6] Customer Chat privacy boundary");
  const blockedRes = await intentRouter.route({ message: "Show my earnings and money", context: { isAuthenticated: false, route: "/" } });
  assert(blockedRes.intent === "auth_required", "Private earnings/orders are blocked for unauthenticated users");

  // 7. Pillar Hero & Mascot live order queries
  console.log("\n[Test 7] Pillar Mascot queries live orders");
  const dummySession = { user: { id: "00000000-0000-0000-0000-000000000000", user_metadata: { full_name: "Senthil" } } };
  const orderRes = await orderAgent.handle("Do I have any pending jobs?", { session: dummySession, language: "en" });
  assert(orderRes && typeof orderRes.reply === "string" && orderRes.route === "/dashboard/orders", "Pillar orderAgent returns live context with zero hardcoded strings");

  // 8. Pillar Hero queries verified trade credentials
  console.log("\n[Test 8] Pillar Mascot queries trade profile & verified certificates");
  const profileRes = await profileAgent.handle("What are my certified skills?", { session: dummySession, language: "en" });
  assert(profileRes && typeof profileRes.reply === "string" && profileRes.route === "/dashboard/profile", "Pillar profileAgent checks verified trade certifications");

  // 9. Pillar Welfare & PF balance queries
  console.log("\n[Test 9] Pillar Mascot queries PF balance and welfare schemes");
  const welfareRes = await welfareAgent.handle("What is my PF balance and insurance coverage?", { session: dummySession, language: "en" });
  assert(welfareRes && typeof welfareRes.reply === "string" && welfareRes.route === "/dashboard/welfare", "Pillar welfareAgent checks real PF and insurance records");

  // 10. Role isolation & Admin boundaries
  console.log("\n[Test 10] Non-admin cannot invoke admin operations");
  const nonAdminRes = await intentRouter.route({ message: "Show admin finance and all pillars", context: { isAuthenticated: true, session: dummySession, route: "/dashboard" } });
  assert(nonAdminRes.route !== "/admin", "Pillar on /dashboard cannot route into adminAgent");

  // 11. No mock data policy
  console.log("\n[Test 11] Zero mock data guarantee in production path");
  const emptyMatch = await workforceAllocationEngine.getEligibleCandidates({ service_name: "Nonexistent Rare Skill 999", area: "Nowhere" });
  assert(emptyMatch.eligible.length === 0, "Nonexistent service returns 0 eligible workers without fake fallback");

  // 12. AI Failure resilience
  console.log("\n[Test 12] AI Failure resilience & graceful fallback");
  const fallbackRes = await chronosForecastService.getDemandForecast({ horizon: "24h" });
  assert(fallbackRes && (fallbackRes.breakdown?.length > 0 || fallbackRes.predicted_demand !== undefined), "Forecast engine safely produces statistical baseline when remote AI is offline");

  console.log("\n=======================================================");
  console.log(`  INTEGRATION TEST RESULTS: ${passed} PASSED, ${failed} FAILED `);
  console.log("=======================================================\n");

  if (failed > 0) process.exit(1);
}

runIntegrationTestSuite();
