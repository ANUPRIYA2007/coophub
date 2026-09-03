/**
 * COOP HUB — Dedicated Aadhaar Verification & Extraction Pipeline
 * 
 * Multi-Tier Pipeline:
 * Tier 1: Authoritative UIDAI Secure QR scanning (Camera or File/PDF)
 * Tier 2: DigiLocker retrieval (when configured)
 * Tier 3: Multimodal Vision AI + OCR fallback
 * 
 * Features:
 * - Mathematical Verhoeff algorithm checksum validation
 * - 12-digit UIDAI / 16-digit VID format validation
 * - Strict Aadhaar number masking: XXXX-XXXX-1234
 * - Deterministic field extraction (Name, DOB, Gender, Address, C/O)
 * - Truthful verification status classification
 */

// Verhoeff Algorithm Tables
const dTable = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];

const pTable = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];

export function validateVerhoeffChecksum(numStr = '') {
  const clean = numStr.replace(/\s+/g, '');
  if (!/^\d{12}$/.test(clean)) return false;

  let c = 0;
  const digits = clean.split('').map(Number).reverse();
  for (let i = 0; i < digits.length; i++) {
    c = dTable[c][pTable[i % 8][digits[i]]];
  }
  return c === 0;
}

export function maskAadhaarNumber(numStr = '') {
  if (!numStr) return null;
  const clean = numStr.replace(/[\s-]/g, '');
  if (clean.length < 4) return clean;
  const last4 = clean.slice(-4);
  return `XXXX-XXXX-${last4}`;
}

export const aadhaarPipeline = {
  /**
   * Process and validate an Aadhaar document extraction
   * @param {object} params
   * @param {object} params.extractedData - Output from OCR / Vision / QR
   * @param {object} params.pillarProfile - Registered technician profile
   * @param {string} params.sourceMethod - 'uidai_qr' | 'digilocker' | 'ocr_ai'
   */
  processAadhaar({ extractedData = {}, pillarProfile = {}, sourceMethod = 'ocr_ai' } = {}) {
    const rawNumber = (extractedData.document_number || extractedData.aadhaar_number || '').replace(/[\s-]/g, '');
    const extractedName = (extractedData.full_name || extractedData.name || '').trim();
    const extractedDob = extractedData.date_of_birth || extractedData.dob || null;
    const extractedGender = (extractedData.gender || '').toUpperCase();
    const extractedAddress = extractedData.address || null;
    const careOf = extractedData.care_of || extractedData.father_name || null;

    const validationErrors = [];
    const warnings = [];

    // 1. Number format & Verhoeff validation
    let isFormatValid = false;
    let isVerhoeffValid = false;

    if (!rawNumber) {
      validationErrors.push({
        field: 'aadhaar_number',
        severity: 'HIGH',
        message: 'Aadhaar number was not detected on document scan.'
      });
    } else if (/^\d{12}$/.test(rawNumber)) {
      isFormatValid = true;
      isVerhoeffValid = validateVerhoeffChecksum(rawNumber);
      if (!isVerhoeffValid) {
        warnings.push('Aadhaar number checksum check could not be mathematically confirmed. May be obscured or misread.');
      }
    } else if (/^\d{16}$/.test(rawNumber)) {
      isFormatValid = true; // 16-digit Virtual ID (VID)
    } else {
      validationErrors.push({
        field: 'aadhaar_number',
        severity: 'HIGH',
        message: `Extracted Aadhaar number (${rawNumber}) does not conform to standard 12-digit UIDAI format.`
      });
    }

    // 2. Name validation against profile
    const registeredName = (pillarProfile.full_name || pillarProfile.fullName || '').toLowerCase().trim();
    const cleanExtractedName = extractedName.toLowerCase().trim();
    let nameScore = 0;

    if (!extractedName) {
      validationErrors.push({
        field: 'full_name',
        severity: 'HIGH',
        message: 'Applicant name could not be extracted from Aadhaar scan.'
      });
    } else if (registeredName) {
      if (cleanExtractedName === registeredName) {
        nameScore = 1.0;
      } else if (cleanExtractedName.includes(registeredName) || registeredName.includes(cleanExtractedName)) {
        nameScore = 0.90;
      } else {
        const regTokens = registeredName.split(/\s+/).filter(t => t.length > 2);
        const extTokens = cleanExtractedName.split(/\s+/).filter(t => t.length > 2);
        const overlap = regTokens.filter(t => extTokens.some(et => et.includes(t) || t.includes(et)));
        nameScore = regTokens.length > 0 ? overlap.length / regTokens.length : 0;
      }

      if (nameScore < 0.5) {
        validationErrors.push({
          field: 'full_name',
          severity: 'HIGH',
          submitted: pillarProfile.full_name,
          extracted: extractedName,
          message: `Extracted Aadhaar name "${extractedName}" does not match registered name "${pillarProfile.full_name}".`
        });
      } else if (nameScore < 0.85) {
        warnings.push(`Minor name variation between Aadhaar ("${extractedName}") and registered profile ("${pillarProfile.full_name}").`);
      }
    }

    // 3. Truthful verification status determination
    let verificationStatus = 'manual_review';
    let authoritativeVerified = false;

    if (sourceMethod === 'uidai_qr' && extractedData.signature_valid) {
      verificationStatus = 'officially_verified';
      authoritativeVerified = true;
    } else if (sourceMethod === 'digilocker' && extractedData.authoritative_verified) {
      verificationStatus = 'officially_verified';
      authoritativeVerified = true;
    } else if (validationErrors.length === 0 && isFormatValid && nameScore >= 0.85) {
      verificationStatus = 'ai_assisted';
    } else {
      verificationStatus = 'manual_review';
    }

    const maskedNumber = maskAadhaarNumber(rawNumber);

    return {
      document_type: 'aadhaar',
      source_method: sourceMethod,
      authoritative_verified: authoritativeVerified,
      verification_status: verificationStatus,
      format_valid: isFormatValid,
      verhoeff_checksum_valid: isVerhoeffValid,
      fields: {
        document_number: rawNumber,
        document_number_masked: maskedNumber,
        full_name: extractedName || null,
        date_of_birth: extractedDob,
        gender: extractedGender || null,
        address: extractedAddress,
        care_of: careOf
      },
      name_alignment: {
        registered_name: pillarProfile.full_name || null,
        extracted_name: extractedName || null,
        similarity_score: Number(nameScore.toFixed(2))
      },
      validation_errors: validationErrors,
      warnings: warnings,
      processed_at: new Date().toISOString()
    };
  }
};

export default aadhaarPipeline;
