import { registrationHelpAgent, authHelpAgent, publicInfoAgent } from "./publicAgents";
import { callPillarAiApi } from "./aiApi";
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
} from "./authenticatedAgents";

import { adminAgent } from "./adminAgent";

// ============================================================
// INTENT ROUTER — 100% LIVE AI (Zero Hardcoded Responses)
// Every route → Live NVIDIA / Gemini API via server proxy
// ============================================================

export const intentRouter = {
  async route({ message, context = {} }) {
    const { isAuthenticated, session, route = "/", language = "en" } = context;
    const q = message.toLowerCase().trim();

    // ============================================================
    // 1. ADMIN AI MODE (Cooperative Operations Intelligence)
    // ============================================================
    if (route.startsWith("/admin")) {
      return await adminAgent.handle(message, { language, route });
    }

    // ============================================================
    // 2. PUBLIC AI MODE (Before Authentication)
    // ============================================================
    if (!isAuthenticated) {
      // Block private data requests before login
      const isAskingPrivateData =
        q.includes("my order") ||
        q.includes("my earning") ||
        q.includes("my message") ||
        q.includes("my notification") ||
        q.includes("my profile") ||
        q.includes("my id") ||
        q.includes("my money") ||
        q.includes("பணம்") ||
        q.includes("என் ஆர்டர்") ||
        q.includes("मेरी कमाई") ||
        q.includes("मेरे ऑर्डर");

      if (isAskingPrivateData) {
        return {
          reply: language === "ta"
            ? "தனியார் தகவல்களைப் பார்க்க நீங்கள் முதலில் உள்நுழைய வேண்டும்."
            : "🔒 Authentication Required: Please log in to view your orders, earnings, and profile data.",
          intent: "auth_required",
          route: "/login",
        };
      }

      // ALL public queries → Live AI API
      if (route.includes("register") || q.includes("register") || q.includes("sign up") || q.includes("join")) {
        return await registrationHelpAgent.handle(q, language);
      }

      if (route.includes("login") || q.includes("otp") || q.includes("password") || q.includes("login")) {
        return await authHelpAgent.handle(q, language);
      }

      return await publicInfoAgent.handle(q, language);
    }

    // ============================================================
    // 3. AUTHENTICATED PILLAR AI MODE — Every Sub-Agent calls Live AI API
    // ============================================================
    const ctx = { session, language };

    if (q.includes("order") || q.includes("booking") || q.includes("job") || q.includes("ஆர்டர்") || q.includes("ऑर्डर")) {
      return await orderAgent.handle(q, ctx);
    }

    if (q.includes("earning") || q.includes("money") || q.includes("payment") || q.includes("payout") || q.includes("வருமானம்") || q.includes("कमाई")) {
      return await financeAgent.handle(q, ctx);
    }

    if (q.includes("notification") || q.includes("alert") || q.includes("அறிவிப்பு") || q.includes("सूचना")) {
      return await notificationAgent.handle(q, ctx);
    }

    if (q.includes("chat") || q.includes("message") || q.includes("call") || q.includes("customer") || q.includes("வாடிக்கையாளர்")) {
      return await communicationAgent.handle(q, ctx);
    }

    if (q.includes("arrive") || q.includes("location") || q.includes("map") || q.includes("travel") || q.includes("இடம்")) {
      return await locationAgent.handle(q, ctx);
    }

    if (q.includes("support") || q.includes("help") || q.includes("ticket") || q.includes("complaint") || q.includes("உதவி")) {
      return await supportAgent.handle(q, ctx);
    }

    if (q.includes("profile") || q.includes("id") || q.includes("skill") || q.includes("area") || q.includes("சுயவிவரம்")) {
      return await profileAgent.handle(q, ctx);
    }

    if (q.includes("setting") || q.includes("language") || q.includes("அமைப்புகள்") || q.includes("भाषा")) {
      return await settingsAgent.handle(q, ctx);
    }

    if (
      q.includes("pf") ||
      q.includes("provident") ||
      q.includes("welfare") ||
      q.includes("insurance") ||
      q.includes("policy") ||
      q.includes("claim") ||
      q.includes("coverage") ||
      q.includes("nominee") ||
      q.includes("scheme") ||
      q.includes("pmjjby") ||
      q.includes("pmsby") ||
      q.includes("pmsym") ||
      q.includes("ayushman") ||
      q.includes("tnuwwb") ||
      q.includes("காப்பீடு") ||
      q.includes("வைப்பு நிதி") ||
      q.includes("திட்டம்") ||
      q.includes("பாலிசி")
    ) {
      return await welfareAgent.handle(q, ctx);
    }

    // General route-aware query → Live AI API directly
    return await navigationAgent.handle(route, language, session);
  },
};
