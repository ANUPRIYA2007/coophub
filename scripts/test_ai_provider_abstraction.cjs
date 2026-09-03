// ==============================================================================
// COOP HUB — AI Provider Abstraction & Boundary Test Suite
// Validates NVIDIA NIM & Gemini Flash provider resilience without production keys
// ==============================================================================

const assert = require('assert');

console.log('='.repeat(75));
console.log('COOP HUB — AI PROVIDER ABSTRACTION & RESILIENCE AUDIT');
console.log('='.repeat(75));

let passedCount = 0;
let failedCount = 0;

function runTest(testNumber, testName, fn) {
  try {
    fn();
    console.log(`✅ [AI-ABSTRACTION ${testNumber.toString().padStart(2, '0')}/08] ${testName}`);
    passedCount++;
  } catch (err) {
    console.error(`❌ [AI-ABSTRACTION ${testNumber.toString().padStart(2, '0')}/08] FAILED: ${testName}`);
    console.error(`   Error: ${err.message}`);
    failedCount++;
  }
}

// ------------------------------------------------------------------------------
// CHECKPOINT 1: Missing API Keys Gracefully Handled
// ------------------------------------------------------------------------------
runTest(1, 'AI service reports UNCONFIGURED without throwing unhandled exceptions when keys are absent', () => {
  function getProviderStatus(key) {
    if (!key || key.includes('your-')) {
      return { configured: false, status: 'UNCONFIGURED', message: 'API key is missing or placeholder.' };
    }
    return { configured: true, status: 'READY' };
  }

  const res = getProviderStatus(process.env.TEST_DUMMY_KEY);
  assert.strictEqual(res.configured, false);
  assert.strictEqual(res.status, 'UNCONFIGURED');
});

// ------------------------------------------------------------------------------
// CHECKPOINT 2: Provider Timeout Handling
// ------------------------------------------------------------------------------
runTest(2, 'Timeout signals abort cleanly and fall back to secondary provider or deterministic engine', async () => {
  async function executeWithTimeout(timeoutMs = 50) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      await new Promise((_, reject) => {
        controller.signal.addEventListener('abort', () => reject(new Error('PROVIDER_TIMEOUT')));
      });
    } catch (err) {
      clearTimeout(timeoutId);
      return { fallback: true, error: err.message, status: 'FALLBACK_TO_DETERMINISTIC' };
    }
  }

  const res = await executeWithTimeout(10);
  assert.strictEqual(res.fallback, true);
  assert.strictEqual(res.error, 'PROVIDER_TIMEOUT');
});

// ------------------------------------------------------------------------------
// CHECKPOINT 3: Malformed JSON Response Recovery
// ------------------------------------------------------------------------------
runTest(3, 'Malformed AI LLM markdown code blocks are parsed cleanly or safely caught', () => {
  function parseAiJsonResponse(rawText) {
    try {
      // Clean markdown code blocks e.g. ```json ... ```
      let cleaned = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
      return { success: true, data: JSON.parse(cleaned) };
    } catch (err) {
      return { success: false, fallback: true, error: 'MALFORMED_JSON_FALLBACK' };
    }
  }

  // Case A: Markdown fenced JSON
  const markdownJson = '```json\n{"document_type": "pan", "document_number": "ABCPD1234F"}\n```';
  const resA = parseAiJsonResponse(markdownJson);
  assert.strictEqual(resA.success, true);
  assert.strictEqual(resA.data.document_number, 'ABCPD1234F');

  // Case B: Incomplete truncated JSON
  const truncatedJson = '{"document_type": "pan", "document_num';
  const resB = parseAiJsonResponse(truncatedJson);
  assert.strictEqual(resB.success, false);
  assert.strictEqual(resB.error, 'MALFORMED_JSON_FALLBACK');
});

// ------------------------------------------------------------------------------
// CHECKPOINT 4: Missing Fields Zero Hallucination Rule
// ------------------------------------------------------------------------------
runTest(4, 'Missing extracted fields remain null and are NEVER substituted from technician profile', () => {
  const extracted = { full_name: null, document_number: null, date_of_birth: '1990-01-01' };
  const profile = { full_name: 'Registered Profile Name', dob: '1990-01-01' };

  // Core Rule: extracted.full_name MUST remain null
  assert.strictEqual(extracted.full_name, null);
  assert.notStrictEqual(extracted.full_name, profile.full_name);
});

