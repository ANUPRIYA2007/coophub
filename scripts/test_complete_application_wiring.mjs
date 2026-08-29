/**
 * COOP HUB — End-to-End Application Wiring Verification Suite
 * Verifies all services, routers, modules, database interfaces, AI engines, and export integrity.
 */

import { supabase } from '../src/lib/supabase.js';

// 1. AI Services Wiring
import { workforceAllocationEngine } from '../src/services/ai/workforceAllocationEngine.js';
import { chronosForecastService } from '../src/services/ai/chronosForecastService.js';
import { demandForecastService } from '../src/services/ai/demandForecastService.js';
import { documentExtractionService } from '../src/services/ai/documentExtractionService.js';
import { documentValidationService } from '../src/services/ai/documentValidationService.js';
import { geminiDocumentService } from '../src/services/ai/geminiDocumentService.js';
import { nvidiaDocumentService } from '../src/services/ai/nvidiaDocumentService.js';
import { matchingService } from '../src/services/ai/matchingService.js';
import { aiService as generalAiService } from '../src/services/ai/aiService.js';

// 2. Pillar AI & Sub-agents Wiring
import { aiService as pillarAiService } from '../src/services/pillar/aiService.js';
import { intentRouter } from '../src/services/pillar/ai/intentRouter.js';
import { adminAgent } from '../src/services/pillar/ai/adminAgent.js';
import {
  orderAgent,
  financeAgent,
  notificationAgent,
  communicationAgent,
  locationAgent,
  supportAgent,
  profileAgent,
  settingsAgent,
  navigationAgent,
  welfareAgent
} from '../src/services/pillar/ai/authenticatedAgents.js';
import {
  registrationHelpAgent,
  authHelpAgent,
  publicInfoAgent
} from '../src/services/pillar/ai/publicAgents.js';

// 3. Domain Services Wiring
import { pillarAuthService } from '../src/services/pillar/authService.js';
import { pillarProfileService } from '../src/services/pillar/profileService.js';
import { ocrService } from '../src/services/pillar/ocrService.js';
import { certificationService } from '../src/services/pillar/certificationService.js';
import { adminService } from '../src/modules/admin/services/adminService.js';

