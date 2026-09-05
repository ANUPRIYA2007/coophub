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
  VOTER_ID: 'voter_id',
  DRIVING_LICENSE: 'driving_licence',
  PASSPORT: 'passport',
  RATION_CARD: 'ration_card',
  LABOUR_CARD: 'labour_card',
  SKILL_CERTIFICATE: 'skill_certificate',
  OTHER: 'other'
};

/**
 * Expected field schemas and profile matching specifications per document type.
 * Fields not defined on a document schema MUST remain null.
 */
export const DOCUMENT_SCHEMAS = {
  [DOCUMENT_TYPES.AADHAAR]: {
    label: 'Aadhaar Card (UIDAI)',
    authority: 'Unique Identification Authority of India',
    numberField: 'aadhaar_number',
    numberPattern: /^(\d{4}\s?\d{4}\s?\d{4}|\d{16})$/,
    fields: ['aadhaar_number', 'full_name', 'date_of_birth', 'gender', 'address', 'care_of'],
    profileMatchingFields: ['full_name', 'date_of_birth']
  },
  [DOCUMENT_TYPES.PAN]: {
    label: 'PAN Card (Income Tax Department)',
    authority: 'Income Tax Department',
    numberField: 'pan_number',
    numberPattern: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
    fields: ['pan_number', 'full_name', 'father_name', 'date_of_birth'],
    profileMatchingFields: ['full_name', 'date_of_birth']
  },
  [DOCUMENT_TYPES.VOTER_ID]: {
    label: 'Voter Identity Card (EPIC)',
    authority: 'Election Commission of India',
    numberField: 'voter_id_number',
    numberPattern: /^[A-Z]{3}[0-9]{7}$|^[A-Z]{2,3}\/[0-9]{2}\/[0-9]{3}\/[0-9]{5,7}$/,
    fields: ['voter_id_number', 'full_name', 'guardian_name', 'date_of_birth', 'gender', 'address', 'constituency'],
    profileMatchingFields: ['full_name']
  },
  [DOCUMENT_TYPES.DRIVING_LICENSE]: {
    label: 'Motor Driving Licence',
    authority: 'Ministry of Road Transport & Highways (MoRTH)',
    numberField: 'driving_license_number',
    numberPattern: /^[A-Z]{2}[0-9]{2}[0-9]{11}$|^[A-Z]{2}[- ]?[0-9]{2}[- ][0-9]{4}[- ]?[0-9]{7}$/,
    fields: ['driving_license_number', 'full_name', 'date_of_birth', 'guardian_name', 'address', 'expiry_date', 'vehicle_classes', 'issuing_authority'],
    profileMatchingFields: ['full_name', 'date_of_birth']
  },
  [DOCUMENT_TYPES.PASSPORT]: {
    label: 'Indian Passport',
    authority: 'Ministry of External Affairs, Republic of India',
    numberField: 'passport_number',
    numberPattern: /^[A-Z][0-9]{7,8}$/,
    fields: ['passport_number', 'full_name', 'given_name', 'surname', 'date_of_birth', 'gender', 'nationality', 'place_of_issue', 'issue_date', 'expiry_date'],
    profileMatchingFields: ['full_name', 'date_of_birth']
  },
  [DOCUMENT_TYPES.RATION_CARD]: {
    label: 'Smart Ration Card / Family Card',
    authority: 'Civil Supplies and Consumer Protection Department (TNEPDS)',
    numberField: 'ration_card_number',
    numberPattern: /^[0-9]{12}$|^[0-9]{2}\/[A-Z]\/[0-9]{7}$|^[A-Z0-9]{10,14}$/,
    fields: ['ration_card_number', 'full_name', 'address', 'district', 'fps_code'],
    profileMatchingFields: ['full_name']
  },
  [DOCUMENT_TYPES.LABOUR_CARD]: {
    label: 'Labour & Welfare Board Card',
    authority: 'Unorganised / Construction Workers Welfare Board',
    numberField: 'registration_number',
    numberPattern: /^[A-Z0-9/-]{6,25}$/,
    fields: ['registration_number', 'full_name', 'trade', 'district', 'welfare_board', 'issue_date'],
    profileMatchingFields: ['full_name', 'trade']
  },
  [DOCUMENT_TYPES.SKILL_CERTIFICATE]: {
    label: 'Trade & Skill Certificate',
    authority: 'NCVT / NSDC / State Technical Education Board',
    numberField: 'certificate_number',
    numberPattern: /^[A-Z0-9/-]{5,25}$/,
    fields: ['certificate_number', 'full_name', 'trade', 'issuing_organization', 'issue_date', 'grade'],
    profileMatchingFields: ['full_name', 'trade']
  },
  [DOCUMENT_TYPES.OTHER]: {
    label: 'Official Government Identity',
    authority: 'Competent Government Authority',
    numberField: 'document_number',
    numberPattern: /^[A-Z0-9/-]{4,30}$/,
    fields: ['document_number', 'full_name', 'document_title', 'date_of_birth', 'issue_date', 'issuing_authority'],
    profileMatchingFields: ['full_name']
  }
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
