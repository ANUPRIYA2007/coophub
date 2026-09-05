/**
 * COOP HUB — Dedicated General Official Government Identification Pipeline
 * 
 * Handles custom government IDs (State Trade ID, Municipal License, Govt Employee Card, etc.):
 * - Extracts: Document Title, Document Number, Full Name, Issue Date, Issuing Authority
 * - Profile Matching: Cardholder Name
 * - Zero hardcoded identity fallbacks
 */

export function maskGeneralDocNumber(docStr = '') {
  if (!docStr) return null;
  const clean = docStr.replace(/\s+/g, '').toUpperCase();
  if (clean.length < 5) return clean;
  return `${clean.slice(0, 2)}****${clean.slice(-3)}`;
}

export const generalGovtIdPipeline = {
  /**
   * Process and validate an official government document extraction
   * @param {object} params
   * @param {object} params.extractedData - Extracted fields from OCR / Vision
   * @param {object} params.pillarProfile - Registered technician profile
   * @param {string} params.sourceMethod - 'government_api' | 'ocr_ai'
   */
  processGeneralDocument({ extractedData = {}, pillarProfile = {}, sourceMethod = 'ocr_ai' } = {}) {
    const rawNumber = (extractedData.document_number || '').trim();
    const cleanNumber = rawNumber.replace(/\s+/g, '');
    const extractedName = (extractedData.full_name || extractedData.name || '').trim();
    const documentTitle = extractedData.document_title || extractedData.customDocumentType || 'Official Government Identity';
    const issuingAuthority = extractedData.issuing_authority || null;
    const issueDate = extractedData.issue_date || null;
    const extractedDob = extractedData.date_of_birth || extractedData.dob || null;

    const validationErrors = [];
    const warnings = [];

    // 1. Format check: non-empty number
    let isFormatValid = false;
    if (!cleanNumber) {
      validationErrors.push({
        field: 'document_number',
        severity: 'HIGH',
        message: 'Document number was not detected on ID scan.'
      });
    } else if (cleanNumber.length >= 4) {
      isFormatValid = true;
    } else {
      validationErrors.push({
        field: 'document_number',
        severity: 'HIGH',
        message: `Extracted document number (${rawNumber}) is too short to be verifiable.`
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
        message: 'Cardholder name could not be extracted from document.'
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
          message: `Document name "${extractedName}" does not align with registered applicant name "${registeredName}".`
        });
      } else if (nameScore < 0.85) {
        warnings.push(`Minor spelling variation on document: "${extractedName}" vs "${registeredName}".`);
      }
    }

    const hasHighSeverityError = validationErrors.some(e => e.severity === 'HIGH');
    const verificationStatus = hasHighSeverityError 
      ? 'manual_review' 
      : (validationErrors.length === 0 ? 'ai_assisted' : 'manual_review');

    return {
      document_type: 'other',
      format_valid: isFormatValid,
      format_status: isFormatValid ? 'FORMAT_VALID' : 'FORMAT_INVALID',
      verification_status: verificationStatus,
      authoritative_verified: sourceMethod === 'government_api',
      source_method: sourceMethod,
      name_match_score: nameScore,
      validation_errors: validationErrors,
      warnings,
      fields: {
        document_number: cleanNumber || null,
        document_number_masked: maskGeneralDocNumber(cleanNumber),
        full_name: extractedName || null,
        document_title: documentTitle,
        issuing_authority: issuingAuthority,
        issue_date: issueDate,
        date_of_birth: extractedDob,
        address: extractedData.address || null,
        gender: null
      },
      processed_at: new Date().toISOString()
    };
  }
};

export default generalGovtIdPipeline;
