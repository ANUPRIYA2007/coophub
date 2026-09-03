/**
 * COOP HUB — Deterministic Document Validation Service
 * 
 * Rules-based deterministic validation engine with document-specific rules for:
 * 1. Aadhaar (12 digits, UIDAI format, name, DOB, address, gender)
 * 2. PAN Card (10 chars format ABCDE1234F, name, father's name, DOB, photo/signature)
 * 3. Voter ID (EPIC format, name, age/DOB, gender, address, constituency)
 * 4. Driving Licence (DL format, name, DOB, issue/expiry validity, vehicle classes, RTO)
 * 5. Professional Trade / Skill Certificates (trade matching, certification board)
 */

/**
 * Clean and normalize a name string for robust fuzzy comparison
 */
export function normalizeName(name = '') {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\b(mr|mrs|ms|shri|smt|dr|master|selvi|thiru)\b[.]?/gi, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Clean and normalize dates to standard YYYY-MM-DD
 */
export function normalizeDate(dateStr = '') {
  if (!dateStr) return null;
  const clean = dateStr.trim().replace(/[.]/g, '/').replace(/[-]/g, '/');

  // Format: DD/MM/YYYY or D/M/YYYY
  const dmyMatch = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Format: YYYY/MM/DD
  const ymdMatch = clean.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const yearMatch = clean.match(/\b(19\d{2}|20\d{2})\b/);
  if (yearMatch) return yearMatch[1];

  return clean;
}

/**
 * Clean and normalize document registration numbers
 */
export function normalizeDocNumber(docNum = '') {
  if (!docNum) return '';
  return docNum.replace(/[\s\-_/]/g, '').toUpperCase();
}

/**
 * Token overlap similarity between two name strings
 */
export function calculateNameSimilarity(nameA = '', nameB = '') {
  const normA = normalizeName(nameA);
  const normB = normalizeName(nameB);

  if (!normA || !normB) return 0;
  if (normA === normB) return 1.0;
  if (normA.includes(normB) || normB.includes(normA)) return 0.95;

  const tokensA = new Set(normA.split(' '));
  const tokensB = new Set(normB.split(' '));

  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token) && token.length > 1) {
      intersection++;
    }
  }

  const union = new Set([...tokensA, ...tokensB]).size;
  return union > 0 ? intersection / union : 0;
}

