import { intentRouter } from "./ai/intentRouter.js";

export const aiService = {
  /**
   * Unified chatWithMascot pipeline for all portals (Customer, Pillar, Admin)
   * Supports both (message, context) and ({ message, context }) signatures.
   */
  async chatWithMascot(arg1, arg2 = {}) {
    let message = '';
    let context = {};

    if (typeof arg1 === 'string') {
      message = arg1;
      context = arg2 || {};
    } else if (arg1 && typeof arg1 === 'object') {
      message = arg1.message || arg1.text || arg1.query || '';
      context = arg1.context || arg1.options || arg1;
    }

    try {
      const result = await intentRouter.route({ message, context });
      const rawText = result?.reply || result?.text || result?.message || "I am right here to help you!";

      return {
        reply: rawText,
        text: rawText,
        message: rawText,
        route: result?.route || null,
        provider: result?.provider || 'coophub_ai',
        intent: result?.intent || 'general_help',
        action: result?.action || null,
        ...result
      };
    } catch (err) {
      console.warn("aiService chatWithMascot error:", err);
      const fallbackText = "I am ready to help you find verified technicians, track your service requests, and answer questions.";
      return {
        reply: fallbackText,
        text: fallbackText,
        message: fallbackText,
        route: null,
        provider: 'fallback',
        intent: 'fallback'
      };
    }
  },
};

export default aiService;
