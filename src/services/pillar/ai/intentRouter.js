import { registrationHelpAgent, authHelpAgent, publicInfoAgent } from "./publicAgents.js";
import { callPillarAiApi } from "./aiApi.js";
import { customerAgent } from "./customerAgent.js";
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
  welfareAgent,
  generalPillarAssistantAgent,
} from "./authenticatedAgents.js";

import { adminAgent } from "./adminAgent.js";
import { translateDynamic } from "../../../i18n/centralEngine.js";

// ============================================================
// INTENT ROUTER — AI-FIRST (No Keyword Interception)
// All natural-language understanding flows through NVIDIA NIM / Gemini API
// Route-based dispatching is preserved for role separation only
// ============================================================

export const intentRouter = {
  async route({ message, session, language = "en", route = "/dashboard", context = {} }) {
    const isAuthenticated = Boolean(session?.user || context.user?.isAuthenticated);

    // ============================================================
    // 1. ADMIN PORTAL — Route-based dispatch (legitimate role separation)
    // ============================================================
    if (route.startsWith("/admin") || context.role === "admin" || context.role === "super_admin") {
      return await adminAgent.handle(message, { language, route, context });
    }

    // ============================================================
    // 2. CUSTOMER PORTAL — Route-based dispatch (legitimate role separation)
    // ============================================================
    const customerRoutes = ["/home", "/services", "/requests", "/messages", "/history", "/support", "/settings", "/profile"];
    if (route.startsWith("/customer") || customerRoutes.some(cr => route === cr || (cr !== "/" && route.startsWith(cr))) || context.role === "customer") {
      return await customerAgent.handle(message, { language, route, context: { ...context, session } });
    }

    // ============================================================
    // 3. PUBLIC (Unauthenticated) — All queries go through real AI
    // ============================================================
    if (!isAuthenticated) {
      // All public queries go through publicInfoAgent which calls real AI API with context
      return await publicInfoAgent.handle(message, language, { route, context });
    }

    // ============================================================
    // 4. AUTHENTICATED PILLAR — ALL queries go to real AI API
    // No keyword-based sub-agent routing. The AI model interprets
    // the user's natural language directly with live job context.
    // ============================================================
    return await generalPillarAssistantAgent.handle(message, { session, language, route, context });
  },
};
