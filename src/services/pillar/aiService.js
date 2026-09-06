import { intentRouter } from "./ai/intentRouter.js";
import { getLiveAiContext } from "../ai/dynamicContextService.js";
import { capabilityResolutionEngine } from "../ai/capabilityResolutionEngine.js";

export const aiService = {
  /**
   * Unified chatWithMascot pipeline for all portals (Customer, Pillar, Admin)
   * Supports both (message, context) and ({ message, context }) signatures.
   */
  async chatWithMascot(arg1, arg2 = {}) {
    let message = '';
    let contextInput = {};

    if (typeof arg1 === 'string') {
      message = arg1;
      contextInput = arg2 || {};
    } else if (arg1 && typeof arg1 === 'object') {
      message = arg1.message || arg1.text || arg1.query || '';
      contextInput = arg1.context || arg1.options || arg1;
    }

    try {
      // Resolve comprehensive live runtime context (user, role, route, page, operation, job, scope, permissions)
      const liveContext = await getLiveAiContext(contextInput);
      const session = liveContext.session || contextInput.session || null;
      const language = contextInput.language || liveContext.language || 'en';
      const route = contextInput.route || liveContext.route || '/home';

      const result = await intentRouter.route({
        message,
        session,
        language,
        route,
        context: liveContext
      });
      const rawText = result?.reply || result?.text || result?.message || "I am right here to help you!";

      // Resolve authorized application capabilities & actionable YES/NO actions
      const capability = capabilityResolutionEngine.resolveCapability({
        query: message,
        aiReply: rawText,
        context: liveContext
      });

      return {
        reply: rawText,
        text: rawText,
        message: rawText,
        route: capability.action?.path || result?.route || null,
        provider: result?.provider || 'coophub_ai',
        intent: result?.intent || 'general_help',
        action: capability.action || result?.action || null,
        yesNoAction: capability.yesNoAction || null,
        context: liveContext,
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
