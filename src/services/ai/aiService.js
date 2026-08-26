// ===========================
// COOP HUB — AI Service Interface
// ===========================
// All AI API calls (NVIDIA / Gemini) MUST go through a secure backend.
// This module defines the frontend interface only.

/**
 * AI Service — Frontend Interface
 *
 * Architecture:
 *   Customer UI → aiService → Backend API → NVIDIA → (fallback) Gemini → (fallback) Rule-based
 *
 * Two distinct AI experiences:
 * 1. Mascot AI  — proactive guidance, contextual tips, greeting, status reactions
 * 2. Chat Agent — natural language service booking, worker matching, booking flow
 */

const AI_BACKEND_URL = '/api/ai'; // Will point to the secure backend endpoint

/**
 * Send a message to the AI backend and receive a response.
 * @param {string} message - User's message
 * @param {object} context - Contextual data (page, booking status, user profile, etc.)
 * @param {'mascot'|'chat'} agent - Which AI agent to use
 * @returns {Promise<object>} AI response
 */
export async function sendMessage(message, context = {}, agent = 'chat') {
    // Implementation will call the secure backend
    throw new Error('AI service not yet connected to backend.');
}

/**
 * Get a suggestion based on current application context.
 * Used by the Mascot AI for proactive guidance.
 * @param {object} context - Current app state/context
 * @returns {Promise<object>} Suggestion response
 */
export async function getSuggestion(context = {}) {
    throw new Error('AI service not yet connected to backend.');
}

/**
 * Get contextual guidance for the current page/action.
 * Used by the Mascot AI.
 * @param {string} pageKey - Current page identifier
 * @param {object} context - Additional context
 * @returns {Promise<object>} Guidance response
 */
export async function getContextualGuidance(pageKey, context = {}) {
    throw new Error('AI service not yet connected to backend.');
}

export default {
    sendMessage,
    getSuggestion,
    getContextualGuidance,
};
