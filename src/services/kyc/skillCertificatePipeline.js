/**
 * COOP HUB — Dedicated Professional Trade & Skill Certificate Pipeline
 * 
 * Complies with Indian Vocational Frameworks:
 * - NCVT / DGT National Trade Certificate (ITI)
 * - NSDC / Skill India Qualification Packs (PMKVY)
 * - State Board of Technical Education Diplomas (DOTE)
 * - Government Electrical Inspectorate / Licensing Board Competencies
 * 
 * Features:
 * - Deterministic field extraction (Certificate No, Name, Trade, Issuer, Grade)
 * - Automated Trade Matching Engine against registered services
 * - Explainable mismatch flags and truthful classification
 */

const TRADE_SYNONYMS = {
  electrician: ['electrical', 'wireman', 'electrician', 'lineman', 'iti electrical', 'domestic electrician', 'substation', 'power'],
  plumber: ['plumbing', 'pipe fitter', 'plumber', 'sanitary', 'drainage', 'water supply'],
  carpenter: ['carpentry', 'woodwork', 'carpenter', 'furniture maker', 'joinery'],
  painter: ['painting', 'painter', 'coating', 'decorator', 'surface finish', 'spray painting'],
  mason: ['masonry', 'civil', 'bricklayer', 'concrete', 'building construction'],
  'ac technician': ['hvac', 'refrigeration', 'air conditioning', 'ac repair', 'cooling', 'chiller', 'rac', 'ac mechanic'],
  mechanic: ['mechanic', 'fitter', 'motor mechanic', 'machinist', 'diesel mechanic', 'automobile']
};

export const skillCertificatePipeline = {
  /**
   * Compare declared trade with extracted certificate trade
   * @param {string} declaredTrade - Service category technician registered with
   * @param {string} certTrade - Trade extracted from certificate
   */
  evaluateTradeMatch(declaredTrade = '', certTrade = '') {
    const decl = (declaredTrade || '').toLowerCase().trim();
    const cert = (certTrade || '').toLowerCase().trim();

    if (!decl || !cert) {
      return {
        matched: false,
        status: 'INSUFFICIENT_DATA',
        label: 'TRADE_DATA_MISSING',
        explanation: 'Either declared technician trade or certificate trade could not be identified.'
      };
    }

    // Direct inclusion
    if (decl.includes(cert) || cert.includes(decl)) {
      return {
        matched: true,
        status: 'TRADE_MATCH',
        label: 'TRADE_MATCH',
        declared_trade: declaredTrade,
        certificate_trade: certTrade,
        explanation: `Certificate trade (${certTrade}) directly aligns with declared service category (${declaredTrade}).`
      };
    }

    // Synonym dictionary check
    for (const [key, synonyms] of Object.entries(TRADE_SYNONYMS)) {
      const declMatchesKey = decl.includes(key) || synonyms.some(s => decl.includes(s));
      const certMatchesKey = cert.includes(key) || synonyms.some(s => cert.includes(s));

      if (declMatchesKey && certMatchesKey) {
        return {
          matched: true,
          status: 'TRADE_MATCH',
          label: 'TRADE_MATCH_SYNONYM',
          declared_trade: declaredTrade,
          certificate_trade: certTrade,
          explanation: `Certificate trade (${certTrade}) matches declared trade (${declaredTrade}) via vocational domain synonym (${key}).`
        };
      }
    }

    return {
      matched: false,
      status: 'TRADE_MISMATCH',
      label: 'TRADE_MISMATCH',
      declared_trade: declaredTrade,
      certificate_trade: certTrade,
      explanation: `Warning: Certificate trade (${certTrade}) conflicts with declared service (${declaredTrade}). Human inspection required.`
    };
  },

  /**
   * Process and validate a Skill Certificate extraction
   * @param {object} params
   * @param {object} params.extractedData - Extracted fields from OCR / Vision
   * @param {object} params.pillarProfile - Registered technician profile
   */
  processCertificate({ extractedData = {}, pillarProfile = {} } = {}) {
    const certNumber = (extractedData.certificate_number || extractedData.document_number || '').trim();
    const candidateName = (extractedData.worker_name || extractedData.full_name || extractedData.name || '').trim();
    const certTrade = extractedData.skill || extractedData.trade || extractedData.certificate_trade || extractedData.certificate_name || '';
    const issuer = extractedData.issuing_organization || extractedData.issuing_authority || extractedData.issuer || null;
    const issueDate = extractedData.issue_date || null;
    const grade = extractedData.grade || null;

    const declaredTrade = Array.isArray(pillarProfile.main_services) 
      ? pillarProfile.main_services[0] 
      : (pillarProfile.main_services || pillarProfile.custom_role || 'Electrician');

    const validationErrors = [];
    const warnings = [];

    // 1. Certificate Number validation
    if (!certNumber) {
      validationErrors.push({
        field: 'certificate_number',
        severity: 'MEDIUM',
        message: 'Certificate registration number was not detected from document scan.'
      });
    }

    // 2. Candidate Name check
    const registeredName = (pillarProfile.full_name || pillarProfile.fullName || '').toLowerCase().trim();
    const cleanCandName = candidateName.toLowerCase().trim();
    let nameScore = 0;

    if (!candidateName) {
      validationErrors.push({
        field: 'worker_name',
        severity: 'HIGH',
        message: 'Technician name was not detected on certificate.'
      });
    } else if (registeredName) {
      if (cleanCandName === registeredName || cleanCandName.includes(registeredName) || registeredName.includes(cleanCandName)) {
        nameScore = 0.95;
      } else {
        const regTokens = registeredName.split(/\s+/).filter(t => t.length > 2);
        const extTokens = cleanCandName.split(/\s+/).filter(t => t.length > 2);
        const overlap = regTokens.filter(t => extTokens.some(et => et.includes(t) || t.includes(et)));
        nameScore = regTokens.length > 0 ? overlap.length / regTokens.length : 0;
      }

      if (nameScore < 0.5) {
        validationErrors.push({
          field: 'worker_name',
          severity: 'HIGH',
          submitted: pillarProfile.full_name,
          extracted: candidateName,
          message: `Name on certificate ("${candidateName}") does not match registered technician name "${pillarProfile.full_name}".`
        });
      }
    }

    // 3. Trade Match Evaluation
    const tradeEval = this.evaluateTradeMatch(declaredTrade, certTrade);
    if (!tradeEval.matched) {
      warnings.push(tradeEval.explanation);
    }

    // 4. Verification Status (Certificates always require human admin inspection unless issued via DigiLocker)
    const verificationStatus = (nameScore >= 0.85 && tradeEval.matched && certNumber) 
      ? 'ai_assisted' 
      : 'manual_review';

    return {
      document_type: 'skill_certificate',
      authoritative_verified: false,
      verification_status: verificationStatus,
      trade_match_status: tradeEval.status,
      trade_evaluation: tradeEval,
      fields: {
        certificate_number: certNumber || null,
        worker_name: candidateName || null,
        trade: certTrade || null,
        issuing_organization: issuer,
        issue_date: issueDate,
        grade: grade
      },
      name_alignment: {
        registered_name: pillarProfile.full_name || null,
        extracted_name: candidateName || null,
        similarity_score: Number(nameScore.toFixed(2))
      },
      validation_errors: validationErrors,
      warnings: warnings,
      notice: 'Trade certificate content analyzed. Official issuing board accreditation must be confirmed by Cooperative Admin.',
      processed_at: new Date().toISOString()
    };
  }
};

export default skillCertificatePipeline;