async function verifyAllWiring() {
  console.log("\n=======================================================");
  console.log("     COOP HUB END-TO-END APPLICATION WIRING AUDIT      ");
  console.log("=======================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`  ✓ WIRED: ${name}`);
      passed++;
    } else {
      console.error(`  ✗ BROKEN: ${name}`);
      failed++;
    }
  }

  // --- SECTION 1: SUPABASE CLIENT & CONFIGURATION WIRING ---
  console.log("[Wiring Section 1] Database & Supabase Client Wiring");
  assert(supabase && typeof supabase.from === 'function', "Supabase client interface is properly initialized");
  assert(typeof supabase.auth?.getSession === 'function', "Supabase Auth module is wired");

  // --- SECTION 2: AI ENGINES & FORECASTING INFRASTRUCTURE ---
  console.log("\n[Wiring Section 2] AI Engines & Forecasting Infrastructure");
  assert(workforceAllocationEngine && typeof workforceAllocationEngine.scoreCandidate === 'function', "Workforce Allocation Engine is wired");
  assert(typeof workforceAllocationEngine.allocateBestPillar === 'function', "Workforce Auto-Allocation is wired");
  assert(typeof workforceAllocationEngine.reallocateRequest === 'function', "Workforce Reallocation is wired");
  assert(typeof workforceAllocationEngine.adminOverrideAllocation === 'function', "Workforce Admin Override is wired");

  assert(chronosForecastService && typeof chronosForecastService.getDemandForecast === 'function', "Amazon Chronos-2 Forecasting Service is wired");
  assert(typeof chronosForecastService.calculateWorkforceShortage === 'function', "Chronos-2 Shortage Calculator is wired");
  assert(demandForecastService && typeof demandForecastService.getDemandForecast === 'function', "Demand Forecast Router is wired");

  assert(matchingService && typeof matchingService.matchWorkforceForRequest === 'function', "Intelligent Matching Service is wired");

  // --- SECTION 3: DOCUMENT EXTRACTION & OCR PIPELINE WIRING ---
  console.log("\n[Wiring Section 3] Multimodal Document Extraction & OCR Pipeline");
  assert(documentExtractionService && typeof documentExtractionService.processDocument === 'function', "Document Extraction Orchestrator is wired");
  assert(documentValidationService && typeof documentValidationService.validateExtraction === 'function', "Deterministic Document Validator is wired");
  assert(geminiDocumentService && typeof geminiDocumentService.structureDocument === 'function', "Gemini Document Understanding is wired");
  assert(nvidiaDocumentService && typeof nvidiaDocumentService.extractDocumentStructure === 'function', "NVIDIA Nemotron Document Parse is wired");
  assert(ocrService && typeof ocrService.extractDocumentInformation === 'function', "Pillar OCR Service is wired");
  assert(generalAiService && typeof generalAiService.extractDocumentWithVisionAI === 'function', "General AI Vision Service is wired");

  // --- SECTION 4: INTENT ROUTING & SUB-AGENTS WIRING ---
  console.log("\n[Wiring Section 4] Intent Routing & Specialized Sub-Agents");
  assert(pillarAiService && typeof pillarAiService.chatWithMascot === 'function', "Pillar AI Mascot Service is wired");
  assert(intentRouter && typeof intentRouter.route === 'function', "Role-Based Intent Router is wired");
  assert(adminAgent && typeof adminAgent.handle === 'function', "Admin Operational Agent is wired");

  assert(orderAgent && typeof orderAgent.handle === 'function', "Pillar orderAgent is wired");
  assert(financeAgent && typeof financeAgent.handle === 'function', "Pillar financeAgent is wired");
  assert(notificationAgent && typeof notificationAgent.handle === 'function', "Pillar notificationAgent is wired");
  assert(communicationAgent && typeof communicationAgent.handle === 'function', "Pillar communicationAgent is wired");
  assert(locationAgent && typeof locationAgent.handle === 'function', "Pillar locationAgent is wired");
  assert(supportAgent && typeof supportAgent.handle === 'function', "Pillar supportAgent is wired");
  assert(profileAgent && typeof profileAgent.handle === 'function', "Pillar profileAgent is wired");
  assert(settingsAgent && typeof settingsAgent.handle === 'function', "Pillar settingsAgent is wired");
  assert(navigationAgent && typeof navigationAgent.handle === 'function', "Pillar navigationAgent is wired");
  assert(welfareAgent && typeof welfareAgent.handle === 'function', "Pillar welfareAgent is wired");

  assert(registrationHelpAgent && typeof registrationHelpAgent.handle === 'function', "Public registrationHelpAgent is wired");
  assert(authHelpAgent && typeof authHelpAgent.handle === 'function', "Public authHelpAgent is wired");
  assert(publicInfoAgent && typeof publicInfoAgent.handle === 'function', "Public publicInfoAgent is wired");

  // --- SECTION 5: DOMAIN & ADMIN SERVICES WIRING ---
  console.log("\n[Wiring Section 5] Domain Services & Admin Operations");
  assert(pillarAuthService && typeof pillarAuthService.login === 'function', "Pillar Auth Service is wired");
  assert(pillarProfileService && typeof pillarProfileService.getProfile === 'function', "Pillar Profile Service is wired");
  assert(certificationService && typeof certificationService.getMyCertifications === 'function', "Pillar Certification Service is wired");
  assert(adminService && typeof adminService.getCustomers === 'function', "Admin Customer Directory Service is wired");
  assert(typeof adminService.getAllPillars === 'function', "Admin Pillar Directory Service is wired");
  assert(typeof adminService.getDashboardStats === 'function', "Admin Stats Service is wired");

  // --- SECTION 6: LIVE INTERACTION TEST ---
  console.log("\n[Wiring Section 6] End-to-End Live Routing Interaction Test");
  const testPillarContext = {
    isAuthenticated: true,
    session: { user: { id: "00000000-0000-0000-0000-000000000000", user_metadata: { full_name: "Rajan" } } },
    route: "/dashboard/orders",
    language: "en"
  };

  const routedOrderRes = await intentRouter.route({ message: "Check my orders", context: testPillarContext });
  assert(routedOrderRes && routedOrderRes.route === "/dashboard/orders", "Pillar intent routed cleanly to orderAgent");

  const testAdminRes = await adminAgent.handle("What is the demand forecast for tomorrow?", { language: "en", route: "/admin" });
  assert(testAdminRes && testAdminRes.route === "/admin/forecast", "Admin query routed cleanly to Chronos-2 forecast engine");

  console.log("\n=======================================================");
  console.log(`  WIRING AUDIT RESULT: ${passed} WIRED, ${failed} BROKEN `);
  console.log("=======================================================\n");

  if (failed > 0) process.exit(1);
}

verifyAllWiring();
