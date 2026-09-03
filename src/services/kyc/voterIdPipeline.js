/**
 * COOP HUB — Dedicated Voter ID (EPIC) Verification Pipeline
 * 
 * Complies with Election Commission of India (ECI) Specifications:
 * - Format: 3 letters + 7 digits ([A-Z]{3}[0-9]{7}) or state alphanumeric format (e.g. TN/02/123/456789)
 * - Extracts: EPIC Number, Full Name, Guardian / Father Name, DOB / Age, Gender, Assembly Constituency
 * - Name alignment check with registered profile
 * - EPIC number masking for safe display
 */

export function maskVoterIdNumber(epicStr = '') {
  if (!epicStr) return null;
  const clean = epicStr.replace(/[\s-]/g, '').toUpperCase();
  if (clean.length < 6) return clean;
  return `${clean.slice(0, 3)}XXXX${clean.slice(-3)}`;
}

export const voterIdPipeline = {
  /**
   * Process and validate a Voter ID extraction
   * @param {object} params
   * @param {object} params.extractedData - Extracted fields from OCR / Vision
   * @param {object} params.pillarProfile - Registered technician profile
   * @param {string} params.sourceMethod - 'digilocker' | 'nvsp_api' | 'ocr_ai'
   */
  processVoterId({ extractedData = {}, pillarProfile = {}, sourceMethod = 'ocr_ai' } = {}) {
    const rawEpic = (extractedData.document_number || extractedData.voter_id_number || '').toUpperCase().trim();
    const cleanEpic = rawEpic.replace(/[\s-]/g, '');
    const extractedName = (extractedData.full_name || extractedData.name || '').trim();
    const guardianName = (extractedData.guardian_name || extractedData.father_name || '').trim();
    const extractedDob = extractedData.date_of_birth || extractedData.dob || null;
    const age = extractedData.age || null;
    const gender = (extractedData.gender || '').toUpperCase() || null;
    const constituency = extractedData.constituency || null;
    const pollingStation = extractedData.polling_station || null;

    const validationErrors = [];
    const warnings = [];

    // 1. Format validation
    let isFormatValid = false;
    if (!cleanEpic) {
      validationErrors.push({
        field: 'voter_id_number',
        severity: 'HIGH',
        message: 'EPIC / Voter ID number was not detected on card scan.'
      });
    } else if (/^[A-Z]{3}[0-9]{7}$/.test(cleanEpic) || cleanEpic.length >= 8) {
      isFormatValid = true;
    } else {
      validationErrors.push({
        field: 'voter_id_number',
        severity: 'HIGH',
        message: `Extracted EPIC number (${rawEpic}) is too short or does not conform to ECI 10-character structure.`
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
        message: 'Elector name could not be extracted from Voter ID.'
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
          message: `Extracted Voter ID name "${extractedName}" does not match registered profile "${pillarProfile.full_name}".`
        });
      }
    }

    // 3. Verification Status
    let verificationStatus = 'manual_review';
    let authoritativeVerified = false;

    if (sourceMethod === 'digilocker' && extractedData.authoritative_verified) {
      verificationStatus = 'officially_verified';
      authoritativeVerified = true;
    } else if (validationErrors.length === 0 && isFormatValid && nameScore >= 0.85) {
      verificationStatus = 'ai_assisted';
    } else {
      verificationStatus = 'manual_review';
    }

    const maskedNumber = maskVoterIdNumber(rawEpic);

    return {
      document_type: 'voter_id',
      source_method: sourceMethod,
      authoritative_verified: authoritativeVerified,
      verification_status: verificationStatus,
      format_valid: isFormatValid,
      fields: {
        document_number: rawEpic,
        document_number_masked: maskedNumber,
        full_name: extractedName || null,
        guardian_name: guardianName || null,
        date_of_birth: extractedDob,
        age: age,
        gender: gender,
        constituency: constituency,
        polling_station: pollingStation
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

export default voterIdPipeline;
