// Public Sub-Agents: Live AI-powered (NVIDIA / Gemini) for pre-auth users
import { callPillarAiApi } from "./aiApi";

async function getLivePublicReply({ prompt, language, route, fallback }) {
  try {
    const aiResponse = await callPillarAiApi({ prompt, language, route });
    if (aiResponse && aiResponse.reply) {
      return {
        reply: aiResponse.reply,
        provider: aiResponse.provider,
        intent: aiResponse.intent || "ai_public_reply",
      };
    }
  } catch (err) {
    console.warn("Public Live AI call failed:", err.message);
  }
  return { reply: fallback, intent: "ai_fallback" };
}

export const registrationHelpAgent = {
  async handle(query, language = "en") {
    return getLivePublicReply({
      prompt: `User is on the Pillar Registration page and asks: "${query}". Explain the COOP HUB Pillar registration process in 2-3 concise sentences. Steps: 1) Personal Details (Name, Email, Mobile, Password) 2) Service Profile (Trade, Skills, Experience, Areas). Keep it helpful and direct.`,
      language,
      route: "/register",
      fallback: "Register as a Pillar in 2 easy steps: Personal Details then Service Profile. Fill the form to get started!",
    });
  },
};

export const authHelpAgent = {
  async handle(query, language = "en") {
    return getLivePublicReply({
      prompt: `User is on the Login page and asks: "${query}". Help them with COOP HUB login (Password or OTP methods), forgot password, or OTP verification. Give a concise 1-2 sentence response.`,
      language,
      route: "/login",
      fallback: "You can sign in using your Password or one-time Mobile OTP. Let me know if you need help!",
    });
  },
};

export const publicInfoAgent = {
  async handle(query, language = "en") {
    return getLivePublicReply({
      prompt: `User asks: "${query}". They are not logged in. Explain what COOP HUB Pillars are — verified skilled service professionals (Electricians, Plumbers, Technicians) who receive direct customer bookings and fast payouts. Be concise, 1-2 sentences.`,
      language,
      route: "/",
      fallback: "I am CoopBot, your COOP HUB AI Assistant! Ask me about registering as a Pillar or how the platform works.",
    });
  },
};