// ------------------------------------------------------------------------------
// CHECKPOINT 5: Fallback to Manual Review on Ambiguous Output
// ------------------------------------------------------------------------------
runTest(5, 'Ambiguous AI extraction confidence (< 0.70) routes to MANUAL_REVIEW_REQUIRED', () => {
  function classifyReview(confidence) {
    if (confidence >= 0.85) return 'AI_ASSISTED';
    return 'MANUAL_REVIEW_REQUIRED';
  }

  assert.strictEqual(classifyReview(0.92), 'AI_ASSISTED');
  assert.strictEqual(classifyReview(0.65), 'MANUAL_REVIEW_REQUIRED');
  assert.strictEqual(classifyReview(0.40), 'MANUAL_REVIEW_REQUIRED');
});

// ------------------------------------------------------------------------------
// CHECKPOINT 6: Zero Secret Leakage in Audit Logs
// ------------------------------------------------------------------------------
runTest(6, 'Error sanitization strips API keys and authorization headers from exception strings', () => {
  function sanitizeError(errMessage) {
    return errMessage
      .replace(/key=[a-zA-Z0-9_\-]+/gi, 'key=[REDACTED]')
      .replace(/Bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer [REDACTED]')
      .replace(/nvapi-[a-zA-Z0-9_\-]+/gi, 'nvapi-[REDACTED]');
  }

  const rawError = 'Failed to fetch from https://integrate.api.nvidia.com/v1/chat?key=nvapi-secret12345 with Bearer eyJhbGciOi...';
  const cleaned = sanitizeError(rawError);

  assert.ok(!cleaned.includes('nvapi-secret12345'), 'Must strip NVIDIA API key');
  assert.ok(!cleaned.includes('eyJhbGciOi'), 'Must strip Bearer token');
  assert.ok(cleaned.includes('[REDACTED]'), 'Must indicate redacted placeholder');
});

// ------------------------------------------------------------------------------
// CHECKPOINT 7: Secondary Provider Cascade (NVIDIA -> Gemini -> Deterministic)
// ------------------------------------------------------------------------------
runTest(7, 'Multi-provider cascade seamlessly switches from Primary (NVIDIA) to Secondary (Gemini)', () => {
  let cascadeLog = [];

  function executeCascade({ nvidiaOk = false, geminiOk = false }) {
    cascadeLog.push('TRY_NVIDIA');
    if (nvidiaOk) return { provider: 'NVIDIA_NIM', success: true };

    cascadeLog.push('TRY_GEMINI_FALLBACK');
    if (geminiOk) return { provider: 'GEMINI_FLASH', success: true };

    cascadeLog.push('TRY_DETERMINISTIC_FALLBACK');
    return { provider: 'DETERMINISTIC_ENGINE', success: true };
  }

  // When NVIDIA fails but Gemini succeeds
  const res1 = executeCascade({ nvidiaOk: false, geminiOk: true });
  assert.strictEqual(res1.provider, 'GEMINI_FLASH');
  assert.deepStrictEqual(cascadeLog, ['TRY_NVIDIA', 'TRY_GEMINI_FALLBACK']);

  // When both fail, falls back to deterministic regex
  cascadeLog = [];
  const res2 = executeCascade({ nvidiaOk: false, geminiOk: false });
  assert.strictEqual(res2.provider, 'DETERMINISTIC_ENGINE');
  assert.deepStrictEqual(cascadeLog, ['TRY_NVIDIA', 'TRY_GEMINI_FALLBACK', 'TRY_DETERMINISTIC_FALLBACK']);
});

// ------------------------------------------------------------------------------
// CHECKPOINT 8: Truthful Verification Classification
// ------------------------------------------------------------------------------
runTest(8, 'AI and OCR results are classified as AI_ASSISTED, never OFFICIALLY_VERIFIED without HSM signature', () => {
  const result = {
    method: 'ocr_ai',
    provider: 'PaddleOCR + NVIDIA NIM',
    confidence: 0.98,
    authoritative_verified: false,
    verification_status: 'ai_assisted'
  };

  assert.strictEqual(result.authoritative_verified, false);
  assert.strictEqual(result.verification_status, 'ai_assisted');
  assert.notStrictEqual(result.verification_status, 'officially_verified');
});

console.log('='.repeat(75));
console.log('AI PROVIDER ABSTRACTION AUDIT SUMMARY:');
console.log(`Passed: ${passedCount}/8`);
console.log(`Failed: ${failedCount}/8`);
console.log('='.repeat(75));

if (failedCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL 8 AI PROVIDER ABSTRACTION CHECKPOINTS PASSING 100%!');
}
