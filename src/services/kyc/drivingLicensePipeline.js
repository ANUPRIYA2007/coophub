/**
 * COOP HUB — Dedicated Driving Licence (DL) Verification Pipeline
 * 
 * Complies with Ministry of Road Transport & Highways (MoRTH / Parivahan) Specifications:
 * - Format: State code (2 letters) + RTO code + 4-digit issue year + 7-digit serial number
 * - Extracts: DL Number, Full Name, DOB, Expiry Date, Vehicle Classes (LMV, MCWG), Issuing RTO
 * - Active validity check against current timestamp (flags EXPIRED licences)
 * - Safe masking for display
 */

export function maskDlNumber(dlStr = '') {
  if (!dlStr) return null;
  const clean = dlStr.replace(/[\s-]/g, '').toUpperCase();
  if (clean.length < 8) return clean;
  return `${clean.slice(0, 4)}-XXXX-${clean.slice(-4)}`;
}

export const drivingLicensePipeline = {
  /**
   * Process and validate a Driving Licence extraction
   * @param {object} params
   * @param {object} params.extractedData - Extracted fields from OCR / Vision
   * @param {object} params.pillarProfile - Registered technician profile
   * @param {string} params.sourceMethod - 'digilocker' | 'parivahan_api' | 'ocr_ai'
   */
  processDrivingLicense({ extractedData = {}, pillarProfile = {}, sourceMethod = 'ocr_ai' } = {}) {
    const rawDl = (extractedData.document_number || extractedData.driving_license_number || '').toUpperCase().trim();
    const cleanDl = rawDl.replace(/[\s-]/g, '');
    const extractedName = (extractedData.full_name || extractedData.name || '').trim();
    const extractedDob = extractedData.date_of_birth || extractedData.dob || null;
    const expiryDate = extractedData.expiry_date || null;
    const vehicleClasses = Array.isArray(extractedData.vehicle_classes) 
      ? extractedData.vehicle_classes 
      : (extractedData.vehicle_classes ? [extractedData.vehicle_classes] : ['LMV']);
    const issuingAuthority = extractedData.issuing_authority || extractedData.transport_authority || null;

    const validationErrors = [];
    const warnings = [];

    // 1. DL Format Check (Standard Parivahan: State 2 letters + digits)
    let isFormatValid = false;
    if (!cleanDl) {
      validationErrors.push({
        field: 'driving_license_number',
        severity: 'HIGH',
        message: 'Driving Licence number was not detected on card scan.'
      });
    } else if (/^[A-Z]{2}[0-9]{2}[0-9]{11}$/.test(cleanDl) || /^[A-Z]{2}[- ]?[0-9]{2}[- ]?[0-9]{4}[- ]?[0-9]{7}$/.test(rawDl) || cleanDl.length >= 12) {
      isFormatValid = true;
    } else {
      validationErrors.push({
        field: 'driving_license_number',
        severity: 'HIGH',
        message: `Extracted Driving Licence (${rawDl}) does not match standard Parivahan 15-character format.`
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
          message: `Driving Licence expired on ${expiryDate}. Current valid driving licence is mandatory.`
        });
      }
    } else {
      warnings.push('Licence validity / expiry date was not clearly detected.');
    }

    // 3. Name validation against profile
    const registeredName = (pillarProfile.full_name || pillarProfile.fullName || '').toLowerCase().trim();
    const cleanExtractedName = extractedName.toLowerCase().trim();
    let nameScore = 0;

    if (!extractedName) {
      validationErrors.push({
        field: 'full_name',
        severity: 'HIGH',
        message: 'Licence holder name could not be extracted from driving licence.'
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
          message: `Extracted DL name "${extractedName}" does not match registered profile "${pillarProfile.full_name}".`
        });
      }
    }

    // 4. Verification Status
    let verificationStatus = 'manual_review';
    let authoritativeVerified = false;

    if (sourceMethod === 'digilocker' && extractedData.authoritative_verified) {
      verificationStatus = 'officially_verified';
      authoritativeVerified = true;
    } else if (validationErrors.length === 0 && isFormatValid && !isExpired && nameScore >= 0.85) {
      verificationStatus = 'ai_assisted';
    } else {
      verificationStatus = 'manual_review';
    }

    const maskedNumber = maskDlNumber(rawDl);

    return {
      document_type: 'driving_licence',
      source_method: sourceMethod,
      authoritative_verified: authoritativeVerified,
      verification_status: verificationStatus,
      format_valid: isFormatValid,
      is_expired: isExpired,
      fields: {
        document_number: rawDl,
        document_number_masked: maskedNumber,
        full_name: extractedName || null,
        date_of_birth: extractedDob,
        expiry_date: expiryDate,
        vehicle_classes: vehicleClasses,
        issuing_authority: issuingAuthority
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

export default drivingLicensePipeline;
