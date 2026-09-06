// ============================================================
// COOP HUB — Production AI Intelligence API Connector
// Zero Mock Cheating • Live NVIDIA Nemotron & Gemini Multi-Model Pipeline
// ============================================================

const NVIDIA_API_KEY = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_NVIDIA_API_KEY : null) || 
                       (typeof process !== 'undefined' && process.env ? process.env.NVIDIA_API_KEY : null) || null;

const rawModel = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_NVIDIA_MODEL : null) || 
                   (typeof process !== 'undefined' && process.env ? process.env.NVIDIA_MODEL : null);
const NVIDIA_MODEL = (rawModel && !rawModel.includes('nemotron-parse')) ? rawModel : "meta/llama-3.2-11b-vision-instruct";

const GEMINI_API_KEY = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GEMINI_API_KEY : null) ||
                       (typeof process !== 'undefined' && process.env ? process.env.GEMINI_API_KEY : null) || null;

import { getLanguageMetadata } from "../../../i18n/languages.js";
import { translateDynamic } from "../../../i18n/centralEngine.js";
import { formatContextForSystemPrompt } from "../../ai/dynamicContextService.js";

export async function callPillarAiApi({ prompt, language = "en", route = "/", context = {} }) {
  const langMeta = getLanguageMetadata(language);
  const langName = langMeta?.name || "English";
  const contextBlock = context ? formatContextForSystemPrompt(context) : '';

  const systemPrompt = `You are CoopBot, the intelligent 24/7 AI Companion and Assistant for customers, certified technicians (Pillars), and administrators in the COOP HUB cooperative platform in Chennai.
${contextBlock ? `\n${contextBlock}\n` : ''}
Respond directly, professionally, and helpfully in ${langName}. If asking about services, repairs, booking, pricing, verification, or tools, provide a thorough, structured, and practical guide with clear bullet points. Keep tone polite, empowering, and accurate.`;

  // 1. Primary: Backend Proxy (keeps API keys server-side, avoids CORS)
  try {
    const serverBase = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SERVER_URL)
      ? import.meta.env.VITE_SERVER_URL.replace(/\/+$/, '')
      : '';
    const backendUrl = `${serverBase}/api/ai/chat`;
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, language, route, context }),
    });
    if (response.ok) {
      const data = await response.json();
      const replyText = data.text || data.reply || data.message;
      if (replyText) {
        return {
          reply: replyText,
          provider: data.provider || "COOP HUB AI",
          intent: "ai_live_reply",
        };
      }
    } else {
      console.warn(`Backend proxy HTTP ${response.status}. Trying direct NVIDIA...`);
    }
  } catch (err) {
    console.warn("Backend proxy unavailable:", err.message);
  }

  // 2. Secondary: Direct NVIDIA NIM API (may be CORS-blocked from browser)
  if (NVIDIA_API_KEY) {
    try {
      const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${NVIDIA_API_KEY}`,
        },
        body: JSON.stringify({
          model: NVIDIA_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          temperature: 0.6,
          max_tokens: 600,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data?.choices?.[0]?.message?.content;
        if (reply && reply.trim().length > 0) {
          return {
            reply: reply.trim(),
            provider: `NVIDIA NIM (${NVIDIA_MODEL.split('/').pop()})`,
            intent: "ai_live_reply",
          };
        }
      }
    } catch (err) {
      console.warn("Direct NVIDIA NIM API failed:", err.message);
    }
  }

  // 3. Tertiary: Direct Google Gemini API (may be CORS-blocked or quota-limited)
  if (GEMINI_API_KEY) {
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: `${systemPrompt}\n\nUser Question: ${prompt}` },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 600,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply && reply.trim().length > 0) {
          return {
            reply: reply.trim(),
            provider: "Google Gemini 3.6 Flash",
            intent: "ai_live_reply",
          };
        }
      }
    } catch (err) {
      console.warn("Direct Gemini API failed:", err.message);
    }
  }

  // 4. All providers failed — honest error (no fake keyword fallback)
  return {
    reply: "⚠️ AI service is temporarily unavailable. All providers (NVIDIA NIM, Gemini, Backend Proxy) could not be reached. Please try again shortly.",
    provider: "none",
    intent: "ai_provider_failure"
  };
}
