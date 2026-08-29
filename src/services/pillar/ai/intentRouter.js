import { registrationHelpAgent, authHelpAgent, publicInfoAgent } from "./publicAgents.js";
import { callPillarAiApi } from "./aiApi.js";
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

// ============================================================
// INTENT ROUTER — 100% LIVE AI (Zero Hardcoded Responses)
// Every route → Live NVIDIA Nemotron / Gemini API
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
        return await registrationHelpAgent.handle(message, language);
      }

      if (route.includes("login") || q.includes("otp") || q.includes("password") || q.includes("login")) {
        return await authHelpAgent.handle(message, language);
      }

      return await publicInfoAgent.handle(message, language);
    }

    // ============================================================
    // 3. AUTHENTICATED PILLAR AI MODE — Live Context + Multi-Model AI
    // ============================================================
    const ctx = { session, language, route };

    // Explicit Database Context Queries
    if (q.includes("my order") || q.includes("my booking") || q.includes("today order") || q.includes("active job") || q.includes("pending job") || q.includes("ஆர்டர்") || q.includes("ऑर्डर")) {
      return await orderAgent.handle(message, ctx);
    }

    if (q.includes("my earning") || q.includes("my payout") || q.includes("my balance") || q.includes("how much money") || q.includes("என் வருமானம்") || q.includes("मेरी कमाई")) {
      return await financeAgent.handle(message, ctx);
    }

    if (q.includes("my notification") || q.includes("new alert") || q.includes("அறிவிப்பு") || q.includes("सूचना")) {
      return await notificationAgent.handle(message, ctx);
    }

    if (q.includes("my message") || q.includes("customer chat") || q.includes("வாடிக்கையாளர் அரட்டை")) {
      return await communicationAgent.handle(message, ctx);
    }

    if (q.includes("my arrival otp") || q.includes("verify otp") || q.includes("gps location") || q.includes("arrival code")) {
      return await locationAgent.handle(message, ctx);
    }

    if (q.includes("create ticket") || q.includes("open complaint") || q.includes("support desk") || q.includes("உதவி டிக்கெட்")) {
      return await supportAgent.handle(message, ctx);
    }

    if (q.includes("my profile") || q.includes("my pillar id") || q.includes("my certificate") || q.includes("சுயவிவரம்")) {
      return await profileAgent.handle(message, ctx);
    }

    if (q.includes("change language") || q.includes("theme setting") || q.includes("அமைப்புகள்")) {
      return await settingsAgent.handle(message, ctx);
    }

    if (
      q.includes("my pf") ||
      q.includes("my insurance") ||
      q.includes("my claim") ||
      q.includes("welfare scheme") ||
      q.includes("pmjjby") ||
      q.includes("pmsby") ||
      q.includes("ayushman") ||
      q.includes("tnuwwb") ||
      q.includes("காப்பீடு") ||
      q.includes("வைப்பு நிதி")
    ) {
      return await welfareAgent.handle(message, ctx);
    }

    // ALL other queries (tools, technical questions, repairs, safety, customer handling, general assistant) → Live NVIDIA/Gemini API!
    return await generalPillarAssistantAgent.handle(message, ctx);
  },
};
