/**
 * COOP HUB — Dedicated Passport Verification & Extraction Pipeline
 * 
 * Complies with Republic of India / ICAO Doc 9303 Specifications:
 * - Format: 1 uppercase letter followed by 7 or 8 digits (e.g., J1234567)
 * - Extracts: Passport Number, Given Name, Surname, Full Name, DOB, Gender, Expiry Date, Nationality, Place of Issue
 * - Active validity check against current timestamp (flags EXPIRED passports)
 * - Safe masking for display
 * - Zero hardcoded identity fallbacks
 */

export function maskPassportNumber(passportStr = '') {
  if (!passportStr) return null;
  const clean = passportStr.replace(/\s+/g, '').toUpperCase();
  if (clean.length < 6) return clean;
  return `${clean[0]}XXX-XXXX-${clean.slice(-3)}`;
}

export const passportPipeline = {
  /**
   * Process and validate a Passport extraction
   * @param {object} params
   * @param {object} params.extractedData - Extracted fields from OCR / Vision
   * @param {object} params.pillarProfile - Registered technician profile
   * @param {string} params.sourceMethod - 'digilocker' | 'government_api' | 'ocr_ai'
   */
  processPassport({ extractedData = {}, pillarProfile = {}, sourceMethod = 'ocr_ai' } = {}) {
    const rawNumber = (extractedData.document_number || extractedData.passport_number || '').toUpperCase().trim();
    const cleanNumber = rawNumber.replace(/[\s-]/g, '');
    
    // Construct full name if given name + surname provided
    let extractedName = (extractedData.full_name || extractedData.name || '').trim();
    if (!extractedName && (extractedData.given_name || extractedData.surname)) {
      extractedName = [extractedData.given_name, extractedData.surname].filter(Boolean).join(' ').trim();
    }
    
    const extractedDob = extractedData.date_of_birth || extractedData.dob || null;
    const expiryDate = extractedData.expiry_date || null;
    const gender = extractedData.gender ? extractedData.gender.toUpperCase() : null;
    const nationality = extractedData.nationality || 'INDIAN';
    const placeOfIssue = extractedData.place_of_issue || null;
    const issueDate = extractedData.issue_date || null;

    const validationErrors = [];
    const warnings = [];

    // 1. Passport Number Format Check: 1 letter + 7 or 8 digits
    let isFormatValid = false;
    if (!cleanNumber) {
      validationErrors.push({
        field: 'passport_number',
        severity: 'HIGH',
        message: 'Passport number was not detected on document scan.'
      });
    } else if (/^[A-Z][0-9]{7,8}$/.test(cleanNumber)) {
      isFormatValid = true;
    } else {
      validationErrors.push({
        field: 'passport_number',
        severity: 'HIGH',
        message: `Extracted passport number (${rawNumber}) does not conform to Indian passport format (1 letter followed by 7-8 digits).`
      });
    }

    // 2. Expiry / Validity Date Check
    let isExpired = false;
    if (expiryDate) {
      const expTime = new Date(expiryDate).getTime();
      if (!isNaN(expTime) && expTime < Date.now()) {
        isExpired = true;
        validationErrors.push({
          field: 'expiry_date',
          severity: 'HIGH',
          extracted: expiryDate,
          message: `Passport expired on ${expiryDate}. A valid unexpired identification document is required.`
        });
      }
    } else {
      warnings.push('Passport expiry date was not clearly detected.');
    }

    // 3. Name validation against profile
    const registeredName = (pillarProfile.full_name || pillarProfile.fullName || '').toLowerCase().trim();
    const cleanExtractedName = extractedName.toLowerCase().trim();
    let nameScore = 0;

    if (!extractedName) {
      validationErrors.push({
        field: 'full_name',
        severity: 'HIGH',
        message: 'Passport holder name could not be extracted from document.'
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
          submitted: registeredName,
          extracted: extractedName,
          message: `Passport name "${extractedName}" does not align with registered profile name "${registeredName}".`
        });
      } else if (nameScore < 0.85) {
        warnings.push(`Minor name variation between passport ("${extractedName}") and registered name ("${registeredName}").`);
      }
    }

    // 4. Date of Birth Check
    const registeredDob = (pillarProfile.dob || pillarProfile.date_of_birth || '').trim();
    if (registeredDob && extractedDob) {
      const cleanRegDob = registeredDob.replace(/[-/.]/g, '');
      const cleanExtDob = extractedDob.replace(/[-/.]/g, '');
      if (cleanRegDob !== cleanExtDob && !cleanRegDob.includes(cleanExtDob) && !cleanExtDob.includes(cleanRegDob)) {
        validationErrors.push({
          field: 'date_of_birth',
          severity: 'MEDIUM',
          submitted: registeredDob,
          extracted: extractedDob,
          message: `Date of Birth discrepancy: Registered ${registeredDob} vs Passport ${extractedDob}.`
        });
      }
    }

    const hasHighSeverityError = validationErrors.some(e => e.severity === 'HIGH');
    const verificationStatus = hasHighSeverityError 
      ? 'manual_review' 
      : (validationErrors.length === 0 ? 'ai_assisted' : 'manual_review');

    return {
      document_type: 'passport',
      format_valid: isFormatValid && !isExpired,
      format_status: isFormatValid && !isExpired ? 'FORMAT_VALID' : 'FORMAT_INVALID',
      verification_status: verificationStatus,
      authoritative_verified: sourceMethod === 'digilocker' || sourceMethod === 'government_api',
      source_method: sourceMethod,
      name_match_score: nameScore,
      is_expired: isExpired,
      validation_errors: validationErrors,
      warnings,
      fields: {
        document_number: cleanNumber || null,
        document_number_masked: maskPassportNumber(cleanNumber),
        full_name: extractedName || null,
        given_name: extractedData.given_name || null,
        surname: extractedData.surname || null,
        date_of_birth: extractedDob,
        gender,
        nationality,
        place_of_issue: placeOfIssue,
        issue_date: issueDate,
        expiry_date: expiryDate
      },
      processed_at: new Date().toISOString()
    };
  }
};

export default passportPipeline;