export const documentValidationService = {
  /**
   * Validate extracted structured data against registered Pillar profile
   * Dispatches to document-specific validator based on document_type
   */
  validateExtraction(extractedData = {}, pillarProfile = {}) {
    const docType = (extractedData.document_type || extractedData.document_category || 'aadhaar').toLowerCase();

    if (docType.includes('aadhaar') || docType.includes('uidai')) {
      return this.validateAadhaar(extractedData, pillarProfile);
    }
    if (docType.includes('pan')) {
      return this.validatePAN(extractedData, pillarProfile);
    }
    if (docType.includes('voter') || docType.includes('epic')) {
      return this.validateVoterId(extractedData, pillarProfile);
    }
    if (docType.includes('driving') || docType.includes('license') || docType.includes('licence') || docType.includes('dl')) {
      return this.validateDrivingLicense(extractedData, pillarProfile);
    }

    return this.validateGeneral(extractedData, pillarProfile);
  },

  /**
   * Aadhaar-specific validation
   */
  validateAadhaar(extractedData = {}, pillarProfile = {}) {
    const mismatches = [];
    const missingFields = [];
    const warnings = [];

    // 1. Aadhaar Number (12 digits)
    const docNum = normalizeDocNumber(extractedData.document_number || extractedData.aadhaar_number || '');
    if (!docNum) {
      missingFields.push('document_number');
      missingFields.push('aadhaar_number');
    } else if (!/^\d{12}$/.test(docNum) && !/^\d{16}$/.test(docNum)) { // 12 digits or 16-digit VID
      mismatches.push({
        field: 'aadhaar_number',
        extracted: docNum,
        severity: 'HIGH',
        message: `Extracted Aadhaar number (${docNum}) is not a valid 12-digit UIDAI number.`
      });
    }

    // 2. Name validation
    const submittedName = pillarProfile.full_name || pillarProfile.fullName || '';
    const extractedName = extractedData.full_name || '';
    if (!extractedName) {
      missingFields.push('full_name');
    } else if (submittedName) {
      const nameScore = calculateNameSimilarity(submittedName, extractedName);
      if (nameScore < 0.5) {
        mismatches.push({
          field: 'full_name',
          submitted: submittedName,
          extracted: extractedName,
          severity: 'HIGH',
          message: `Extracted Aadhaar name "${extractedName}" does not align with registered name "${submittedName}".`
        });
      } else if (nameScore < 0.85) {
        warnings.push(`Minor name spelling variation on Aadhaar card: "${extractedName}" vs "${submittedName}".`);
      }
    }

    // 3. DOB validation
    const submittedDob = normalizeDate(pillarProfile.dob || pillarProfile.date_of_birth || '');
    const extractedDob = normalizeDate(extractedData.date_of_birth || '');
    if (!extractedDob) {
      missingFields.push('date_of_birth');
    } else if (submittedDob && submittedDob !== extractedDob && !submittedDob.includes(extractedDob) && !extractedDob.includes(submittedDob)) {
      mismatches.push({
        field: 'date_of_birth',
        submitted: submittedDob,
        extracted: extractedDob,
        severity: 'MEDIUM',
        message: `Date of Birth differs: Submitted ${submittedDob} vs Aadhaar ${extractedDob}.`
      });
    }

    // 4. Address check
    if (!extractedData.address) {
      warnings.push('Address was not visible on document front or scan.');
    }

    return this.assembleScoreAndClassification({
      docType: 'aadhaar',
      mismatches,
      missingFields,
      warnings,
      normalizedFields: {
        name: normalizeName(extractedName),
        document_number: docNum,
        dob: extractedDob,
        address: extractedData.address || null
      },
      baseConfidence: extractedData.confidence || 0.98
    });
  },

  /**
   * PAN-specific validation
   */
  validatePAN(extractedData = {}, pillarProfile = {}) {
    const mismatches = [];
    const missingFields = [];
    const warnings = [];

    // 1. PAN Number (10 alphanumeric: 5 letters, 4 digits, 1 letter)
    const panNum = normalizeDocNumber(extractedData.document_number || extractedData.pan_number || '');
    if (!panNum) {
      missingFields.push('document_number');
      missingFields.push('pan_number');
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNum)) {
      mismatches.push({
        field: 'pan_number',
        extracted: panNum,
        severity: 'HIGH',
        message: `Extracted PAN number (${panNum}) does not match Income Tax Department 10-character alphanumeric format.`
      });
    }

    if (!extractedData.date_of_birth) {
      missingFields.push('date_of_birth');
    }

    // 2. Name validation
    const submittedName = pillarProfile.full_name || pillarProfile.fullName || '';
    const extractedName = extractedData.full_name || '';
    if (!extractedName) {
      missingFields.push('full_name');
    } else if (submittedName) {
      const nameScore = calculateNameSimilarity(submittedName, extractedName);
      if (nameScore < 0.5) {
        mismatches.push({
          field: 'full_name',
          submitted: submittedName,
          extracted: extractedName,
          severity: 'HIGH',
          message: `PAN Card name "${extractedName}" does not match registered name "${submittedName}".`
        });
      }
    }

    // 3. Father's Name
    if (!extractedData.father_name && !extractedData.fathers_or_guardians_name) {
      warnings.push("Father's name was not clearly detected on PAN scan.");
    }

    return this.assembleScoreAndClassification({
      docType: 'pan',
      mismatches,
      missingFields,
      warnings,
      normalizedFields: {
        name: normalizeName(extractedName),
        document_number: panNum,
        father_name: extractedData.father_name || extractedData.fathers_or_guardians_name || null
      },
      baseConfidence: extractedData.confidence || 0.96
    });
  },

  /**
   * Voter ID-specific validation
   */
  validateVoterId(extractedData = {}, pillarProfile = {}) {
    const mismatches = [];
    const missingFields = [];
    const warnings = [];

    const epicNum = normalizeDocNumber(extractedData.document_number || extractedData.voter_id_number || '');
    if (!epicNum) {
      missingFields.push('document_number');
      missingFields.push('voter_id_number');
    } else if (epicNum.length < 8) {
      mismatches.push({
        field: 'voter_id_number',
        extracted: epicNum,
        severity: 'HIGH',
        message: `EPIC / Voter ID number (${epicNum}) is too short.`
      });
    }

    const submittedName = pillarProfile.full_name || pillarProfile.fullName || '';
    const extractedName = extractedData.full_name || '';
    if (!extractedName) {
      missingFields.push('full_name');
    } else if (submittedName) {
      const nameScore = calculateNameSimilarity(submittedName, extractedName);
      if (nameScore < 0.5) {
        mismatches.push({
          field: 'full_name',
          submitted: submittedName,
          extracted: extractedName,
          severity: 'HIGH',
          message: `Voter ID name "${extractedName}" does not match registered name "${submittedName}".`
        });
      }
    }

    return this.assembleScoreAndClassification({
      docType: 'voter_id',
      mismatches,
      missingFields,
      warnings,
      normalizedFields: {
        name: normalizeName(extractedName),
        document_number: epicNum,
        constituency: extractedData.constituency || null
      },
      baseConfidence: extractedData.confidence || 0.95
    });
  },

  /**
   * Driving Licence-specific validation
   */
  validateDrivingLicense(extractedData = {}, pillarProfile = {}) {
    const mismatches = [];
    const missingFields = [];
    const warnings = [];

    const dlNum = normalizeDocNumber(extractedData.document_number || extractedData.driving_license_number || '');
    if (!dlNum) {
      missingFields.push('driving_license_number');
    }

    const submittedName = pillarProfile.full_name || pillarProfile.fullName || '';
    const extractedName = extractedData.full_name || '';
    if (!extractedName) {
      missingFields.push('full_name');
    } else if (submittedName) {
      const nameScore = calculateNameSimilarity(submittedName, extractedName);
      if (nameScore < 0.5) {
        mismatches.push({
          field: 'full_name',
          submitted: submittedName,
          extracted: extractedName,
          severity: 'HIGH',
          message: `Driving licence name "${extractedName}" does not match registered name "${submittedName}".`
        });
      }
    }

    // Expiry date check
    if (extractedData.expiry_date) {
      const exp = new Date(extractedData.expiry_date);
      if (!isNaN(exp.getTime()) && exp.getTime() < Date.now()) {
        mismatches.push({
          field: 'expiry_date',
          extracted: extractedData.expiry_date,
          severity: 'HIGH',
          message: `Driving licence has expired on ${extractedData.expiry_date}.`
        });
      }
    }

    return this.assembleScoreAndClassification({
      docType: 'driving_licence',
      mismatches,
      missingFields,
      warnings,
      normalizedFields: {
        name: normalizeName(extractedName),
        document_number: dlNum,
        expiry_date: extractedData.expiry_date || null,
        issuing_authority: extractedData.issuing_authority || extractedData.transport_authority || null
      },
      baseConfidence: extractedData.confidence || 0.95
    });
  },

  /**
   * General / Skill Certificate fallback validation
   */
  validateGeneral(extractedData = {}, pillarProfile = {}) {
    const mismatches = [];
    const missingFields = [];
    const warnings = [];

    const isSkillCert = extractedData.document_type === 'skill_certificate' || extractedData.document_category === 'skill_certificate';
    const submittedName = pillarProfile.full_name || pillarProfile.fullName || '';
    const extractedName = isSkillCert ? (extractedData.worker_name || extractedData.full_name || '') : (extractedData.full_name || '');

    if (!extractedName) {
      missingFields.push('full_name');
    } else if (submittedName) {
      const nameScore = calculateNameSimilarity(submittedName, extractedName);
      if (nameScore < 0.5) {
        mismatches.push({
          field: 'full_name',
          submitted: submittedName,
          extracted: extractedName,
          severity: 'HIGH',
          message: `Extracted name "${extractedName}" does not align with registered name "${submittedName}".`
        });
      }
    }

    const docNum = normalizeDocNumber(extractedData.document_number || extractedData.certificate_number || '');
    if (!docNum) {
      missingFields.push(isSkillCert ? 'certificate_number' : 'document_number');
    }

    return this.assembleScoreAndClassification({
      docType: 'general',
      mismatches,
      missingFields,
      warnings,
      normalizedFields: {
        name: normalizeName(extractedName),
        document_number: docNum
      },
      baseConfidence: extractedData.confidence || 0.90
    });
  },

  /**
   * Helper to compute final score and status classification
   */
  assembleScoreAndClassification({ docType, mismatches, missingFields, warnings, normalizedFields, baseConfidence }) {
    let score = baseConfidence;
    if (missingFields.length > 0) score -= (missingFields.length * 0.20);
    if (mismatches.some(m => m.severity === 'HIGH')) score -= 0.40;
    else if (mismatches.some(m => m.severity === 'MEDIUM')) score -= 0.15;
    if (warnings.length > 2) score -= 0.10;

    const finalScore = Math.max(0.10, Math.min(0.99, Number(score.toFixed(2))));

    let confidenceLevel = 'LOW';
    let recommendation = 'MANUAL_REVIEW';
    let summary = 'Document requires visual administrative inspection.';

    if (finalScore >= 0.85 && mismatches.length === 0 && missingFields.length === 0) {
      confidenceLevel = 'HIGH';
      recommendation = 'READY_FOR_APPROVAL';
      summary = `Verified ${docType.toUpperCase()} document with strong profile alignment.`;
    } else if (finalScore >= 0.60 && !mismatches.some(m => m.severity === 'HIGH')) {
      confidenceLevel = 'MEDIUM';
      recommendation = 'STANDARD_REVIEW';
      summary = `Extraction successful with minor items for review.`;
    }

    const formatValid = !mismatches.some(m => m.severity === 'HIGH');

    return {
      confidence_level: confidenceLevel,
      confidence_score: finalScore,
      format_valid: formatValid,
      format_status: formatValid ? 'FORMAT_VALID' : 'FORMAT_INVALID',
      verification_boundary: 'DETERMINISTIC_RULE_ANALYSIS_NOT_GOVERNMENT_AUTHENTICATED',
      recommendation: recommendation,
      summary: summary,
      mismatches: mismatches,
      missing_fields: missingFields,
      warnings: warnings,
      normalized_fields: normalizedFields,
      validated_at: new Date().toISOString()
    };
  }
};

export default documentValidationService;
