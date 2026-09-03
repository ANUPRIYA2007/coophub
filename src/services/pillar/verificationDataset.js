/**
 * COOP HUB — KYC Verification Standards & Status Definitions
 * 
 * CORE ARCHITECTURAL RULE:
 * ZERO mock or prototype identity records.
 * All verification must derive from:
 * 1. Authoritative digital sources (UIDAI Secure QR, DigiLocker, Government APIs)
 * 2. Deterministic AI / OCR extraction with strict confidence boundaries
 * 3. Human administrative review
 */

export const VERIFICATION_STATUSES = {
  OFFICIALLY_VERIFIED: 'officially_verified',     // Verified via UIDAI HSM, DigiLocker, or Govt API
  DIGITALLY_VERIFIED: 'digitally_verified',       // Cryptographic QR payload verified
  AI_ASSISTED: 'ai_assisted',                     // High-confidence OCR match, requires admin approval
  MANUAL_REVIEW: 'manual_review',                 // Mismatches or low confidence, flagged for admin
  NOT_CONFIGURED: 'not_configured',               // External government integration keys not present
  VERIFICATION_FAILED: 'verification_failed'      // Unreadable document or invalid format
};

export const VERIFICATION_METHODS = {
  UIDAI_QR: 'uidai_qr',
  DIGILOCKER: 'digilocker',
  GOVERNMENT_API: 'government_api',
  OCR_AI: 'ocr_ai',
  ADMIN_MANUAL: 'admin_manual'
};

export const DOCUMENT_TYPES = {
  AADHAAR: 'aadhaar',
  PAN: 'pan',
  DRIVING_LICENSE: 'driving_licence',
  VOTER_ID: 'voter_id',
  SKILL_CERTIFICATE: 'skill_certificate'
};

/**
 * NO MOCK DATA POLICY:
 * System does not use synthetic reference datasets. Real documents must be provided.
 */
export const PROTOTYPE_VERIFICATION_RECORDS = [];

/**
 * findReferenceRecord: Deprecated. Always returns null to ensure no fake verifications occur.
 */
export function findReferenceRecord() {
  return null;
}
